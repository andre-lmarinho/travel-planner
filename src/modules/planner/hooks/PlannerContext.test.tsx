import { act, renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Activity, DayPlan } from "@/features/activity/types";
import { usePlanCollaboration } from "@/features/events/hooks/usePlanCollaboration";
import { PlannerProvider, usePlannerContext } from "@/modules/planner/hooks/PlannerContext";

vi.mock("@/features/events/hooks/usePlanCollaboration", () => ({
  usePlanCollaboration: vi.fn(),
}));

const { mockUpdatePlanDates } = vi.hoisted(() => ({ mockUpdatePlanDates: vi.fn() }));

vi.mock("@/trpc/react", () => ({
  trpc: { viewer: { plan: { updateDates: { useMutation: () => ({ mutateAsync: mockUpdatePlanDates }) } } } },
}));

const mockUsePlanCollaboration = vi.mocked(usePlanCollaboration);

type PersistDays = ReturnType<typeof usePlanCollaboration>["persistDays"];

let storedDays: DayPlan[] | undefined;
let persistDays: PersistDays;

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    title: "Museum",
    color: "blue",
    position: "1000",
    description: "",
    duration: 60,
    category: "sightseeing",
    ...overrides,
  };
}

function day(id: string, activities: Activity[] = []): DayPlan {
  return {
    id,
    label: `Day ${id}`,
    position: id,
    activities,
  };
}

function renderPlannerContext(
  props: Partial<React.ComponentProps<typeof PlannerProvider>> = {},
  options: { children?: React.ReactNode } = {}
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlannerProvider planId="plan-1" initialDays={[day("2024-01-01")]} {...props}>
      {options.children ?? children}
    </PlannerProvider>
  );

  return renderHook(() => usePlannerContext(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  storedDays = undefined;
  persistDays = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  mockUsePlanCollaboration.mockImplementation((_planId, options) => ({
    data: storedDays,
    persistDays,
    isLoading: false,
    error: undefined,
    version: options?.enabled === false ? 0 : 1,
  }));
  mockUpdatePlanDates.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn());
});

describe("PlannerProvider synchronization", () => {
  it("waits for collaboration state before persisting day changes", () => {
    const initialDays = [day("2024-01-01")];
    const { result, rerender } = renderPlannerContext({ initialDays });

    act(() => result.current.addBlankActivity(0));

    expect(persistDays.mutate).not.toHaveBeenCalled();

    storedDays = initialDays;
    rerender();

    act(() => result.current.addBlankActivity(0));

    expect(persistDays.mutate).toHaveBeenCalledTimes(1);
    expect(persistDays.mutate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "2024-01-01",
          activities: expect.arrayContaining([expect.objectContaining({ title: "" })]),
        }),
      ])
    );
  });

  it("uses stored days when collaboration data is available", () => {
    storedDays = [day("2024-02-01", [activity({ id: "stored-activity" })])];

    const { result } = renderPlannerContext({ initialDays: [day("2024-01-01")] });

    expect(result.current.days).toEqual(storedDays);
    expect(result.current.currentRange?.from?.toISOString()).toContain("2024-02-01");
  });
});

describe("PlannerProvider date ranges", () => {
  it("shortens the visible range and moves orphaned activities to the new last day", () => {
    const lastDayActivity = activity({ id: "last-day-activity" });
    const initialDays = [
      day("2024-01-01"),
      day("2024-01-02"),
      day("2024-01-03"),
      day("2024-01-04"),
      day("2024-01-05", [lastDayActivity]),
    ];
    const { result } = renderPlannerContext({ initialDays });

    act(() => {
      result.current.handleRangeChange({
        from: new Date("2024-01-01T00:00:00"),
        to: new Date("2024-01-04T00:00:00"),
      });
    });

    expect(result.current.days).toHaveLength(4);
    expect(result.current.days[3].id).toBe("2024-01-04");
    expect(result.current.days[3].activities).toEqual([lastDayActivity]);
    expect(mockUpdatePlanDates).toHaveBeenCalledWith({
      planId: "plan-1",
      from: "2024-01-01T00:00:00.000Z",
      to: "2024-01-04T00:00:00.000Z",
    });
  });

  it("does not persist date changes without edit permission", () => {
    const { result: readOnlyResult } = renderPlannerContext({ canEdit: false });
    act(() => {
      readOnlyResult.current.handleRangeChange({ from: new Date("2024-01-01T00:00:00") });
    });

    expect(mockUpdatePlanDates).not.toHaveBeenCalled();
  });

  it("ignores incomplete range changes", () => {
    const { result } = renderPlannerContext();

    act(() => result.current.handleRangeChange(undefined));

    expect(result.current.days).toEqual([day("2024-01-01")]);
    expect(mockUpdatePlanDates).not.toHaveBeenCalled();
  });
});

describe("PlannerProvider activity editing", () => {
  it("adds activities with title and suggestion data", async () => {
    const { result } = renderPlannerContext();

    await act(async () => {
      await result.current.addActivityWithTitle("2024-01-01", "Coffee", 0, {
        address: "Main Street",
        category: "food",
      });
    });

    expect(result.current.days[0].activities[0]).toEqual(
      expect.objectContaining({
        title: "Coffee",
        address: "Main Street",
        category: "food",
      })
    );
  });

  it("selects, updates, moves, reorders, and deletes an activity", () => {
    const selected = activity({ id: "selected", title: "Dinner" });
    const initialDays = [day("2024-01-01", [selected]), day("2024-01-02")];
    const { result } = renderPlannerContext({ initialDays });

    act(() => result.current.setSelectedActivity({ ...selected, dayId: "2024-01-01" }));
    expect(result.current.selectedActivity).toEqual(expect.objectContaining({ id: "selected" }));

    act(() => result.current.save({ title: "Late dinner" }));
    expect(result.current.days[0].activities[0].title).toBe("Late dinner");
    expect(result.current.selectedActivity?.title).toBe("Late dinner");

    act(() => result.current.changeColor("green"));
    expect(result.current.days[0].activities[0].color).toBe("green");

    act(() => result.current.changeDay("2024-01-02"));
    expect(result.current.days[0].activities).toEqual([]);
    expect(result.current.days[1].activities[0].id).toBe("selected");
    expect(result.current.selectedActivity?.dayId).toBe("2024-01-02");

    act(() => result.current.deleteActivity());
    expect(result.current.days[1].activities).toEqual([]);
    expect(result.current.selectedActivity).toBeNull();
  });

  it("handles blank editor operations when no day or activity is selected", () => {
    const { result } = renderPlannerContext();

    act(() => result.current.addBlankActivity(99));
    act(() => result.current.addBlankAndSelect(99));
    act(() => result.current.changeDay("missing-day"));
    act(() => result.current.changePosition(0));
    act(() => result.current.save({ title: "Ignored" }));
    act(() => result.current.deleteActivity());
    act(() => result.current.closeDialog());

    expect(result.current.days).toEqual([day("2024-01-01")]);
    expect(result.current.selectedActivity).toBeNull();
  });

  it("adds a blank activity and opens it in the editor", () => {
    const { result } = renderPlannerContext();

    act(() => result.current.addBlankAndSelect(0));

    expect(result.current.days[0].activities).toHaveLength(1);
    expect(result.current.selectedActivity).toEqual(
      expect.objectContaining({
        dayId: "2024-01-01",
        title: "",
      })
    );

    act(() => result.current.setSelectedActivity(null));
    expect(result.current.selectedActivity).toBeNull();
  });
});

describe("PlannerProvider destination coordinates", () => {
  it("geocodes destination names", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ latitude: 10, longitude: 20 }] }),
    } as Response);

    const { result } = renderPlannerContext({ dest: "Rome" });

    await waitFor(() => expect(result.current.destCoords).toEqual({ lat: 10, lng: 20 }));
    expect(fetch).toHaveBeenCalledWith("/api/places/city-country?text=Rome", {
      signal: expect.any(AbortSignal),
    });
  });

  it("keeps coordinates empty when destination is missing or geocoding fails", async () => {
    const { result } = renderPlannerContext({ dest: "Rome" });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current.destCoords).toBeNull();

    expect(result.current.destCoords).toBeNull();
  });
});

describe("PlannerProvider access flags", () => {
  it("exposes planner metadata and access control flags", () => {
    const { result } = renderPlannerContext({
      planId: "plan-2",
      dest: "Paris",
      viewerUserId: "user-1",
      isOwner: true,
      canManageMembers: true,
    });

    expect(result.current.planId).toBe("plan-2");
    expect(result.current.dest).toBe("Paris");
    expect(result.current.viewerUserId).toBe("user-1");
    expect(result.current.canEdit).toBe(true);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.canManageMembers).toBe(true);
  });
});

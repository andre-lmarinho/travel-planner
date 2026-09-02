import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { DayPlan } from "@/features/activity/types";
import type { EventInsert, EventRecord } from "@/features/events/types";
import type { Snapshot } from "@/features/snapshots/types";

import { usePlanCollaboration } from "./usePlanCollaboration";

const trpcMocks = vi.hoisted(() => {
  const fetchSnapshot = vi.fn<() => Promise<Snapshot>>();
  const fetchEvents = vi.fn<(input: { planId: string; sinceVersion: number }) => Promise<EventRecord[]>>();
  const appendEvents =
    vi.fn<
      (input: {
        planId: string;
        baseVersion: number;
        events: EventInsert[];
      }) => Promise<{ version: number; events: EventRecord[] }>
    >();
  const subscribeToPlan =
    vi.fn<(planId: string, handler: (event: EventRecord) => void) => { unsubscribe: () => void }>();
  const utils = {
    viewer: {
      snapshots: { get: { fetch: fetchSnapshot } },
      events: { list: { fetch: fetchEvents } },
    },
  };
  const appendMutation = { mutateAsync: appendEvents };
  return { fetchSnapshot, fetchEvents, appendEvents, subscribeToPlan, utils, appendMutation };
});

vi.mock("@/trpc/react", () => ({
  trpc: {
    useUtils: () => trpcMocks.utils,
    viewer: {
      events: { append: { useMutation: () => trpcMocks.appendMutation } },
    },
  },
}));

vi.mock("@/features/events/services/eventsRealtimeClient", () => ({
  __esModule: true,
  subscribeToEvents: trpcMocks.subscribeToPlan,
}));

const { fetchSnapshot, fetchEvents, appendEvents, subscribeToPlan } = trpcMocks;

describe("usePlanCollaboration", () => {
  const baseDay: DayPlan = {
    id: "2023-01-01",
    label: "Day 1",
    position: "1024",
    activities: [
      {
        id: "a1",
        title: "Breakfast",
        color: "bg-[var(--color-1)]",
        position: "1024",
      },
    ],
  };

  beforeEach(() => {
    fetchSnapshot.mockReset();
    fetchEvents.mockReset();
    appendEvents.mockReset();
    subscribeToPlan.mockReset();
    subscribeToPlan.mockReturnValue({ unsubscribe: vi.fn() });
  });

  test("loads snapshot and realtime events", async () => {
    fetchSnapshot.mockResolvedValue({
      version: 1,
      days: [baseDay],
      updatedAt: new Date().toISOString(),
    });
    const incomingEvent: EventRecord = {
      id: "evt-1",
      planId: "p1",
      version: 2,
      type: "activity.created",
      createdAt: new Date().toISOString(),
      payload: {
        dayId: baseDay.id,
        position: "2048",
        activity: {
          id: "a2",
          title: "Museum",
          color: "bg-[var(--color-2)]",
          position: "2048",
        },
      },
    };
    fetchEvents.mockResolvedValue([]);
    const listeners: Array<(event: EventRecord) => void> = [];
    subscribeToPlan.mockImplementation((_planId: string, handler: (event: EventRecord) => void) => {
      listeners.push(handler);
      return { unsubscribe: vi.fn() };
    });

    const { result } = renderHook(() => usePlanCollaboration("p1"));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    act(() => {
      for (const handler of listeners) {
        handler(incomingEvent);
      }
    });

    await waitFor(() => {
      expect(result.current.data?.[0].activities).toHaveLength(2);
    });
  });

  test("diffs updates and appends events with optimistic state", async () => {
    fetchSnapshot.mockResolvedValue({
      version: 1,
      days: [baseDay],
      updatedAt: new Date().toISOString(),
    });
    fetchEvents.mockResolvedValue([]);
    appendEvents.mockImplementation(
      async ({ events }: { planId: string; baseVersion: number; events: EventInsert[] }) => ({
        version: 2,
        events: events.map((event) => ({
          ...event,
          version: 2,
          createdAt: new Date().toISOString(),
        })) as EventRecord[],
      })
    );
    const wrapper = renderHook(() => usePlanCollaboration("p1"));
    await waitFor(() => expect(wrapper.result.current.data).toBeTruthy());

    const updatedDays: DayPlan[] = [
      {
        ...baseDay,
        activities: [
          {
            ...baseDay.activities[0],
            title: "Breakfast at hotel",
          },
        ],
      },
    ];

    await act(async () => {
      await wrapper.result.current.persistDays.mutateAsync(updatedDays);
    });

    expect(appendEvents).toHaveBeenCalled();
    const eventsArg = appendEvents.mock.calls[0][0].events;
    expect(eventsArg[0].type).toBe("activity.updated");
    expect(eventsArg[0].payload).toMatchObject({ activityId: "a1" });
  });

  test("resyncs when append response skips intermediate versions", async () => {
    const initialSnapshot: Snapshot = {
      version: 1,
      days: [baseDay],
      updatedAt: new Date().toISOString(),
    };
    const resyncedSnapshot: Snapshot = {
      version: 4,
      days: [
        {
          ...baseDay,
          activities: [
            {
              ...baseDay.activities[0],
              title: "Breakfast at hotel",
            },
            {
              id: "a-remote",
              title: "Lunch",
              color: "bg-[var(--color-3)]",
              position: "2048",
            },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    fetchSnapshot.mockResolvedValueOnce(initialSnapshot);
    fetchSnapshot.mockResolvedValueOnce(resyncedSnapshot);
    fetchEvents.mockResolvedValue([]);
    appendEvents.mockImplementation(
      async ({ events }: { planId: string; baseVersion: number; events: EventInsert[] }) => ({
        version: 4,
        events: events.map((event) => ({
          ...event,
          version: 4,
          createdAt: new Date().toISOString(),
        })) as EventRecord[],
      })
    );

    const { result } = renderHook(() => usePlanCollaboration("plan-resync"));
    await waitFor(() => expect(result.current.data).toBeTruthy());

    const updatedDays: DayPlan[] = [
      {
        ...baseDay,
        activities: [
          {
            ...baseDay.activities[0],
            title: "Breakfast at hotel",
          },
        ],
      },
    ];

    await act(async () => {
      await result.current.persistDays.mutateAsync(updatedDays);
    });

    await waitFor(() => {
      expect(fetchSnapshot).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(result.current.data?.[0].activities).toHaveLength(2);
      expect(result.current.version).toBe(4);
    });
  });
  test("keeps seeded days optimistic while collaboration loads", async () => {
    const initialDays = [baseDay];
    const updatedDays = [
      { ...baseDay, activities: [{ ...baseDay.activities[0], title: "Breakfast at hotel" }] },
    ];
    let resolveSnapshot: (snapshot: Snapshot) => void = () => undefined;
    fetchSnapshot.mockReturnValueOnce(
      new Promise<Snapshot>((resolve) => {
        resolveSnapshot = resolve;
      })
    );
    fetchEvents.mockResolvedValue([]);
    appendEvents.mockImplementation(async ({ events }) => ({
      version: 2,
      events: events.map((event) => ({
        ...event,
        version: 2,
        createdAt: new Date().toISOString(),
      })) as EventRecord[],
    }));

    const { result } = renderHook(() => usePlanCollaboration("p1", { initialDays }));
    expect(result.current.data).toEqual(initialDays);

    act(() => result.current.persistDays.mutate(updatedDays));
    expect(result.current.data?.[0].activities[0].title).toBe("Breakfast at hotel");

    resolveSnapshot({ version: 1, days: initialDays, updatedAt: new Date().toISOString() });
    await waitFor(() => expect(appendEvents).toHaveBeenCalled());
  });

  test("keeps deferred edits available after an append failure and retries them", async () => {
    const initialDays = [baseDay];
    const updatedDays = [
      { ...baseDay, activities: [{ ...baseDay.activities[0], title: "Breakfast at hotel" }] },
    ];
    const snapshot: Snapshot = {
      version: 1,
      days: initialDays,
      updatedAt: new Date().toISOString(),
    };
    fetchSnapshot.mockResolvedValue(snapshot);
    fetchEvents.mockResolvedValue([]);
    appendEvents.mockRejectedValueOnce(new Error("append failed"));
    appendEvents.mockImplementationOnce(async ({ events }) => ({
      version: 2,
      events: events.map((event) => ({
        ...event,
        version: 2,
        createdAt: new Date().toISOString(),
      })) as EventRecord[],
    }));

    const { result } = renderHook(() => usePlanCollaboration("p1", { initialDays }));
    act(() => result.current.persistDays.mutate(updatedDays));

    await waitFor(() => expect(appendEvents).toHaveBeenCalledTimes(1));
    expect(result.current.hasPendingChanges).toBe(true);

    await act(async () => {
      await result.current.retryPending();
    });

    expect(appendEvents).toHaveBeenCalledTimes(2);
    expect(result.current.hasPendingChanges).toBe(false);
  });

  test("rebases deferred operations onto remote changes", async () => {
    const initialDays = [baseDay];
    const updatedDays = [
      { ...baseDay, activities: [{ ...baseDay.activities[0], title: "Breakfast at hotel" }] },
    ];
    const remoteDays = [
      {
        ...baseDay,
        activities: [
          ...baseDay.activities,
          { id: "remote", title: "Museum", color: "bg-[var(--color-2)]", position: "2048" },
        ],
      },
    ];
    let resolveSnapshot: (snapshot: Snapshot) => void = () => undefined;
    fetchSnapshot.mockReturnValueOnce(
      new Promise<Snapshot>((resolve) => {
        resolveSnapshot = resolve;
      })
    );
    fetchEvents.mockResolvedValue([]);
    appendEvents.mockImplementation(async ({ events }) => ({
      version: 2,
      events: events.map((event) => ({
        ...event,
        version: 2,
        createdAt: new Date().toISOString(),
      })) as EventRecord[],
    }));

    const { result } = renderHook(() => usePlanCollaboration("p1", { initialDays }));
    act(() => result.current.persistDays.mutate(updatedDays));
    resolveSnapshot({ version: 1, days: remoteDays, updatedAt: new Date().toISOString() });

    await waitFor(() => expect(appendEvents).toHaveBeenCalled());

    const events = appendEvents.mock.calls[0][0].events;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("activity.updated");
    expect(result.current.data?.[0].activities).toHaveLength(2);
    expect(result.current.data?.[0].activities[0].title).toBe("Breakfast at hotel");
  });
});

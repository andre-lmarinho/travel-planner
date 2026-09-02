import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { PlannerExperience } from "@/features/plan/services/PlanService";
import type { PlannerMode } from "./components/ModeToggleButton";
import { PlanIdView } from "./planid-view";

const { updatePlanTitleMock } = vi.hoisted(() => ({
  updatePlanTitleMock: vi.fn().mockResolvedValue(undefined),
}));

const experience = {
  planId: "p1",
  destination: "Trip",
  viewerUserId: null,
  isDemo: false,
  canEdit: true,
  isOwner: false,
  canManageMembers: false,
  isPublic: false,
  initialDays: [],
  initialEntries: [],
} satisfies PlannerExperience;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: { viewer: { plan: { updateTitle: { useMutation: () => ({ mutateAsync: updatePlanTitleMock }) } } } },
}));

vi.mock("@/modules/planner/hooks/usePlannerDocument", () => ({
  usePlannerDocument: () => ({
    planId: "p1",
    days: [],
    setDays: vi.fn(),
    dest: "Trip",
    destCoords: null,
    currentRange: undefined,
    handleRangeChange: vi.fn(),
  }),
}));

vi.mock("@/modules/planner/views/BudgetView", () => ({
  BudgetView: () => <div data-testid="budget-board" />,
}));

vi.mock("@/modules/planner/views/MapView/MapView", () => ({
  __esModule: true,
  default: () => <div data-testid="map-board" />,
}));

vi.mock("@/modules/planner/components/ActivityDialog", () => ({
  ActivityDialog: () => null,
}));

vi.mock("@/modules/planner/components/SharePlannerDialog", () => ({
  SharePlannerDialog: () => null,
}));

vi.mock("@/modules/planner/components/DeletePlanDialog", () => ({
  DeletePlanDialog: () => null,
}));

vi.mock("@/modules/planner/components/ModeToggleButton", () => ({
  modeOrder: ["planner", "map", "budget"] as const,
  ModeToggleButton: ({ onChange }: { onChange: (mode: PlannerMode) => void }) => (
    <button type="button" onClick={() => onChange("map")}>
      Toggle
    </button>
  ),
}));

vi.mock("@/ui/components/calendar", () => ({
  DateRangePickerIcon: () => null,
}));

describe("PlanIdView", () => {
  it("restores the initial title when blurred empty", async () => {
    render(<PlanIdView experience={experience} />);

    const input = screen.getByLabelText("Planner title");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    await waitFor(() => expect(input).toHaveValue("Trip"));
    expect(updatePlanTitleMock).not.toHaveBeenCalled();
  });

  it("persists the title on blur when editable", async () => {
    render(<PlanIdView experience={experience} />);

    const input = screen.getByLabelText("Planner title");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(updatePlanTitleMock).toHaveBeenCalledWith({ planId: "p1", title: "New Title" })
    );
  });
});

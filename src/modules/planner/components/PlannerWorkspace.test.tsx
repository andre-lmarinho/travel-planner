import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import type { PlannerMode } from "./ModeToggleButton";
import { PlannerWorkspace } from "./PlannerWorkspace";

const { updatePlanTitleMock } = vi.hoisted(() => ({
  updatePlanTitleMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/trpc/react", () => ({
  trpc: { viewer: { plan: { updateTitle: { useMutation: () => ({ mutateAsync: updatePlanTitleMock }) } } } },
}));

vi.mock("@/features/plan/hooks/PlannerContext", () => ({
  PlannerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePlannerContext: () => ({
    planId: "p1",
    currentRange: undefined,
    handleRangeChange: vi.fn(),
    viewerUserId: null,
    days: [],
    updateActivity: vi.fn(),
  }),
}));

vi.mock("@/features/activity/components/dnd/PlannerBoard", () => ({
  PlannerBoard: () => <div data-testid="planner-board" />,
}));

vi.mock("@/features/budget/BudgetBoard", () => ({
  BudgetBoard: () => <div data-testid="budget-board" />,
}));

vi.mock("@/features/mapBoard/MapBoard", () => ({
  __esModule: true,
  default: () => <div data-testid="map-board" />,
}));

vi.mock("@/features/activity/components/dialog/ActivityDialog", () => ({
  ActivityDialog: () => null,
}));

vi.mock("@/features/members/SharePlannerDialog", () => ({
  SharePlannerDialog: () => null,
}));

vi.mock("@/features/plan/components/DeletePlanDialog", () => ({
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

describe("PlannerWorkspace", () => {
  it("restores the initial title when blurred empty", async () => {
    render(<PlannerWorkspace planId="p1" title="Trip" />);

    const input = screen.getByLabelText("Planner title");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    await waitFor(() => expect(input).toHaveValue("Trip"));
    expect(updatePlanTitleMock).not.toHaveBeenCalled();
  });

  it("persists the title on blur when editable", async () => {
    render(<PlannerWorkspace planId="p1" title="Trip" />);

    const input = screen.getByLabelText("Planner title");
    fireEvent.change(input, { target: { value: "New Title" } });
    fireEvent.blur(input);

    await waitFor(() =>
      expect(updatePlanTitleMock).toHaveBeenCalledWith({ planId: "p1", title: "New Title" })
    );
  });
});

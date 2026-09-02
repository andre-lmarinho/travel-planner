import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, DayPlan } from "@/features/activity/types";
import { TripView } from "./TripView";

const shared = vi.hoisted(() => ({ useDragHandlers: vi.fn(), getActivity: vi.fn() }));
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({ CSS: { Transform: { toString: () => undefined } } }));
vi.mock("@dnd-kit/modifiers", () => ({ restrictToWindowEdges: vi.fn() }));
vi.mock("@/features/activity/hooks/useActivityColors", () => ({
  useActivityColors: () => ({ bg: "bg-[var(--color-1)]" }),
}));
vi.mock("@/features/activity/lib/activityOperations", () => ({
  getActivity: (...args: unknown[]) => shared.getActivity(...args),
}));
vi.mock("@/modules/planner/hooks/useDragHandlers", () => ({
  useDragHandlers: (...args: unknown[]) => shared.useDragHandlers(...args),
}));
vi.mock("@/ui/components/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const activity: Activity = { id: "activity-1", title: "Museum", color: "bg-[var(--color-1)]" };
const days: DayPlan[] = [
  { id: "day-1", label: "Mon, 05 Jul", activities: [activity] },
  { id: "day-2", label: "Tue, 06 Jul", activities: [] },
];
beforeEach(() => {
  shared.useDragHandlers.mockReturnValue({
    activeId: null,
    sensors: [],
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  });
  shared.getActivity.mockReset();
});
describe("TripView", () => {
  it("renders the itinerary and selects an activity", () => {
    const onActivitySelect = vi.fn();
    render(
      <TripView
        days={days}
        canEdit
        onActivitySelect={onActivitySelect}
        onDaysChange={vi.fn()}
        onFallbackAdd={vi.fn()}
      />
    );
    expect(screen.getByText("Itinerary")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mon, 05 Jul" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Museum" }));
    expect(onActivitySelect).toHaveBeenCalledWith(activity, "day-1");
  });
  it("hides and restores the itinerary", () => {
    render(
      <TripView
        days={days}
        canEdit
        onActivitySelect={vi.fn()}
        onDaysChange={vi.fn()}
        onFallbackAdd={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Hide itinerary" }));
    expect(screen.getByRole("button", { name: "Show itinerary" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show itinerary" }));
    expect(screen.getByText("Itinerary")).toBeInTheDocument();
  });
  it("collapses all days and delegates adding", () => {
    const onFallbackAdd = vi.fn();
    render(
      <TripView
        days={days}
        canEdit
        onActivitySelect={vi.fn()}
        onDaysChange={vi.fn()}
        onFallbackAdd={onFallbackAdd}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Collapse all days" }));
    expect(screen.queryByText("Museum")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand all days" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Add activity" })[0]);
    expect(onFallbackAdd).toHaveBeenCalledWith("day-1", 1);
  });
});

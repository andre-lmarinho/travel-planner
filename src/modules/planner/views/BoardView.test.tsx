import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Activity, DayPlan } from "@/features/activity/types";

import { BoardView } from "./BoardView";

const shared = vi.hoisted(() => ({
  useDragHandlersMock: vi.fn(),
  getActivityMock: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  closestCenter: vi.fn(() => []),
  pointerWithin: vi.fn(() => []),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
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
vi.mock("@/features/activity/lib/activityOperations", () => ({
  getActivity: (...args: unknown[]) => shared.getActivityMock(...args),
}));
vi.mock("@/modules/planner/hooks/useDragHandlers", () => ({
  useDragHandlers: (...args: unknown[]) => shared.useDragHandlersMock(...args),
}));

const activity: Activity = { id: "a1", title: "Museum", color: "bg-[var(--color-1)]" };
const days: DayPlan[] = [
  { id: "d1", label: "Mon, 05 Jul", activities: [activity] },
  { id: "d2", label: "Tue, 06 Jul", activities: [] },
];

beforeEach(() => {
  shared.useDragHandlersMock.mockReturnValue({
    activeId: null,
    sensors: [],
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  });
  shared.getActivityMock.mockReset();
});

describe("BoardView", () => {
  it("renders days and activities", () => {
    render(<BoardView days={days} />);

    expect(screen.getByText("Mon, 05 Jul")).toBeInTheDocument();
    expect(screen.getByText("Museum")).toBeInTheDocument();
    expect(screen.getByText("Tue, 06 Jul")).toBeInTheDocument();
  });

  it("delegates adding an activity to the dialog callback", () => {
    const onAddActivity = vi.fn();
    render(<BoardView days={days} onFallbackAdd={onAddActivity} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Add activity" })[0]);

    expect(onAddActivity).toHaveBeenCalledWith("d1", 1);
  });
});

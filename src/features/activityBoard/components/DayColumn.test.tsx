import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Activity, DayPlan } from "@/features/activity/types";

import type { ActivityCardProps } from "./ActivityCard";
import { DayColumn } from "./DayColumn";
import type { DraggableCardProps } from "./DraggableCard";

const shared = vi.hoisted(() => ({
  draggableCardSpy: vi.fn(),
  activityCardSpy: vi.fn(),
  addActivitySpy: vi.fn(),
  setNodeRef: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: shared.setNodeRef, isOver: false }),
  useDndContext: () => ({ active: null }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@/features/activityDialog/components/AddActivity", () => ({
  AddActivity: (props: { dayId: string; insertIndex: number }) => {
    shared.addActivitySpy(props);
    return <div data-testid={`add-${props.insertIndex}`} />;
  },
}));

vi.mock("./DraggableCard", () => ({
  DraggableCard: (props: DraggableCardProps) => {
    shared.draggableCardSpy(props);
    return <button type="button" data-testid={`draggable-${props.id}`} onClick={props.onSelect} />;
  },
}));

vi.mock("./ActivityCard", () => ({
  ActivityCard: (props: ActivityCardProps) => {
    shared.activityCardSpy(props);
    return <div data-testid={`activity-${props.activity.id}`} />;
  },
}));

const baseActivity: Activity = {
  id: "a1",
  title: "Walk",
  color: "bg-[var(--color-1)]",
};

const baseDay: DayPlan = {
  id: "d1",
  label: "Day 1",
  activities: [baseActivity],
};

describe("DayColumn", () => {
  beforeAll(() => {
    if (!HTMLElement.prototype.scrollTo) {
      Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), writable: true });
    }
  });

  beforeEach(() => {
    shared.draggableCardSpy.mockClear();
    shared.activityCardSpy.mockClear();
    shared.addActivitySpy.mockClear();
    shared.setNodeRef.mockClear();
  });

  it("passes activity and triggers onActivitySelect when draggable card is clicked", () => {
    const handleSelect = vi.fn();

    render(<DayColumn day={baseDay} canEdit={true} onActivitySelect={handleSelect} />);

    fireEvent.click(screen.getByTestId("draggable-a1"));

    expect(handleSelect).toHaveBeenCalledWith(baseActivity, baseDay.id);
    expect(shared.draggableCardSpy).toHaveBeenCalledWith(expect.objectContaining({ activity: baseActivity }));
  });

  it("renders non-editable activities", () => {
    render(<DayColumn day={baseDay} canEdit={false} />);

    expect(shared.draggableCardSpy).not.toHaveBeenCalled();
    expect(shared.activityCardSpy).toHaveBeenCalledWith(expect.objectContaining({ activity: baseActivity }));
  });
});

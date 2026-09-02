"use client";

import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { MouseEvent as ReactMouseEvent } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EMPTY_ACTIVITY_TITLE } from "@/features/activity/constants";
import { useCardColors } from "@/features/activity/hooks/useActivityColors";
import { getActivity } from "@/features/activity/lib/activityOperations";
import type { Activity, DayPlan } from "@/features/activity/types";
import { AddActivity } from "@/features/activityDialog/components/AddActivity";
import { useDragHandlers } from "@/modules/planner/hooks/useDragHandlers";
import { containerCollisionDetection } from "@/modules/planner/lib/dragUtils";
import { DollarSign, Hourglass } from "@/ui/components/icon";
import { cn } from "@/ui/utils/cn";

interface BoardProps {
  days: DayPlan[];
  canEdit?: boolean;
  onActivitySelect?: (activity: Activity, dayId: string) => void;
  onDaysChange?: (days: DayPlan[]) => void;
  onFallbackAdd?: (dayId: string, index: number) => void;
}

interface DayColumnProps {
  day: DayPlan;
  dayNumber?: number;
  canEdit?: boolean;
  onActivitySelect?: (activity: Activity, dayId: string) => void;
  onFallbackAdd?: (dayId: string, index: number) => void;
}

const isInteractiveElement = (el: EventTarget | null): boolean =>
  el instanceof Element &&
  el.closest(
    'button, a, input, textarea, select, [role="button"], [draggable="true"], [data-no-drag-scroll]'
  ) !== null;

export const BoardView = memo(function Board({
  days,
  canEdit = true,
  onActivitySelect,
  onDaysChange,
  onFallbackAdd,
}: BoardProps) {
  const [draftDays, setDraftDays] = useState(days);
  const handleDaysCommit = useCallback(
    (nextDays: BoardProps["days"]) => {
      onDaysChange?.(nextDays);
    },
    [onDaysChange]
  );
  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useDragHandlers(draftDays, { onDaysChange: setDraftDays, onDaysCommit: handleDaysCommit });
  const boardRef = useRef<HTMLUListElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  // Sync draftDays with props when not dragging
  useEffect(() => {
    if (!activeId) setDraftDays(days);
  }, [activeId, days]);

  // Get active activity for drag overlay
  const activeActivity = useMemo(() => {
    if (!activeId) return null;
    return getActivity(draftDays, String(activeId));
  }, [activeId, draftDays]);

  // Drag scroll on non-interactive areas
  const handleMouseDown = (e: ReactMouseEvent<HTMLUListElement>) => {
    if (activeId) return;
    if (isInteractiveElement(e.target)) return;

    const startX = e.clientX;
    const scrollLeft = boardRef.current?.scrollLeft || 0;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (boardRef.current) {
        boardRef.current.scrollLeft = scrollLeft + (startX - e.clientX);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      dragCleanupRef.current = null;
    };

    dragCleanupRef.current = handleMouseUp;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <DndContext
      id="activity-board"
      sensors={sensors}
      collisionDetection={containerCollisionDetection}
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}>
      <ul
        ref={boardRef}
        aria-label="Days"
        onMouseDown={handleMouseDown}
        className="bg-background m-0 flex h-full flex-1 list-none gap-3 overflow-x-auto overflow-y-hidden rounded-2xl border p-2 select-none cursor-default md:gap-4 md:p-4">
        {draftDays.map((day, dayIndex) => (
          <li key={day.id} className="w-[min(82vw,20rem)] shrink-0 md:w-72 lg:w-80">
            <DayColumn
              day={day}
              dayNumber={dayIndex + 1}
              canEdit={canEdit}
              onActivitySelect={onActivitySelect}
              onFallbackAdd={onFallbackAdd}
            />
          </li>
        ))}
      </ul>

      {canEdit && (
        <DragOverlay>
          {activeActivity && (
            <DraggableCard id={activeActivity.id} activity={activeActivity} dragOverlay aria-grabbed="true" />
          )}
        </DragOverlay>
      )}
    </DndContext>
  );
});
export interface ActivityCardProps {
  activity: Activity;
  onSelect?: () => void;
  onClick?: () => void;
  bgColor?: string;
}

export const ActivityCard = memo(function ActivityCard({
  activity,
  onSelect,
  onClick,
  bgColor,
}: ActivityCardProps) {
  const { title, duration, budget, color, imageUrl } = activity;

  const { border: borderColorClass } = useCardColors(
    color && !color.startsWith("#") ? color : undefined,
    bgColor
  );

  const durationValue = duration ?? 0;
  const budgetValue = budget ?? 0;

  const handleClick = () => {
    onSelect?.();
    onClick?.();
  };

  return (
    <article className="group relative">
      <button
        type="button"
        className="focus-visible:ring-ring w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={handleClick}>
        <div
          className={cn(
            "relative flex w-full cursor-grab flex-col overflow-hidden rounded-xl border-2 bg-background text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
            borderColorClass
          )}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={400}
              height={200}
              className="h-28 w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="min-w-0 px-4 py-3 pl-5">
            <h3 className="truncate text-sm font-semibold leading-5">
              {title.trim() ? title : EMPTY_ACTIVITY_TITLE}
            </h3>
            {activity.description ? (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-4">
                {activity.description}
              </p>
            ) : null}
            {durationValue > 0 || budgetValue > 0 ? (
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {durationValue > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Hourglass size={13} aria-hidden="true" />
                    <span>{durationValue}h</span>
                  </span>
                ) : null}
                {budgetValue > 0 ? (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <DollarSign size={13} aria-hidden="true" />
                    <span>{budgetValue.toLocaleString("en-US")}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    </article>
  );
});

export interface DraggableCardProps {
  id: string;
  activity: Activity;
  onSelect?: () => void;
  dragOverlay?: boolean;
  className?: string;
  bgColor?: string;
}

export const DraggableCard = memo(function DraggableCard({
  id,
  activity,
  onSelect,
  bgColor,
  dragOverlay = false,
  className,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges: () => false,
  });

  if (dragOverlay) {
    return (
      <div
        className={cn(
          "bg-background pointer-events-none origin-bottom rotate-2 cursor-grabbing rounded-xl border shadow-lg opacity-95 backdrop-blur-md",
          className
        )}>
        <ActivityCard activity={activity} onSelect={onSelect} bgColor={bgColor} />
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative touch-none list-none transition-opacity duration-200",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      data-no-drag-scroll
      {...attributes}
      {...listeners}>
      <div className={cn(isDragging && "opacity-0")}>
        <ActivityCard activity={activity} onSelect={onSelect} bgColor={bgColor} />
      </div>
      {isDragging && (
        <div className="bg-primary/5 border-primary/50 absolute inset-0 rounded-xl border-2 border-dashed" />
      )}
    </div>
  );
});

export const DayColumn = memo(function DayColumn({
  day,
  dayNumber,
  canEdit = true,
  onActivitySelect,
  onFallbackAdd,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    disabled: !canEdit,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (day.activities.length <= 1) {
      scrollRef.current?.scrollTo?.(0, 0);
    }
  }, [day.activities.length]);

  const activityIds = useMemo(() => day.activities.map((a) => a.id), [day.activities]);

  return (
    <section
      ref={canEdit ? setNodeRef : undefined}
      className={cn(
        "bg-card flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow motion-reduce:transition-none",
        isOver && canEdit && "ring-primary/40 shadow-md ring-2"
      )}>
      <div className="flex items-center justify-between gap-3 border-b px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {dayNumber ? (
            <span className="bg-primary text-primary-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums">
              {dayNumber}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{day.label}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {day.activities.length} {day.activities.length === 1 ? "activity" : "activities"}
            </p>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div
        ref={scrollRef}
        data-testid="day-scroll"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto space-y-3 px-2 py-2 [scrollbar-color:var(--border)_transparent] scrollbar-thin [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
        {canEdit ? (
          <SortableContext id={day.id} items={activityIds} strategy={verticalListSortingStrategy}>
            {day.activities.map((activity) => (
              <DraggableCard
                key={activity.id}
                id={activity.id}
                activity={activity}
                onSelect={() => onActivitySelect?.(activity, day.id)}
                bgColor={activity.color}
              />
            ))}
          </SortableContext>
        ) : (
          day.activities.map((activity) => (
            <div key={activity.id} className="mb-3 last:mb-0">
              <ActivityCard activity={activity} bgColor={activity.color} />
            </div>
          ))
        )}
      </div>

      {canEdit ? (
        <div className="border-t px-2 py-2">
          <AddActivity dayId={day.id} insertIndex={day.activities.length} onAddActivity={onFallbackAdd} />
        </div>
      ) : null}
    </section>
  );
});

BoardView.displayName = "BoardView";
export default BoardView;

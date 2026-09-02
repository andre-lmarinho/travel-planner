"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useEffect, useMemo, useRef } from "react";

import { AddActivity } from "@/features/activityDialog/components/AddActivity";
import { cn } from "@/ui/utils/cn";

import type { DayColumnProps } from "../types";
import { ActivityCard } from "./ActivityCard";
import { DraggableCard } from "./DraggableCard";

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
      scrollRef.current?.scrollTo(0, 0);
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

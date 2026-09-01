"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Activity } from "@/features/activity/types";
import { AddActivity } from "@/features/activityDialog/components/AddActivity";
import { InlineActivity } from "@/features/activityDialog/components/InlineActivity";
import { cn } from "@/ui/utils/cn";

import type { DayColumnProps } from "../types";
import { ActivityCard } from "./ActivityCard";
import { DraggableCard } from "./DraggableCard";

export const DayColumn = memo(function DayColumn({
  day,
  canEdit = true,
  onActivitySelect,
  onAddActivity,
  onFallbackAdd,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    disabled: !canEdit,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeInlineIndex, setActiveInlineIndex] = useState<number | null>(null);

  useEffect(() => {
    if (day.activities.length <= 1) {
      scrollRef.current?.scrollTo(0, 0);
    }
  }, [day.activities.length]);

  const activityIds = useMemo(() => day.activities.map((a) => a.id), [day.activities]);

  const handleOpenInline = useCallback((index: number) => {
    setActiveInlineIndex(index);
  }, []);

  const handleCloseInline = useCallback(() => {
    setActiveInlineIndex(null);
  }, []);

  const handleAdvanceInline = useCallback((nextIndex: number) => {
    setActiveInlineIndex(nextIndex);
  }, []);

  const handleInlineSubmit = useCallback(
    async (title: string, suggestion?: Partial<Activity>): Promise<Activity | null> => {
      if (!onAddActivity) return null;
      const currentIndex = activeInlineIndex ?? day.activities.length;
      const activity = await onAddActivity(day.id, title, currentIndex, suggestion);
      return activity;
    },
    [day.id, day.activities.length, activeInlineIndex, onAddActivity]
  );

  return (
    <section
      ref={canEdit ? setNodeRef : undefined}
      className={cn("flex h-full flex-1 flex-col", isOver && canEdit && "ring-primary/40 ring-2")}>
      {/* Header */}
      <div className="text-muted-foreground flex px-3 pt-2">
        <h2 className="text-sm font-semibold">{day.label}</h2>
      </div>

      {/* Activities */}
      <div ref={scrollRef} data-testid="day-scroll" className="overflow-x-hidden overflow-y-auto pt-2">
        {canEdit ? (
          <SortableContext id={day.id} items={activityIds} strategy={verticalListSortingStrategy}>
            {day.activities.map((activity, idx) => (
              <React.Fragment key={activity.id}>
                {activeInlineIndex === idx ? (
                  <InlineActivity
                    dayId={day.id}
                    insertIndex={idx}
                    onSubmit={handleInlineSubmit}
                    onClose={handleCloseInline}
                    onAdvanceInline={handleAdvanceInline}
                    className="my-2"
                  />
                ) : (
                  <AddActivity
                    placement="between"
                    dayId={day.id}
                    insertIndex={idx}
                    onInlineOpen={handleOpenInline}
                    onFallbackAdd={onFallbackAdd}
                  />
                )}
                <DraggableCard
                  id={activity.id}
                  activity={activity}
                  onSelect={() => onActivitySelect?.(activity, day.id)}
                  bgColor={activity.color}
                />
              </React.Fragment>
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

      {/* Add button at bottom */}
      {canEdit && (
        <div className="py-2">
          {activeInlineIndex === day.activities.length ? (
            <InlineActivity
              dayId={day.id}
              insertIndex={day.activities.length}
              onSubmit={handleInlineSubmit}
              onClose={handleCloseInline}
              onAdvanceInline={handleAdvanceInline}
            />
          ) : (
            <AddActivity
              dayId={day.id}
              insertIndex={day.activities.length}
              onInlineOpen={handleOpenInline}
              onFallbackAdd={onFallbackAdd}
              isInlineOpen={activeInlineIndex === day.activities.length}
              isHidden={activeInlineIndex !== null}
            />
          )}
        </div>
      )}
    </section>
  );
});

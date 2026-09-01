"use client";

import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { ACTIVITY_TEXT } from "@/features/activity/constants";
import { useActivityColors } from "@/features/activity/hooks/useActivityColors";
import { getActivity } from "@/features/activity/lib/activityOperations";
import type { Activity, DayPlan } from "@/features/activity/types";
import { useDragHandlers } from "@/features/activityBoard/hooks/useDragHandlers";
import { containerCollisionDetection } from "@/features/activityBoard/lib/dragUtils";
import { ChevronDown, Eye, EyeOff, GripVertical, List, Plus } from "@/ui/components/icon";
import { Tooltip } from "@/ui/components/tooltip";
import { cn } from "@/ui/utils/cn";

interface TripOverviewProps {
  days: DayPlan[];
  canEdit: boolean;
  onActivitySelect: (activity: Activity, dayId: string) => void;
  onDaysChange: (days: DayPlan[]) => void;
  onFallbackAdd: (dayId: string, index: number) => void;
}

function TripActivityCard({
  activity,
  onSelect,
  dragHandle,
}: {
  activity: Activity;
  onSelect?: () => void;
  dragHandle?: ReactNode;
}) {
  const { bg } = useActivityColors(activity.color);
  const title = activity.title.trim() || ACTIVITY_TEXT.untitledFallback;

  return (
    <article className="group relative overflow-hidden">
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bg)} />
      {/* A native button cannot contain the drag-handle button. */}
      {/* biome-ignore lint/a11y/useSemanticElements: preserves the required nested drag handle semantics. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        data-no-drag-scroll
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          onSelect?.();
        }}
        className="hover:bg-muted/60 focus-visible:ring-ring flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2.5 pl-4 text-left transition focus-visible:ring-2 focus-visible:ring-inset">
        <span
          aria-hidden="true"
          className={cn("relative size-9 shrink-0 overflow-hidden rounded-full", !activity.imageUrl && bg)}>
          {activity.imageUrl ? (
            <Image
              src={activity.imageUrl}
              alt=""
              width={72}
              height={72}
              className="size-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-sm font-medium">{title}</span>
            {activity.startTime ? (
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {activity.startTime}
              </span>
            ) : null}
          </span>
          {activity.description ? (
            <span className="text-muted-foreground mt-1 block truncate text-xs">{activity.description}</span>
          ) : null}
        </span>
        {dragHandle}
      </div>
    </article>
  );
}

function SortableTripActivity({ activity, onSelect }: { activity: Activity; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
    animateLayoutChanges: () => false,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "opacity-0")}>
      <TripActivityCard
        activity={activity}
        onSelect={onSelect}
        dragHandle={
          <Tooltip content="Reorder activity">
            <button
              type="button"
              aria-label={`Reorder ${activity.title || ACTIVITY_TEXT.untitledFallback}`}
              className="text-muted-foreground hover:bg-muted focus-visible:ring-ring mr-1 inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md transition active:cursor-grabbing focus-visible:ring-2"
              {...attributes}
              {...listeners}
              onClick={(event) => event.stopPropagation()}>
              <GripVertical size={16} aria-hidden="true" />
            </button>
          </Tooltip>
        }
      />
    </div>
  );
}

interface TripDayProps {
  day: DayPlan;
  dayNumber: number;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
  canEdit: boolean;
  onActivitySelect: (activity: Activity, dayId: string) => void;
  onFallbackAdd: (dayId: string, index: number) => void;
}

function TripDay({
  day,
  dayNumber,
  isCollapsed,
  onCollapsedChange,
  canEdit,
  onActivitySelect,
  onFallbackAdd,
}: TripDayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: day.id, disabled: !canEdit });
  const activityIds = useMemo(() => day.activities.map((activity) => activity.id), [day.activities]);
  const insertIndex = day.activities.length;
  const handleAdd = () => {
    onCollapsedChange(false);
    onFallbackAdd(day.id, insertIndex);
  };

  return (
    <li
      ref={canEdit ? setNodeRef : undefined}
      className={cn("bg-background overflow-hidden border-b", isOver && "ring-primary/40 ring-2")}>
      <div className="bg-muted/55 flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-primary text-primary-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
            {dayNumber}
          </span>
          <h2 className="truncate text-sm font-semibold">{day.label}</h2>
        </div>
        <div className="flex items-center gap-1">
          {canEdit ? (
            <Tooltip content="Add activity">
              <button
                type="button"
                onClick={handleAdd}
                aria-label="Add activity"
                className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition focus-visible:ring-2">
                <Plus size={15} aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}
          <Tooltip content={isCollapsed ? "Expand day" : "Collapse day"}>
            <button
              type="button"
              onClick={() => onCollapsedChange(!isCollapsed)}
              aria-label={isCollapsed ? "Expand day" : "Collapse day"}
              aria-expanded={!isCollapsed}
              className="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition focus-visible:ring-2">
              <ChevronDown
                className={cn("size-4 transition-transform", isCollapsed && "-rotate-90")}
                aria-hidden="true"
              />
            </button>
          </Tooltip>
        </div>
      </div>
      {!isCollapsed ? (
        <div className="border-t divide-y divide-border">
          {canEdit ? (
            <SortableContext id={day.id} items={activityIds} strategy={verticalListSortingStrategy}>
              {day.activities.map((activity) => (
                <SortableTripActivity
                  key={activity.id}
                  activity={activity}
                  onSelect={() => onActivitySelect(activity, day.id)}
                />
              ))}
            </SortableContext>
          ) : (
            day.activities.map((activity) => (
              <TripActivityCard
                key={activity.id}
                activity={activity}
                onSelect={() => onActivitySelect(activity, day.id)}
              />
            ))
          )}
          {day.activities.length === 0 ? (
            <div className="bg-muted/20 px-3 py-6 text-sm">
              <p className="font-medium">Nothing planned yet</p>
              <p className="text-muted-foreground mt-1 text-xs">Add a stop to start shaping this day.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function TripOverview({
  days,
  canEdit,
  onActivitySelect,
  onDaysChange,
  onFallbackAdd,
}: TripOverviewProps) {
  const [isItineraryOpen, setIsItineraryOpen] = useState(true);
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(() => new Set());
  const [draftDays, setDraftDays] = useState(days);
  const { activeId, sensors, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } =
    useDragHandlers(draftDays, { onDaysChange: setDraftDays, onDaysCommit: onDaysChange });

  useEffect(() => {
    if (!activeId) setDraftDays(days);
  }, [activeId, days]);

  const activeActivity = useMemo(
    () => (activeId ? getActivity(draftDays, String(activeId)) : null),
    [activeId, draftDays]
  );
  const areAllDaysCollapsed = draftDays.length > 0 && collapsedDayIds.size === draftDays.length;
  const toggleAllDays = () => {
    setCollapsedDayIds(areAllDaysCollapsed ? new Set() : new Set(draftDays.map((day) => day.id)));
  };

  return (
    <section className="pointer-events-none relative h-full min-h-0 overflow-hidden rounded-xl">
      {isItineraryOpen ? (
        <aside className="bg-card pointer-events-auto absolute top-4 bottom-4 left-4 flex w-[min(20rem,calc(100%-2rem))] flex-col overflow-hidden rounded-xl border shadow-md">
          <div className="flex items-center justify-between border-b py-2 px-3">
            <p className="text-sm font-semibold">Itinerary</p>
            <div className="flex items-center gap-1">
              <Tooltip content={areAllDaysCollapsed ? "Expand all days" : "Collapse all days"}>
                <button
                  type="button"
                  onClick={toggleAllDays}
                  aria-label={areAllDaysCollapsed ? "Expand all days" : "Collapse all days"}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition focus-visible:ring-2">
                  <ChevronDown
                    className={cn("size-4 transition-transform", areAllDaysCollapsed && "-rotate-90")}
                    aria-hidden="true"
                  />
                </button>
              </Tooltip>
              <Tooltip content="Hide itinerary">
                <button
                  type="button"
                  onClick={() => setIsItineraryOpen(false)}
                  aria-label="Hide itinerary"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition focus-visible:ring-2">
                  <EyeOff size={16} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>
          <DndContext
            id="trip-itinerary"
            sensors={sensors}
            collisionDetection={containerCollisionDetection}
            modifiers={[restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}>
            {draftDays.length > 0 ? (
              <ol className="flex-1 overflow-y-auto [scrollbar-color:var(--border)_transparent] scrollbar-thin [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
                {draftDays.map((day, dayIndex) => (
                  <TripDay
                    key={day.id}
                    day={day}
                    dayNumber={dayIndex + 1}
                    isCollapsed={collapsedDayIds.has(day.id)}
                    onCollapsedChange={(isCollapsed) => {
                      setCollapsedDayIds((previous) => {
                        const next = new Set(previous);
                        if (isCollapsed) next.add(day.id);
                        else next.delete(day.id);
                        return next;
                      });
                    }}
                    canEdit={canEdit}
                    onActivitySelect={onActivitySelect}
                    onFallbackAdd={onFallbackAdd}
                  />
                ))}
              </ol>
            ) : (
              <div className="m-4 rounded-lg border border-dashed p-5 text-center">
                <List className="text-muted-foreground mx-auto mb-3" size={20} aria-hidden="true" />
                <p className="text-sm font-semibold">Your itinerary starts with dates</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Choose the trip dates above, then add activities to each day.
                </p>
              </div>
            )}
            <DragOverlay>
              {activeActivity ? <TripActivityCard activity={activeActivity} /> : null}
            </DragOverlay>
          </DndContext>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsItineraryOpen(true)}
          className="bg-card hover:bg-muted focus-visible:ring-ring pointer-events-auto absolute top-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-md transition focus-visible:ring-2 focus-visible:ring-offset-2">
          <List size={16} aria-hidden="true" />
          Show itinerary
          <Eye size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

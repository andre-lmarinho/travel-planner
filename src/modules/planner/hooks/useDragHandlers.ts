"use client";

import type { DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useCallback, useRef, useState } from "react";

import type { DayPlan } from "@/features/activity/types";

import { applyDragMove, buildIndexMaps, getDragTarget } from "../lib/dragUtils";

interface UseDragHandlersOptions {
  onDaysChange?: (days: DayPlan[]) => void;
  onDaysCommit?: (days: DayPlan[]) => void;
}

/**
 * Hook providing drag-and-drop handlers for the activity board.
 */
export function useDragHandlers(days: DayPlan[], options: UseDragHandlersOptions = {}) {
  const { onDaysChange, onDaysCommit } = options;

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const lastOverRef = useRef<DragOverEvent["over"] | null>(null);
  const frameRef = useRef<number | null>(null);
  const daysRef = useRef(days);
  const didMoveRef = useRef(false);

  // Build index maps from current days
  const { dayMap, activityMap } = buildIndexMaps(days);
  const dayMapRef = useRef(dayMap);
  const activityMapRef = useRef(activityMap);
  dayMapRef.current = dayMap;
  activityMapRef.current = activityMap;
  daysRef.current = days;

  // Sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 0, tolerance: 4 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    lastOverRef.current = null;
    didMoveRef.current = false;
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      lastOverRef.current = over;

      // Throttle with requestAnimationFrame
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;

        const currentDays = daysRef.current;
        const latestOver = lastOverRef.current;
        if (!latestOver) return;
        const target = getDragTarget(currentDays, latestOver, dayMapRef.current, activityMapRef.current);
        if (!target) return;

        const newDays = applyDragMove(currentDays, String(active.id), target, activityMapRef.current);
        if (newDays !== currentDays) {
          didMoveRef.current = true;
          onDaysChange?.(newDays);
        }
      });
    },
    [onDaysChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over: eventOver } = event;
      const over = eventOver ?? lastOverRef.current;
      const currentDays = daysRef.current;
      let nextDays = currentDays;

      if (over && active.id !== over.id) {
        const target = getDragTarget(currentDays, over, dayMapRef.current, activityMapRef.current);
        if (target) {
          nextDays = applyDragMove(currentDays, String(active.id), target, activityMapRef.current);
          if (nextDays !== currentDays) {
            didMoveRef.current = true;
            onDaysChange?.(nextDays);
          }
        }
      }

      if (didMoveRef.current) {
        onDaysCommit?.(nextDays);
      }

      setActiveId(null);
      lastOverRef.current = null;
      didMoveRef.current = false;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    },
    [onDaysChange, onDaysCommit]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    lastOverRef.current = null;
    didMoveRef.current = false;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  return {
    activeId,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}

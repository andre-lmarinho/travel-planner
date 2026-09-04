import { isPlaceholder, sanitizeTitle } from "@/features/activity/lib/placeholders";
import type { Activity, DayPlan } from "@/features/activity/types";
import { generateId } from "@/lib/generateId";
import type { EventInsert } from "../types";
import { cloneActivity, sanitizeActivity } from "./activityState";
import { midpoint, normalizePositions, parsePosition } from "./gapOrdering";

function isBetween(position: string | undefined, left?: string, right?: string): boolean {
  const value = parsePosition(position);
  if (value == null) return false;

  const leftNum = parsePosition(left);
  const rightNum = parsePosition(right);
  const effectiveRight = rightNum == null || (leftNum != null && leftNum >= rightNum) ? null : rightNum;

  if (leftNum != null && value <= leftNum) return false;
  if (effectiveRight != null && value >= effectiveRight) return false;
  return true;
}

function activityEquals(a: Activity, b: Activity): boolean {
  return (
    sanitizeTitle(a.title, "") === sanitizeTitle(b.title, "") &&
    (a.description ?? "") === (b.description ?? "") &&
    (a.address ?? "") === (b.address ?? "") &&
    (a.duration ?? 0) === (b.duration ?? 0) &&
    (a.startTime ?? "") === (b.startTime ?? "") &&
    (a.imageUrl ?? "") === (b.imageUrl ?? "") &&
    (a.budget ?? 0) === (b.budget ?? 0) &&
    (a.category ?? "") === (b.category ?? "") &&
    (a.latitude ?? 0) === (b.latitude ?? 0) &&
    (a.longitude ?? 0) === (b.longitude ?? 0) &&
    (a.color ?? "") === (b.color ?? "")
  );
}

function computeRightNeighborPosition(
  orderedIds: string[],
  index: number,
  positionMap: Map<string, string | undefined>
): string | undefined {
  for (let i = index + 1; i < orderedIds.length; i++) {
    const pos = positionMap.get(orderedIds[i]);
    if (pos) return pos;
  }
  return undefined;
}

export function diffEvents(
  planId: string,
  previousDays: DayPlan[],
  nextDays: DayPlan[],
  actorId?: string | null
): EventInsert[] {
  const events: EventInsert[] = [];
  const removedDayEvents: EventInsert[] = [];
  const prevDaysWithPositions = normalizePositions(previousDays);
  const prevDayMap = new Map(prevDaysWithPositions.map((day) => [day.id, day]));
  const prevActivityMap = new Map<string, { dayId: string; activity: Activity }>();

  for (const day of prevDaysWithPositions) {
    for (const activity of normalizePositions(day.activities)) {
      if (isPlaceholder(activity)) continue;
      prevActivityMap.set(activity.id, { dayId: day.id, activity });
    }
  }

  const nextDayIds = new Set(nextDays.map((day) => day.id));
  for (const day of prevDaysWithPositions) {
    if (!nextDayIds.has(day.id)) {
      removedDayEvents.push({
        id: generateId(),
        planId,
        type: "day.removed",
        payload: { dayId: day.id },
        actorId: actorId ?? undefined,
      });
    }
  }

  const resolvedDayPositions = new Map<string, string>();
  const nextDaysWithPositions = nextDays.map((day) => ({
    ...day,
    activities: normalizePositions(day.activities).map(cloneActivity),
  }));

  const nextActivityMap = new Map<string, { dayId: string; activity: Activity }>();
  for (const day of nextDaysWithPositions) {
    for (const activity of day.activities) {
      if (isPlaceholder(activity)) continue;
      nextActivityMap.set(activity.id, { dayId: day.id, activity });
    }
  }

  for (let index = 0; index < nextDaysWithPositions.length; index++) {
    const day = nextDaysWithPositions[index];
    const prev = prevDayMap.get(day.id);
    const leftId = index > 0 ? nextDaysWithPositions[index - 1].id : undefined;
    const leftPos = leftId
      ? (resolvedDayPositions.get(leftId) ?? prevDayMap.get(leftId)?.position)
      : undefined;
    const rightPos = (() => {
      for (let i = index + 1; i < nextDaysWithPositions.length; i++) {
        const candidateId = nextDaysWithPositions[i].id;
        const resolved = resolvedDayPositions.get(candidateId);
        if (resolved) return resolved;
        const prevCandidate = prevDayMap.get(candidateId);
        if (prevCandidate?.position) return prevCandidate.position;
      }
      return undefined;
    })();

    let position = prev?.position;
    if (!isBetween(position, leftPos, rightPos)) {
      position = midpoint(leftPos, rightPos);
    }
    const finalPosition = position ?? midpoint(leftPos, rightPos);
    resolvedDayPositions.set(day.id, finalPosition);

    if (!prev) {
      events.push({
        id: generateId(),
        planId,
        type: "day.created",
        payload: {
          day: {
            id: day.id,
            label: day.label,
            position: finalPosition,
            activities: day.activities.map((activity) => ({
              ...sanitizeActivity(activity, { dropInvalidCoordinates: true }),
              position: activity.position ?? midpoint(undefined, undefined),
            })),
          },
        },
        actorId: actorId ?? undefined,
      });
      continue;
    }

    if (prev.label !== day.label) {
      events.push({
        id: generateId(),
        planId,
        type: "day.updated",
        payload: { dayId: day.id, patch: { label: day.label } },
        actorId: actorId ?? undefined,
      });
    }

    if (prev.position !== finalPosition) {
      events.push({
        id: generateId(),
        planId,
        type: "day.reordered",
        payload: { dayId: day.id, position: finalPosition },
        actorId: actorId ?? undefined,
      });
    }
  }

  // Activity diffing
  for (const day of nextDaysWithPositions) {
    const prevDay = prevDayMap.get(day.id);
    const visibleActivities = day.activities.filter((activity) => !isPlaceholder(activity));

    if (prevDay) {
      for (const activity of prevDay.activities) {
        if (isPlaceholder(activity)) continue;
        if (!nextActivityMap.has(activity.id)) {
          events.push({
            id: generateId(),
            planId,
            type: "activity.deleted",
            payload: { activityId: activity.id },
            actorId: actorId ?? undefined,
          });
        }
      }
    }

    const activityOrder = visibleActivities.map((a) => a.id);
    const neighborPositionMap = new Map(visibleActivities.map((a) => [a.id, a.position]));

    visibleActivities.forEach((activity, index) => {
      const prevActivity = prevActivityMap.get(activity.id);
      if (!prevActivity) {
        const position = midpoint(
          index > 0 ? neighborPositionMap.get(activityOrder[index - 1]) : undefined,
          computeRightNeighborPosition(activityOrder, index, neighborPositionMap)
        );
        events.push({
          id: generateId(),
          planId,
          type: "activity.created",
          payload: {
            dayId: day.id,
            activity: {
              ...sanitizeActivity(activity, { dropInvalidCoordinates: true }),
              id: activity.id,
              position,
            },
            position,
          },
          actorId: actorId ?? undefined,
        });
        return;
      }

      const prevDayId = prevActivity.dayId;
      const prevPos = prevActivity.activity.position;
      const leftPos = index > 0 ? neighborPositionMap.get(activityOrder[index - 1]) : undefined;
      const rightPos = computeRightNeighborPosition(activityOrder, index, neighborPositionMap);
      let position = prevPos;
      if (!isBetween(position, leftPos, rightPos) || day.id !== prevDayId) {
        position = midpoint(leftPos, rightPos);
        events.push({
          id: generateId(),
          planId,
          type: "activity.moved",
          payload: {
            activityId: activity.id,
            fromDayId: prevDayId,
            toDayId: day.id,
            position,
          },
          actorId: actorId ?? undefined,
        });
      }

      if (!activityEquals(activity, prevActivity.activity)) {
        const { position: _position, ...patch } = sanitizeActivity(activity, {
          dropInvalidCoordinates: true,
        });
        events.push({
          id: generateId(),
          planId,
          type: "activity.updated",
          payload: {
            activityId: activity.id,
            patch,
          },
          actorId: actorId ?? undefined,
        });
      }
    });
  }

  return [...events, ...removedDayEvents];
}

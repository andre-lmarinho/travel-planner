import type { Activity, DayPlan } from "@/features/activity/types";
import type { Snapshot } from "@/features/snapshots/types";
import type { EventRecord, EventState } from "../types";
import { cloneDay, sanitizeActivity } from "./activityState";
import { parsePosition } from "./gapOrdering";

function toPositionNumber(position?: string): number {
  if (!position) return Number.MAX_SAFE_INTEGER;
  return parsePosition(position) ?? Number.MAX_SAFE_INTEGER;
}

function ensureDay(days: DayPlan[], dayId: string, label: string): { days: DayPlan[]; day: DayPlan } {
  const index = days.findIndex((d) => d.id === dayId);
  if (index >= 0) {
    return { days, day: days[index] };
  }

  const next = [...days, { id: dayId, label, activities: [], position: undefined }];
  return { days: next, day: next[next.length - 1] };
}

function applySingleEvent(days: DayPlan[], event: EventRecord): DayPlan[] {
  switch (event.type) {
    case "activity.created": {
      const { dayId, activity, position } = event.payload;
      const { days: ensuredDays, day } = ensureDay(days.map(cloneDay), dayId, activity.title);
      const sanitized = sanitizeActivity(activity, { defaultColor: "bg-[var(--color-1)]" });
      sanitized.position = position;
      const exists = day.activities.find((a) => a.id === sanitized.id);
      if (exists) {
        return ensuredDays;
      }
      const targetPosition = toPositionNumber(position);
      const insertIdx = day.activities.findIndex((a) => toPositionNumber(a.position) > targetPosition);
      if (insertIdx === -1) day.activities.push(sanitized);
      else day.activities.splice(insertIdx, 0, sanitized);
      return ensuredDays;
    }
    case "activity.updated": {
      const { activityId, patch } = event.payload;
      const nextDays = days.map(cloneDay);
      for (const day of nextDays) {
        const activity = day.activities.find((a) => a.id === activityId);
        if (!activity) continue;
        const updated: Activity = {
          ...activity,
          ...patch,
        };
        updated.title = sanitizeActivity(updated, { fallbackTitle: activity.title }).title;
        Object.assign(activity, updated);
        return nextDays;
      }
      return nextDays;
    }
    case "activity.deleted": {
      const { activityId } = event.payload;
      return days.map((day) => ({
        ...day,
        activities: day.activities.filter((a) => a.id !== activityId),
      }));
    }
    case "activity.moved": {
      const { activityId, fromDayId, toDayId, position } = event.payload;
      if (fromDayId === toDayId) {
        const next = days.map(cloneDay);
        const day = next.find((d) => d.id === fromDayId);
        if (!day) return next;
        const activityIndex = day.activities.findIndex((a) => a.id === activityId);
        if (activityIndex === -1) return next;
        const [activity] = day.activities.splice(activityIndex, 1);
        activity.position = position;
        const targetPosition = toPositionNumber(position);
        const insertIdx = day.activities.findIndex((a) => toPositionNumber(a.position) > targetPosition);
        if (insertIdx === -1) day.activities.push(activity);
        else day.activities.splice(insertIdx, 0, activity);
        return next;
      }
      const next = days.map(cloneDay);
      const fromDay = next.find((d) => d.id === fromDayId);
      const toDay = next.find((d) => d.id === toDayId);
      if (!fromDay || !toDay) return next;
      const activityIndex = fromDay.activities.findIndex((a) => a.id === activityId);
      if (activityIndex === -1) return next;
      const [activity] = fromDay.activities.splice(activityIndex, 1);
      activity.position = position;
      const targetPosition = toPositionNumber(position);
      const insertIdx = toDay.activities.findIndex((a) => toPositionNumber(a.position) > targetPosition);
      if (insertIdx === -1) toDay.activities.push(activity);
      else toDay.activities.splice(insertIdx, 0, activity);
      return next;
    }
    case "day.created": {
      const { day } = event.payload;
      if (days.some((existing) => existing.id === day.id)) return days;
      const next = days.map(cloneDay);
      const targetPosition = toPositionNumber(day.position);
      const insertIdx = next.findIndex((d) => toPositionNumber(d.position) > targetPosition);
      const sanitizedDay: DayPlan = {
        id: day.id,
        label: day.label,
        activities: day.activities.map((activity) =>
          sanitizeActivity(activity, { defaultColor: "bg-[var(--color-1)]" })
        ),
        position: day.position,
      };
      if (insertIdx === -1) next.push(sanitizedDay);
      else next.splice(insertIdx, 0, sanitizedDay);
      return next;
    }
    case "day.updated": {
      const { dayId, patch } = event.payload;
      return days.map((day) =>
        day.id === dayId
          ? {
              ...day,
              ...patch,
            }
          : day
      );
    }
    case "day.removed": {
      const { dayId } = event.payload;
      return days.filter((day) => day.id !== dayId);
    }
    case "day.reordered": {
      const { dayId, position } = event.payload;
      const next = days.map(cloneDay);
      const target = next.find((d) => d.id === dayId);
      if (!target) return next;
      target.position = position;
      next.sort((a, b) => {
        const posA = toPositionNumber(a.position);
        const posB = toPositionNumber(b.position);
        if (posA === posB) return a.id.localeCompare(b.id);
        return posA - posB;
      });
      return next;
    }
    default:
      return days;
  }
}

export function reduceEvents(snapshot: Snapshot, events: EventRecord[]): EventState {
  let state: EventState = {
    version: snapshot.version,
    days: snapshot.days.map(cloneDay),
  };

  for (const event of events) {
    if (event.version <= state.version) continue;
    state = {
      version: event.version,
      days: applySingleEvent(state.days, event),
    };
  }
  return state;
}

export function applyEvent(days: DayPlan[], event: EventRecord): DayPlan[] {
  return applySingleEvent(days.map(cloneDay), event);
}

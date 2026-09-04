import type { Activity, DayPlan } from "../types";

/**
 * Deep clone days array to allow safe mutations.
 */
export function cloneDays(days: DayPlan[]): DayPlan[] {
  return days.map((day) => ({
    ...day,
    activities: day.activities.map((a) => ({ ...a })),
  }));
}

/**
 * Move an activity to a new index within its current day.
 */
export function moveActivityPosition(days: DayPlan[], activityId: string, newIndex: number): DayPlan[] {
  const result = cloneDays(days);

  for (const day of result) {
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx !== -1) {
      const [moved] = day.activities.splice(idx, 1);
      const target = Math.max(0, Math.min(newIndex, day.activities.length));
      day.activities.splice(target, 0, moved);
      return result;
    }
  }

  return days;
}

/**
 * Move an activity from its current day to a different day.
 */
export function moveActivityToDay(days: DayPlan[], activityId: string, targetDayId: string): DayPlan[] {
  const result = cloneDays(days);

  let moved: Activity | undefined;

  for (const day of result) {
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx !== -1) {
      [moved] = day.activities.splice(idx, 1);
      break;
    }
  }

  if (!moved) return days;

  const targetDay = result.find((d) => d.id === targetDayId);
  if (!targetDay) {
    return days;
  }

  targetDay.activities.push(moved);
  return result;
}

/**
 * Update a specific activity within the days structure.
 */
export function updateActivity(days: DayPlan[], activityId: string, updates: Partial<Activity>): DayPlan[] {
  const result = cloneDays(days);

  for (const day of result) {
    const activity = day.activities.find((a) => a.id === activityId);
    if (activity) {
      Object.assign(activity, updates);
      return result;
    }
  }

  return days;
}

/**
 * Remove an activity from the days structure.
 */
export function removeActivity(days: DayPlan[], activityId: string): DayPlan[] {
  const result = cloneDays(days);

  for (const day of result) {
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx !== -1) {
      day.activities.splice(idx, 1);
      return result;
    }
  }

  return days;
}

/**
 * Add an activity to a specific day at a specific index.
 */
export function addActivityAtIndex(
  days: DayPlan[],
  dayId: string,
  activity: Activity,
  index: number
): DayPlan[] {
  const result = cloneDays(days);
  const day = result.find((d) => d.id === dayId);

  if (!day) return days;

  const targetIndex = Math.max(0, Math.min(index, day.activities.length));
  day.activities.splice(targetIndex, 0, activity);
  return result;
}

/**
 * Get an activity by ID from the days structure.
 */
export function getActivity(days: DayPlan[], activityId: string): Activity | undefined {
  for (const day of days) {
    const activity = day.activities.find((a) => a.id === activityId);
    if (activity) return activity;
  }
  return undefined;
}

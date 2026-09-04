import { sanitizeTitle } from "@/features/activity/lib/placeholders";
import type { Activity, DayPlan } from "@/features/activity/types";
import { isFiniteNumber } from "@/lib/typeGuards";

type SanitizeActivityOptions = {
  fallbackTitle?: string;
  defaultColor?: string;
  dropInvalidCoordinates?: boolean;
};

export function cloneActivity(activity: Activity): Activity {
  return { ...activity };
}

export function cloneDay(day: DayPlan): DayPlan {
  return { ...day, activities: day.activities.map(cloneActivity) };
}

export function sanitizeActivity(activity: Activity, options: SanitizeActivityOptions = {}): Activity {
  const { fallbackTitle, defaultColor, dropInvalidCoordinates = false } = options;
  const sanitized: Activity = {
    ...activity,
    title: sanitizeTitle(activity.title, fallbackTitle),
  };

  if (defaultColor && !sanitized.color) sanitized.color = defaultColor;
  if (!dropInvalidCoordinates) return sanitized;

  const { latitude, longitude, ...base } = sanitized;
  return {
    ...base,
    ...(isFiniteNumber(latitude) ? { latitude } : {}),
    ...(isFiniteNumber(longitude) ? { longitude } : {}),
  };
}

import { eachDayOfInterval } from "date-fns";

import { buildInitialDays } from "@/features/activity/lib/dayOperations";
import type { DayPlan } from "@/features/activity/types";

export function buildDaysFromRange(start: string | null, end: string | null): DayPlan[] | undefined {
  if (!start || !end) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) return undefined;
  if (startDate > endDate) return undefined;
  return buildInitialDays(eachDayOfInterval({ start: startDate, end: endDate }));
}

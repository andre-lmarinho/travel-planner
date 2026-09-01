import { z } from "zod";

import type { Activity, DayPlan } from "@/features/activity/types";
import { normalizePositions } from "@/features/events/lib/gapOrdering";

import type { Snapshot } from "../types";

export const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  color: z.string(),
  position: z.string().optional(),
  description: z.string().nullish(),
  address: z.string().nullish(),
  duration: z.number().nullish(),
  startTime: z.string().nullish(),
  imageUrl: z.string().nullish(),
  budget: z.number().nullish(),
  category: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

export const DayPlanSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: z.string().optional(),
  activities: z.array(ActivitySchema).default([]),
});

export const SnapshotRowSchema = z.object({
  plan_id: z.string(),
  version: z.number().nonnegative(),
  state: z.object({ days: z.array(DayPlanSchema).default([]) }),
  updated_at: z.string(),
});

export type ActivityRow = z.infer<typeof ActivitySchema>;
export type DayPlanRow = z.infer<typeof DayPlanSchema>;
export type SnapshotRow = z.infer<typeof SnapshotRowSchema>;

export function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    position: row.position ?? undefined,
    description: row.description ?? undefined,
    address: row.address ?? undefined,
    duration: row.duration ?? undefined,
    startTime: row.startTime ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    budget: row.budget ?? undefined,
    category: row.category ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

export function mapDayPlan(row: DayPlanRow): DayPlan {
  const activities = row.activities.map(mapActivity);
  const normalized = normalizePositions(activities);
  return {
    id: row.id,
    label: row.label,
    position: row.position ?? undefined,
    activities: normalized,
  };
}

export function mapSnapshot(row: SnapshotRow): Snapshot {
  const days = row.state.days.map(mapDayPlan);
  const normalizedDays = normalizePositions(days);
  return {
    version: row.version,
    days: normalizedDays,
    updatedAt: row.updated_at,
  };
}

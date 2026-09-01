import { z } from "zod";

import type { EventInsert } from "@/features/events/types";

const eventTypeSchema = z.enum([
  "activity.created",
  "activity.updated",
  "activity.deleted",
  "activity.moved",
  "day.created",
  "day.updated",
  "day.removed",
  "day.reordered",
]);

const eventInsertSchema = z.custom<EventInsert>((value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.planId === "string" &&
    event.planId.length > 0 &&
    eventTypeSchema.safeParse(event.type).success &&
    typeof event.payload === "object" &&
    event.payload !== null &&
    !Array.isArray(event.payload)
  );
}, "Invalid event payload");

export const appendEventsSchema = z.object({
  planId: z.string().trim().min(1),
  baseVersion: z.number().int().nonnegative(),
  events: z.array(eventInsertSchema),
});

export type AppendEventsInput = z.infer<typeof appendEventsSchema>;

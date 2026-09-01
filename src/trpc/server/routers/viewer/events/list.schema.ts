import { z } from "zod";

export const listEventsSchema = z.object({
  planId: z.string().trim().min(1),
  sinceVersion: z.number().int().nonnegative(),
});

export type ListEventsInput = z.infer<typeof listEventsSchema>;

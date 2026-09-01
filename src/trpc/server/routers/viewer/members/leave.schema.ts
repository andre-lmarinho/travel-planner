import { z } from "zod";

export const leavePlanSchema = z.object({
  planIdOrSlug: z.string().trim().min(1),
});

export type LeavePlanInput = z.infer<typeof leavePlanSchema>;

import { z } from "zod";

export const updatePlanDatesSchema = z.object({
  planId: z.string().trim().min(1),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type UpdatePlanDatesInput = z.infer<typeof updatePlanDatesSchema>;

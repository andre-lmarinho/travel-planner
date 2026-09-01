import { z } from "zod";

export const deletePlanSchema = z.object({
  planId: z.string().trim().min(1),
});

export type DeletePlanInput = z.infer<typeof deletePlanSchema>;

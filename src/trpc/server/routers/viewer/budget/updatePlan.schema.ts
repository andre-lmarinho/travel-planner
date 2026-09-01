import { z } from "zod";

export const updatePlanBudgetSchema = z.object({
  planId: z.string().trim().min(1),
  budget: z.number().finite(),
});

export type UpdatePlanBudgetInput = z.infer<typeof updatePlanBudgetSchema>;

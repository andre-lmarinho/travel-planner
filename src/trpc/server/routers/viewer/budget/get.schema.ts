import { z } from "zod";

export const getBudgetSchema = z.object({
  planId: z.string().trim().min(1),
});

export type GetBudgetInput = z.infer<typeof getBudgetSchema>;

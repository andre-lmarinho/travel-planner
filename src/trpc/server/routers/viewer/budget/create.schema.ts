import { z } from "zod";

const budgetEntrySchema = z.object({
  amount: z.number().finite(),
  category: z.enum(["transport", "lodging", "food", "activities", "shopping", "documents"]),
  description: z.string(),
});

export const createBudgetEntrySchema = z.object({
  planId: z.string().trim().min(1),
  payload: budgetEntrySchema,
});

export type CreateBudgetEntryInput = z.infer<typeof createBudgetEntrySchema>;

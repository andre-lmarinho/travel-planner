import { z } from "zod";

const budgetEntrySchema = z.object({
  id: z.string().trim().min(1),
  amount: z.number().finite(),
  category: z.enum(["transport", "lodging", "food", "activities", "shopping", "documents"]),
  description: z.string(),
});

export const updateBudgetEntrySchema = z.object({
  entry: budgetEntrySchema,
});

export type UpdateBudgetEntryInput = z.infer<typeof updateBudgetEntrySchema>;

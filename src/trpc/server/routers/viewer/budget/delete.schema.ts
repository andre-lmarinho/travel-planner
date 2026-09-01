import { z } from "zod";

export const deleteBudgetEntrySchema = z.object({
  entryId: z.string().trim().min(1),
});

export type DeleteBudgetEntryInput = z.infer<typeof deleteBudgetEntrySchema>;

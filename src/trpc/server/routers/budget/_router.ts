import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";
import type { Database } from "@/shared/types/supabase";

import { authedProcedure } from "../../procedures/authedProcedure";
import { router } from "../../trpc";

const planIdInput = z.object({
  planId: z.string().trim().min(1),
});

const budgetEntryInput = z.object({
  amount: z.number().finite(),
  category: z.enum(["transport", "lodging", "food", "activities", "shopping", "documents"]),
  description: z.string(),
});

function createBudgetService(client: SupabaseClient<Database>): BudgetService {
  return new BudgetService(new BudgetRepository(client));
}

export const budgetRouter = router({
  createEntry: authedProcedure
    .input(planIdInput.extend({ payload: budgetEntryInput }))
    .mutation(({ ctx, input }) =>
      createBudgetService(ctx.supabase).createBudgetEntry(input.planId, input.payload)
    ),
  deleteEntry: authedProcedure
    .input(z.object({ entryId: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) => createBudgetService(ctx.supabase).deleteBudgetEntry(input.entryId)),
  get: authedProcedure
    .input(planIdInput)
    .query(({ ctx, input }) => createBudgetService(ctx.supabase).getPlanBudget(input.planId)),
  updateEntry: authedProcedure
    .input(z.object({ entry: budgetEntryInput.extend({ id: z.string().trim().min(1) }) }))
    .mutation(({ ctx, input }) => createBudgetService(ctx.supabase).updateBudgetEntry(input.entry)),
  updatePlan: authedProcedure
    .input(planIdInput.extend({ budget: z.number().finite() }))
    .mutation(({ ctx, input }) =>
      createBudgetService(ctx.supabase).updatePlanBudget(input.planId, input.budget)
    ),
});

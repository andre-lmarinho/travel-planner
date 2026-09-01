import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdatePlanBudgetInput } from "./updatePlan.schema";

export function updatePlanBudgetHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: UpdatePlanBudgetInput;
}) {
  return new BudgetService(new BudgetRepository(ctx.supabase)).updatePlanBudget(input.planId, input.budget);
}

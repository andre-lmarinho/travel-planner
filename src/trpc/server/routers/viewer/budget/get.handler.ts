import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { GetBudgetInput } from "./get.schema";

export function getBudgetHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: GetBudgetInput }) {
  return new BudgetService(new BudgetRepository(ctx.supabase)).getPlanBudget(input.planId);
}

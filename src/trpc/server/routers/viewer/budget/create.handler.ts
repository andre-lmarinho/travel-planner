import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { CreateBudgetEntryInput } from "./create.schema";

export function createBudgetEntryHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: CreateBudgetEntryInput;
}) {
  return new BudgetService(new BudgetRepository(ctx.supabase)).createBudgetEntry(input.planId, input.payload);
}

import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdateBudgetEntryInput } from "./update.schema";

export function updateBudgetEntryHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: UpdateBudgetEntryInput;
}) {
  return new BudgetService(new BudgetRepository(ctx.supabase)).updateBudgetEntry(input.entry);
}

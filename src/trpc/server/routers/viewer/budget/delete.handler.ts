import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { BudgetService } from "@/features/budget/services/BudgetService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { DeleteBudgetEntryInput } from "./delete.schema";

export function deleteBudgetEntryHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: DeleteBudgetEntryInput;
}) {
  return new BudgetService(new BudgetRepository(ctx.supabase)).deleteBudgetEntry(input.entryId);
}

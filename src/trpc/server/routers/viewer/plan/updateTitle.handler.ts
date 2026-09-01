import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdatePlanTitleInput } from "./updateTitle.schema";

export async function updatePlanTitleHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: UpdatePlanTitleInput;
}) {
  const service = new PlanService(
    new PlanRepository(ctx.supabase),
    new BudgetRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.updatePlanTitle(input.planId, input.title);
}

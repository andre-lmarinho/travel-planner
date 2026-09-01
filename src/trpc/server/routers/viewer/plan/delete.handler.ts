import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { DeletePlanInput } from "./delete.schema";

export async function deletePlanHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: DeletePlanInput }) {
  const service = new PlanService(
    new PlanRepository(ctx.supabase),
    new BudgetRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.deletePlan(input.planId);
}

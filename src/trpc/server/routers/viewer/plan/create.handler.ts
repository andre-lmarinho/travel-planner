import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { CreatePlanInput } from "./create.schema";

export async function createPlanHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: CreatePlanInput }) {
  const service = new PlanService(
    new PlanRepository(ctx.supabase),
    new BudgetRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase),
    ctx.viewer
  );
  return service.createUserPlan(input);
}

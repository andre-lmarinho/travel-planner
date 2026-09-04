import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { SetPlanVisibilityInput } from "./setVisibility.schema";

export async function setPlanVisibilityHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: SetPlanVisibilityInput;
}) {
  const service = new PlanService(
    new PlanRepository(ctx.supabase),
    new BudgetRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase),
    new SnapshotsService(new SnapshotsRepository(ctx.supabase)),
    ctx.viewer
  );
  return service.setPlanVisibility(input.planId, input.isPublic);
}

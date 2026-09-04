import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { PlanService } from "@/features/plan/services/PlanService";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdatePlanDatesInput } from "./updateDates.schema";

export async function updatePlanDatesHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: UpdatePlanDatesInput;
}) {
  const service = new PlanService(
    new PlanRepository(ctx.supabase),
    new BudgetRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase),
    new SnapshotsService(new SnapshotsRepository(ctx.supabase)),
    ctx.viewer
  );
  return service.updatePlanDates(input.planId, new Date(input.from), new Date(input.to));
}

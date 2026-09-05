import { MembersRepository } from "@/features/members/repositories/MembersRepository";
import { MembersService } from "@/features/members/services/MembersService";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { LeavePlanInput } from "./leave.schema";

export async function leavePlanHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: LeavePlanInput }) {
  const service = new MembersService(
    new MembersRepository(ctx.supabase),
    new PlanRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  await service.leavePlan(input.planIdOrSlug);
  return "/";
}

import { MembersRepository } from "@/features/members/repositories/MembersRepository";
import { MembersService } from "@/features/members/services/MembersService";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { GetMembersInput } from "./get.schema";

export async function getMembersHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: GetMembersInput }) {
  const service = new MembersService(
    new MembersRepository(ctx.supabase),
    new PlanRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.getMembers(input.planIdOrSlug);
}

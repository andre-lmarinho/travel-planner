import { MembersRepository } from "@/features/members/repositories/MembersRepository";
import { MembersService } from "@/features/members/services/MembersService";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { AddMemberInput } from "./add.schema";

export async function addMemberHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: AddMemberInput }) {
  const service = new MembersService(
    new MembersRepository(ctx.supabase),
    new PlanRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.addMember(input.planIdOrSlug, input.email, input.tier);
}

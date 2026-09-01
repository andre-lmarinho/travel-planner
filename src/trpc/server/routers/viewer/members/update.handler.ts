import { MembersRepository } from "@/features/members/repositories/MembersRepository";
import { MembersService } from "@/features/members/services/MembersService";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdateMemberInput } from "./update.schema";

export async function updateMemberHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: UpdateMemberInput;
}) {
  const service = new MembersService(
    new MembersRepository(ctx.supabase),
    new PlanRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.updateMemberTier(input.planIdOrSlug, input.userId, input.tier);
}

import { MembersRepository } from "@/features/members/repositories/MembersRepository";
import { MembersService } from "@/features/members/services/MembersService";
import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";

import type { AuthedTRPCContext } from "../../../createContext";
import type { RemoveMemberInput } from "./remove.schema";

export async function removeMemberHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: RemoveMemberInput;
}) {
  const service = new MembersService(
    new MembersRepository(ctx.supabase),
    new PlanRepository(ctx.supabase),
    new ProfileRepository(ctx.supabase)
  );
  return service.removeMember(input.planIdOrSlug, input.userId);
}

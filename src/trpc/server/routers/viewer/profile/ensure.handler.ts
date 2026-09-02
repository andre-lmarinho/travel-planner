import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { EnsureProfileInput } from "./ensure.schema";

export async function ensureProfileHandler({
  ctx,
  input: _input,
}: {
  ctx: AuthedTRPCContext;
  input: EnsureProfileInput;
}) {
  return new ProfileService(new ProfileRepository(ctx.supabase)).ensureProfile(ctx.viewer);
}

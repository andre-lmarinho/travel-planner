import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { UpdateProfileInput } from "./update.schema";

export function updateProfileHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: UpdateProfileInput }) {
  return new ProfileService(new ProfileRepository(ctx.supabase)).updateViewerProfile(ctx.viewer.id, input);
}

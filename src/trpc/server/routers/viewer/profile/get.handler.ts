import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { TGetProfileSchema } from "./get.schema";

type GetProfileHandlerOpts = {
  ctx: AuthedTRPCContext;
  input: TGetProfileSchema;
};

export function getProfileHandler({ ctx, input: _input }: GetProfileHandlerOpts) {
  const service = new ProfileService(new ProfileRepository(ctx.supabase));
  return service.getViewerProfile(ctx.viewer.id);
}

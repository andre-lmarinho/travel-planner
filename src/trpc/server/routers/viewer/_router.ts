import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";

import { authedProcedure } from "../../procedures/authedProcedure";
import { router } from "../../trpc";

export const viewerRouter = router({
  profile: authedProcedure.query(({ ctx }) => {
    const service = new ProfileService(new ProfileRepository(ctx.supabase));
    return service.getViewerProfile(ctx.auth.userId);
  }),
});

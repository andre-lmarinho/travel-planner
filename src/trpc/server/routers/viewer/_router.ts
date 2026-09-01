import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";

import { authedProcedure } from "../../procedures/authedProcedure";
import { router } from "../../trpc";
import { budgetRouter } from "./budget/_router";
import { eventsRouter } from "./events/_router";
import { snapshotsRouter } from "./snapshots/_router";

export const viewerRouter = router({
  events: eventsRouter,
  budget: budgetRouter,
  profile: authedProcedure.query(({ ctx }) => {
    const service = new ProfileService(new ProfileRepository(ctx.supabase));
    return service.getViewerProfile(ctx.auth.userId);
  }),
  snapshots: snapshotsRouter,
});

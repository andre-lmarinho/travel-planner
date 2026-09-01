import { router } from "../../trpc";
import { budgetRouter } from "./budget/_router";
import { eventsRouter } from "./events/_router";
import { membersRouter } from "./members/_router";
import { profileRouter } from "./profile/_router";
import { snapshotsRouter } from "./snapshots/_router";

export const viewerRouter = router({
  events: eventsRouter,
  members: membersRouter,
  profile: profileRouter,
  budget: budgetRouter,
  snapshots: snapshotsRouter,
});

import { router } from "../../trpc";
import { profileRouter } from "./profile/_router";

export const publicRouter = router({
  profile: profileRouter,
});

import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { getProfileHandler } from "./get.handler";
import { ZGetProfileSchema } from "./get.schema";

export const profileRouter = router({
  get: authedProcedure.input(ZGetProfileSchema).query((opts) => getProfileHandler(opts)),
});

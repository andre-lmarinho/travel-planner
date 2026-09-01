import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ensureProfileHandler } from "./ensure.handler";
import { ensureProfileSchema } from "./ensure.schema";
import { getProfileHandler } from "./get.handler";
import { ZGetProfileSchema } from "./get.schema";

export const profileRouter = router({
  ensure: authedProcedure.input(ensureProfileSchema).mutation(ensureProfileHandler),
  get: authedProcedure.input(ZGetProfileSchema).query((opts) => getProfileHandler(opts)),
});

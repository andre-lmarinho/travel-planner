import { publicProcedure } from "../../../procedures/publicProcedure";
import { router } from "../../../trpc";
import { checkUsernameAvailabilityHandler } from "./availability.handler";
import { checkUsernameAvailabilitySchema } from "./availability.schema";

export const profileRouter = router({
  availability: publicProcedure.input(checkUsernameAvailabilitySchema).query(checkUsernameAvailabilityHandler),
});

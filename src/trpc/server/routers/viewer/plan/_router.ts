import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { createPlanHandler } from "./create.handler";
import { createPlanSchema } from "./create.schema";
import { deletePlanHandler } from "./delete.handler";
import { deletePlanSchema } from "./delete.schema";
import { setPlanVisibilityHandler } from "./setVisibility.handler";
import { setPlanVisibilitySchema } from "./setVisibility.schema";
import { updatePlanDatesHandler } from "./updateDates.handler";
import { updatePlanDatesSchema } from "./updateDates.schema";
import { updatePlanTitleHandler } from "./updateTitle.handler";
import { updatePlanTitleSchema } from "./updateTitle.schema";

export const planRouter = router({
  create: authedProcedure.input(createPlanSchema).mutation(createPlanHandler),
  delete: authedProcedure.input(deletePlanSchema).mutation(deletePlanHandler),
  setVisibility: authedProcedure.input(setPlanVisibilitySchema).mutation(setPlanVisibilityHandler),
  updateDates: authedProcedure.input(updatePlanDatesSchema).mutation(updatePlanDatesHandler),
  updateTitle: authedProcedure.input(updatePlanTitleSchema).mutation(updatePlanTitleHandler),
});

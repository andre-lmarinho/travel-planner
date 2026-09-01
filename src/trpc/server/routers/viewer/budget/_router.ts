import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { createBudgetEntryHandler } from "./create.handler";
import { createBudgetEntrySchema } from "./create.schema";
import { deleteBudgetEntryHandler } from "./delete.handler";
import { deleteBudgetEntrySchema } from "./delete.schema";
import { getBudgetHandler } from "./get.handler";
import { getBudgetSchema } from "./get.schema";
import { updateBudgetEntryHandler } from "./update.handler";
import { updateBudgetEntrySchema } from "./update.schema";
import { updatePlanBudgetHandler } from "./updatePlan.handler";
import { updatePlanBudgetSchema } from "./updatePlan.schema";

export const budgetRouter = router({
  createEntry: authedProcedure.input(createBudgetEntrySchema).mutation(createBudgetEntryHandler),
  deleteEntry: authedProcedure.input(deleteBudgetEntrySchema).mutation(deleteBudgetEntryHandler),
  get: authedProcedure.input(getBudgetSchema).query(getBudgetHandler),
  updateEntry: authedProcedure.input(updateBudgetEntrySchema).mutation(updateBudgetEntryHandler),
  updatePlan: authedProcedure.input(updatePlanBudgetSchema).mutation(updatePlanBudgetHandler),
});

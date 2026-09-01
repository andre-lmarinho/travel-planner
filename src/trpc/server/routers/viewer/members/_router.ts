import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { addMemberHandler } from "./add.handler";
import { addMemberSchema } from "./add.schema";
import { getMembersHandler } from "./get.handler";
import { getMembersSchema } from "./get.schema";
import { leavePlanHandler } from "./leave.handler";
import { leavePlanSchema } from "./leave.schema";
import { removeMemberHandler } from "./remove.handler";
import { removeMemberSchema } from "./remove.schema";
import { updateMemberHandler } from "./update.handler";
import { updateMemberSchema } from "./update.schema";

export const membersRouter = router({
  add: authedProcedure.input(addMemberSchema).mutation(addMemberHandler),
  get: authedProcedure.input(getMembersSchema).query(getMembersHandler),
  leave: authedProcedure.input(leavePlanSchema).mutation(leavePlanHandler),
  remove: authedProcedure.input(removeMemberSchema).mutation(removeMemberHandler),
  update: authedProcedure.input(updateMemberSchema).mutation(updateMemberHandler),
});

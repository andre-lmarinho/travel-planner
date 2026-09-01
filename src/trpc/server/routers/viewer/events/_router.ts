import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { appendEventsHandler } from "./append.handler";
import { appendEventsSchema } from "./append.schema";
import { listEventsHandler } from "./list.handler";
import { listEventsSchema } from "./list.schema";

export const eventsRouter = router({
  append: authedProcedure.input(appendEventsSchema).mutation(appendEventsHandler),
  list: authedProcedure.input(listEventsSchema).query(listEventsHandler),
});

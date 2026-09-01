import { authedProcedure } from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { getSnapshotHandler } from "./get.handler";
import { getSnapshotSchema } from "./get.schema";

export const snapshotsRouter = router({
  get: authedProcedure.input(getSnapshotSchema).query(getSnapshotHandler),
});

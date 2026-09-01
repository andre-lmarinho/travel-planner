import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { GetSnapshotInput } from "./get.schema";

export async function getSnapshotHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: GetSnapshotInput;
}) {
  const service = new SnapshotsService(new SnapshotsRepository(ctx.supabase));
  return service.fetchSnapshot(input.planId);
}

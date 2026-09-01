import { EventsRepository } from "@/features/events/repositories/EventsRepository";
import { EventsService } from "@/features/events/services/EventsService";
import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { AppendEventsInput } from "./append.schema";

export async function appendEventsHandler({
  ctx,
  input,
}: {
  ctx: AuthedTRPCContext;
  input: AppendEventsInput;
}) {
  const snapshots = new SnapshotsService(new SnapshotsRepository(ctx.supabase));
  const service = new EventsService(new EventsRepository(ctx.supabase), snapshots);
  return service.appendEvents(input.planId, input.baseVersion, input.events);
}

import { EventsRepository } from "@/features/events/repositories/EventsRepository";
import { EventsService } from "@/features/events/services/EventsService";
import { SnapshotsRepository } from "@/features/snapshots/repositories/SnapshotsRepository";
import { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";

import type { AuthedTRPCContext } from "../../../createContext";
import type { ListEventsInput } from "./list.schema";

export async function listEventsHandler({ ctx, input }: { ctx: AuthedTRPCContext; input: ListEventsInput }) {
  const snapshots = new SnapshotsService(new SnapshotsRepository(ctx.supabase));
  const service = new EventsService(new EventsRepository(ctx.supabase), snapshots);
  return service.fetchEvents(input.planId, input.sinceVersion);
}

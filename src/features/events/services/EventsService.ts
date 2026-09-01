import "server-only";

import { buildSnapshotStateForAppend } from "@/features/events/lib/snapshotStateBuilder";
import type { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";
import { ApplicationError } from "@/lib/errors";

import type { EventsRepository } from "../repositories/EventsRepository";
import type { EventInsert, EventRecord } from "../types";
import { AppendEventsResponseSchema, EventRowSchema, mapEvent } from "./eventsSchemas";

export class EventsService {
  constructor(
    private readonly repo: EventsRepository,
    private readonly snapshots: SnapshotsService
  ) {}

  async fetchEvents(planId: string, sinceVersion: number): Promise<EventRecord[]> {
    const rows = await this.repo.fetchEvents(planId, sinceVersion);
    return rows.map((row) => mapEvent(EventRowSchema.parse(row)));
  }

  async appendEvents(
    planId: string,
    baseVersion: number,
    events: EventInsert[]
  ): Promise<{ events: EventRecord[]; version: number }> {
    if (!Number.isInteger(baseVersion) || baseVersion < 0) {
      throw new ApplicationError("BAD_REQUEST", "Base version must be a non-negative integer.");
    }

    if (events.length === 0) {
      return { version: baseVersion, events: [] };
    }

    const snapshot = await this.snapshots.fetchSnapshot(planId);
    const history =
      snapshot.version > 0 && snapshot.days.length === 0 ? await this.fetchEvents(planId, 0) : undefined;
    const snapshotState = buildSnapshotStateForAppend({
      snapshot,
      baseVersion,
      events,
      history,
    });
    const data = await this.repo.appendEvents(planId, baseVersion, events, {
      snapshotState: snapshotState ?? undefined,
    });

    if (!data) {
      return { version: baseVersion, events: [] };
    }

    const { version, inserted_events } = AppendEventsResponseSchema.parse(data);
    return {
      version,
      events: inserted_events.map(mapEvent),
    };
  }
}

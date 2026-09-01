import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { EventInsert } from "@/features/events/types";
import type { SnapshotRow } from "@/features/snapshots/repositories/SnapshotsRepository";
import { formatSupabaseError } from "@/lib/errors";
import type { Database, Json } from "@/supabase/types";

export type EventRow = Database["public"]["Tables"]["plan_events"]["Row"];
export type AppendEventsResponse = Database["public"]["Functions"]["append_plan_events"]["Returns"];

type SnapshotState = SnapshotRow["state"];

type AppendPlanEventsArgs = Database["public"]["Functions"]["append_plan_events"]["Args"] & {
  snapshot_state?: SnapshotState;
};

type AppendEventsOptions = {
  snapshotState?: SnapshotState;
};

export class EventsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchEvents(planId: string, sinceVersion: number): Promise<EventRow[]> {
    const { data, error } = await this.client
      .from("plan_events")
      .select("id, event_id, plan_id, version, event_type, payload, created_at, actor_id")
      .eq("plan_id", planId)
      .gt("version", sinceVersion)
      .order("version", { ascending: true });

    if (error) {
      throw formatSupabaseError({
        operation: "fetchEvents",
        identifiers: { planId, sinceVersion },
        error,
      });
    }

    return data ?? [];
  }

  async appendEvents(
    planId: string,
    baseVersion: number,
    events: EventInsert[],
    { snapshotState }: AppendEventsOptions = {}
  ): Promise<AppendEventsResponse | null> {
    const args: AppendPlanEventsArgs = {
      plan_id: planId,
      base_version: baseVersion,
      // Typed event union is serialized to jsonb at the RPC boundary.
      events: events as unknown as Json,
      ...(snapshotState ? { snapshot_state: snapshotState } : {}),
    };
    const { data, error } = await this.client.rpc("append_plan_events", args);

    if (error) {
      throw formatSupabaseError({
        operation: "appendEvents",
        identifiers: { planId, baseVersion, eventCount: events.length },
        error,
      });
    }

    return data ?? null;
  }
}

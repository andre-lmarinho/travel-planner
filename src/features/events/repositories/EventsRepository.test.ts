import { buildRpcMock, buildTableMock } from "@tests/utils/mocks";
import { describe, expect, it } from "vitest";
import type { Database } from "@/shared/types/supabase";

import { EventsRepository } from "./EventsRepository";

const eventRow = {
  id: "row-1",
  event_id: "event-1",
  plan_id: "plan-1",
  version: 1,
  event_type: "day.created" as const,
  payload: { day: { id: "day-1", label: "Day 1", position: "1024", activities: [] } },
  created_at: "2026-01-01T00:00:00.000Z",
  actor_id: "user-1",
};

describe("EventsRepository", () => {
  it("fetches events with an explicit projection and ordered version filter", async () => {
    const { supabase, from, chain } = buildTableMock("plan_events", { data: [eventRow], error: null });

    await expect(new EventsRepository(supabase).fetchEvents("plan-1", 3)).resolves.toEqual([eventRow]);

    expect(from).toHaveBeenCalledWith("plan_events");
    expect(chain.select).toHaveBeenCalledWith(
      "id, event_id, plan_id, version, event_type, payload, created_at, actor_id"
    );
    expect(chain.eq).toHaveBeenCalledWith("plan_id", "plan-1");
    expect(chain.gt).toHaveBeenCalledWith("version", 3);
    expect(chain.order).toHaveBeenCalledWith("version", { ascending: true });
  });

  it("returns an empty list when the query has no rows", async () => {
    const { supabase } = buildTableMock("plan_events", { data: null, error: null });

    await expect(new EventsRepository(supabase).fetchEvents("plan-1", 0)).resolves.toEqual([]);
  });

  it("wraps fetch failures with operation and identifiers", async () => {
    const cause = new Error("database unavailable");
    const { supabase } = buildTableMock("plan_events", { data: null, error: cause });

    await expect(new EventsRepository(supabase).fetchEvents("plan-1", 2)).rejects.toThrow(
      /fetchEvents.*planId=plan-1.*sinceVersion=2/
    );
  });

  it("calls append RPC with serialized events and snapshot state", async () => {
    const response = { version: 2, inserted_events: [eventRow] };
    const { supabase, rpc } = buildRpcMock("append_plan_events", { data: response, error: null });
    const events = [
      {
        id: "event-2",
        planId: "plan-1",
        type: "day.created" as const,
        payload: eventRow.payload,
        actorId: "user-1",
      },
    ];
    const snapshotState = { days: [] } as Database["public"]["Tables"]["plan_snapshots"]["Row"]["state"];

    await expect(
      new EventsRepository(supabase).appendEvents("plan-1", 1, events, { snapshotState })
    ).resolves.toEqual(response);

    expect(rpc).toHaveBeenCalledWith("append_plan_events", {
      plan_id: "plan-1",
      base_version: 1,
      events,
      snapshot_state: snapshotState,
    });
  });

  it("returns null when append RPC returns no data", async () => {
    const { supabase } = buildRpcMock("append_plan_events", { data: null, error: null });

    await expect(new EventsRepository(supabase).appendEvents("plan-1", 1, [])).resolves.toBeNull();
  });

  it("wraps append failures with operation and identifiers", async () => {
    const cause = new Error("conflict");
    const { supabase } = buildRpcMock("append_plan_events", { data: null, error: cause });

    await expect(new EventsRepository(supabase).appendEvents("plan-1", 4, [])).rejects.toThrow(
      /appendEvents.*planId=plan-1.*baseVersion=4.*eventCount=0/
    );
  });
});

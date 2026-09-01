import { describe, expect, it, vi } from "vitest";
import type { SnapshotsService } from "@/features/snapshots/services/SnapshotsService";
import type { Snapshot } from "@/features/snapshots/types";
import { ApplicationError } from "@/lib/errors";
import type { Json } from "@/supabase/types";
import type { EventRow, EventsRepository } from "../repositories/EventsRepository";
import type { EventInsert } from "../types";

import { EventsService } from "./EventsService";

const snapshot: Snapshot = { version: 0, days: [], updatedAt: "2026-01-01T00:00:00.000Z" };
const event: EventInsert = {
  id: "event-1",
  planId: "plan-1",
  type: "day.created",
  payload: { day: { id: "day-1", label: "Day 1", position: "1024", activities: [] } },
};
const storedRow: EventRow = {
  id: "row-1",
  event_id: "event-1",
  plan_id: "plan-1",
  version: 1,
  event_type: "day.created",
  payload: event.payload as unknown as Json,
  created_at: "2026-01-01T00:00:00.000Z",
  actor_id: "user-1",
};
function createService(options: { snapshot?: Snapshot; historyRows?: EventRow[]; appendResult?: unknown }) {
  const repo = {
    fetchEvents: vi.fn().mockResolvedValue(options.historyRows ?? []),
    appendEvents: vi.fn().mockResolvedValue(options.appendResult ?? null),
  } as unknown as EventsRepository;
  const snapshots = {
    fetchSnapshot: vi.fn().mockResolvedValue(options.snapshot ?? snapshot),
  } as unknown as SnapshotsService;
  return { service: new EventsService(repo, snapshots), repo, snapshots };
}

describe("EventsService", () => {
  it("maps repository rows when listing events", async () => {
    const { service, repo } = createService({});
    vi.mocked(repo.fetchEvents).mockResolvedValueOnce([storedRow]);

    await expect(service.fetchEvents("plan-1", 0)).resolves.toEqual([
      expect.objectContaining({ id: "event-1", planId: "plan-1", type: "day.created" }),
    ]);
  });

  it("rejects invalid base versions before touching dependencies", async () => {
    const { service, repo, snapshots } = createService({});

    await expect(service.appendEvents("plan-1", -1, [event])).rejects.toBeInstanceOf(ApplicationError);
    expect(repo.appendEvents).not.toHaveBeenCalled();
    expect(snapshots.fetchSnapshot).not.toHaveBeenCalled();
  });

  it("returns a no-op for an empty append", async () => {
    const { service, repo, snapshots } = createService({});

    await expect(service.appendEvents("plan-1", 3, [])).resolves.toEqual({ version: 3, events: [] });
    expect(repo.appendEvents).not.toHaveBeenCalled();
    expect(snapshots.fetchSnapshot).not.toHaveBeenCalled();
  });

  it("builds snapshot state and maps inserted events", async () => {
    const { service, repo } = createService({
      appendResult: { version: 1, inserted_events: [storedRow] },
    });

    await expect(service.appendEvents("plan-1", 0, [event])).resolves.toEqual({
      version: 1,
      events: [expect.objectContaining({ id: "event-1", version: 1 })],
    });
    expect(repo.appendEvents).toHaveBeenCalledWith("plan-1", 0, [event], {
      snapshotState: expect.objectContaining({ days: [expect.objectContaining({ id: "day-1" })] }),
    });
  });

  it("rebuilds an empty persisted snapshot from history before appending", async () => {
    const { service, repo, snapshots } = createService({
      snapshot: { ...snapshot, version: 1 },
      historyRows: [storedRow],
      appendResult: { version: 2, inserted_events: [storedRow] },
    });

    await service.appendEvents("plan-1", 1, [event]);

    expect(snapshots.fetchSnapshot).toHaveBeenCalledWith("plan-1");
    expect(repo.fetchEvents).toHaveBeenCalledWith("plan-1", 0);
    expect(repo.appendEvents).toHaveBeenCalledWith("plan-1", 1, [event], {
      snapshotState: expect.objectContaining({ days: [expect.objectContaining({ id: "day-1" })] }),
    });
  });

  it("returns the base version when the repository reports no inserted data", async () => {
    const { service } = createService({ appendResult: null });

    await expect(service.appendEvents("plan-1", 0, [event])).resolves.toEqual({ version: 0, events: [] });
  });
});

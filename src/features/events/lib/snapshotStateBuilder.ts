import "server-only";

import type { DayPlan } from "@/features/activity/types";
import { reduceEvents } from "@/features/events/lib/eventReducer";
import type { EventInsert, EventRecord } from "@/features/events/types";

import type { SnapshotRow } from "@/features/snapshots/repositories/SnapshotsRepository";
import type { Snapshot } from "@/features/snapshots/types";

export type SnapshotState = SnapshotRow["state"];

type BuildSnapshotStateArgs = {
  snapshot: Snapshot;
  baseVersion: number;
  events: EventInsert[];
  history?: EventRecord[];
};

function toEventRecord(event: EventInsert, version: number, createdAt: string): EventRecord {
  return { ...event, version, createdAt };
}

function toSnapshotState(days: DayPlan[]): SnapshotState {
  // Strip undefined fields so the payload is JSONB-safe.
  return JSON.parse(JSON.stringify({ days })) as SnapshotState;
}

function rebuildSnapshot(snapshot: Snapshot, history: EventRecord[]): Snapshot {
  const rebuilt = reduceEvents({ ...snapshot, version: 0, days: [] }, history);
  return { ...snapshot, version: rebuilt.version, days: rebuilt.days };
}

export function buildSnapshotStateForAppend({
  snapshot,
  baseVersion,
  events,
  history,
}: BuildSnapshotStateArgs): SnapshotState | null {
  if (events.length === 0) return null;
  if (snapshot.version !== baseVersion) return null;

  let baseSnapshot = snapshot;
  if (snapshot.version > 0 && snapshot.days.length === 0) {
    if (!history || history.length === 0) return null;
    const latestVersion = history.reduce((max, event) => Math.max(max, event.version), 0);
    if (latestVersion !== baseVersion) return null;
    baseSnapshot = rebuildSnapshot(snapshot, history);
  }

  const createdAt = new Date().toISOString();
  const eventRecords = events.map((event, index) => toEventRecord(event, baseVersion + index + 1, createdAt));
  const next = reduceEvents(baseSnapshot, eventRecords);
  return toSnapshotState(next.days);
}

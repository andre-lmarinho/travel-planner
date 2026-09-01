import { describe, expect, it } from "vitest";
import type { DayPlan } from "@/features/activity/types";
import type { EventInsert } from "@/features/events/types";
import type { Snapshot } from "@/features/snapshots/types";
import { buildSnapshotStateForAppend } from "./snapshotStateBuilder";

const createMockDay = (): DayPlan => ({
  id: "1",
  label: "Day 1",
  position: "d1",
  activities: [],
});

const createMockSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => ({
  version: 0,
  days: [],
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const activityCreatedEvent: EventInsert = {
  id: "e1",
  planId: "plan-1",
  type: "activity.created",
  payload: {
    dayId: "1",
    activity: {
      id: "a1",
      title: "Test",
      color: "",
      position: "",
      description: "",
      address: "",
      duration: 60,
    },
    position: "a1",
  },
  actorId: "u1",
};

describe("snapshotStateBuilder", () => {
  describe("buildSnapshotStateForAppend", () => {
    it("returns null when events array is empty", () => {
      const snapshot = createMockSnapshot();

      const result = buildSnapshotStateForAppend({
        snapshot,
        baseVersion: 0,
        events: [],
      });

      expect(result).toBeNull();
    });

    it("returns null when snapshot version doesn't match baseVersion", () => {
      const snapshot = createMockSnapshot({ version: 5 });
      const events = [activityCreatedEvent];

      const result = buildSnapshotStateForAppend({
        snapshot,
        baseVersion: 0,
        events,
      });

      expect(result).toBeNull();
    });

    it("returns null when rebuilding from empty history", () => {
      const snapshot = createMockSnapshot({ version: 1, days: [] });
      const events = [activityCreatedEvent];

      const result = buildSnapshotStateForAppend({
        snapshot,
        baseVersion: 1,
        events,
        history: [],
      });

      expect(result).toBeNull();
    });

    it("returns state when version matches and events provided", () => {
      const snapshot = createMockSnapshot({ version: 0, days: [createMockDay()] });
      const events = [activityCreatedEvent];

      const result = buildSnapshotStateForAppend({
        snapshot,
        baseVersion: 0,
        events,
      });

      expect(result).toBeDefined();
      const state = result as unknown as { days: DayPlan[] };
      expect(state.days).toHaveLength(1);
      expect(state.days[0].activities).toHaveLength(1);
      expect(state.days[0].activities[0].id).toBe("a1");
    });
  });
});

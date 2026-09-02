import type { DragOverEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import type { DayPlan } from "@/features/activity/types";
import { applyDragMove, buildIndexMaps, type DragTarget, getDragTarget } from "./dragUtils";

function createActivity(
  id: string,
  title: string = "Activity"
): { id: string; title: string; description: string; color: string; duration: number; category: string } {
  return {
    id,
    title,
    description: "",
    color: "bg-blue-500",
    duration: 60,
    category: "general",
  };
}

function createDay(id: string, activities: ReturnType<typeof createActivity>[] = []): DayPlan {
  return {
    id,
    label: `Day ${id}`,
    position: `a${id}`,
    activities,
  };
}

describe("buildIndexMaps", () => {
  it("creates day map with correct mappings", () => {
    const days = [createDay("1"), createDay("2"), createDay("3")];

    const { dayMap } = buildIndexMaps(days);

    expect(dayMap.get("1")).toBe(0);
    expect(dayMap.get("2")).toBe(1);
    expect(dayMap.get("3")).toBe(2);
    expect(dayMap.size).toBe(3);
  });

  it("creates activity map with correct indices", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const a3 = createActivity("a3");
    const days = [createDay("1", [a1, a2]), createDay("2", [a3])];

    const { activityMap } = buildIndexMaps(days);

    expect(activityMap.get("a1")).toEqual({ dayIdx: 0, actIdx: 0 });
    expect(activityMap.get("a2")).toEqual({ dayIdx: 0, actIdx: 1 });
    expect(activityMap.get("a3")).toEqual({ dayIdx: 1, actIdx: 0 });
    expect(activityMap.size).toBe(3);
  });

  it("handles empty days array", () => {
    const { dayMap, activityMap } = buildIndexMaps([]);

    expect(dayMap.size).toBe(0);
    expect(activityMap.size).toBe(0);
  });

  it("handles days with no activities", () => {
    const days = [createDay("1", [])];

    const { dayMap, activityMap } = buildIndexMaps(days);

    expect(dayMap.get("1")).toBe(0);
    expect(activityMap.size).toBe(0);
  });
});

describe("getDragTarget", () => {
  it("returns target from sortable data", () => {
    const days = [createDay("1", [createActivity("a1")])];
    const { dayMap, activityMap } = buildIndexMaps(days);
    const over = {
      id: "a1",
      data: {
        current: {
          sortable: {
            containerId: "1",
            index: 0,
          },
        },
      },
    } as unknown as NonNullable<DragOverEvent["over"]>;

    const result = getDragTarget(days, over, dayMap, activityMap);

    expect(result).toEqual({ dayIndex: 0, activityIndex: 0 });
  });

  it("returns target for day column", () => {
    const days = [createDay("1", []), createDay("2", [])];
    const { dayMap, activityMap } = buildIndexMaps(days);
    const over = {
      id: "2",
      data: { current: {} },
    } as unknown as NonNullable<DragOverEvent["over"]>;

    const result = getDragTarget(days, over, dayMap, activityMap);

    expect(result).toEqual({ dayIndex: 1, activityIndex: 0 });
  });

  it("returns target for activity", () => {
    const days = [createDay("1", [createActivity("a1")])];
    const { dayMap, activityMap } = buildIndexMaps(days);
    const over = {
      id: "a1",
      data: { current: {} },
    } as unknown as NonNullable<DragOverEvent["over"]>;

    const result = getDragTarget(days, over, dayMap, activityMap);

    expect(result).toEqual({ dayIndex: 0, activityIndex: 0 });
  });

  it("returns null for unknown target", () => {
    const days = [createDay("1", [])];
    const { dayMap, activityMap } = buildIndexMaps(days);
    const over = {
      id: "unknown",
      data: { current: {} },
    } as unknown as NonNullable<DragOverEvent["over"]>;

    const result = getDragTarget(days, over, dayMap, activityMap);

    expect(result).toBeNull();
  });

  it("returns null for null over", () => {
    const days = [createDay("1", [])];
    const { dayMap, activityMap } = buildIndexMaps(days);

    const result = getDragTarget(days, null, dayMap, activityMap);

    expect(result).toBeNull();
  });

  it("appends to end of day when container has activities", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", [a1])];
    const { dayMap, activityMap } = buildIndexMaps(days);
    const over = {
      id: "1",
      data: { current: {} },
    } as unknown as NonNullable<DragOverEvent["over"]>;

    const result = getDragTarget(days, over, dayMap, activityMap);

    expect(result).toEqual({ dayIndex: 0, activityIndex: 1 });
  });
});

describe("applyDragMove", () => {
  it("returns same array when no change needed", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", [a1])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 0, activityIndex: 0 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result).toBe(days);
  });

  it("moves activity within same day", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const a3 = createActivity("a3");
    const days = [createDay("1", [a1, a2, a3])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 0, activityIndex: 2 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result[0].activities[0].id).toBe("a2");
    expect(result[0].activities[1].id).toBe("a3");
    expect(result[0].activities[2].id).toBe("a1");
  });

  it("moves activity to different day", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1]), createDay("2", [a2])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 1, activityIndex: 0 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result[0].activities).toHaveLength(0);
    expect(result[1].activities).toHaveLength(2);
    expect(result[1].activities[0].id).toBe("a1");
    expect(result[1].activities[1].id).toBe("a2");
  });

  it("returns original when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 0, activityIndex: 0 };

    const result = applyDragMove(days, "nonexistent", target, activityMap);

    expect(result).toBe(days);
  });

  it("clamps insert index to valid range", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1, a2])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 0, activityIndex: 100 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result[0].activities[1].id).toBe("a1");
    expect(result[0].activities.length).toBe(2);
  });

  it("creates new array reference when changed", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1]), createDay("2", [a2])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 1, activityIndex: 0 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result).not.toBe(days);
    expect(result[0]).not.toBe(days[0]);
    expect(result[1]).not.toBe(days[1]);
  });

  it("only clones affected days", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const a3 = createActivity("a3");
    const days = [createDay("1", [a1]), createDay("2", [a2]), createDay("3", [a3])];
    const { activityMap } = buildIndexMaps(days);
    const target: DragTarget = { dayIndex: 0, activityIndex: 1 };

    const result = applyDragMove(days, "a1", target, activityMap);

    expect(result[1]).toBe(days[1]);
    expect(result[2]).toBe(days[2]);
  });
});

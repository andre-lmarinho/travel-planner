import { describe, expect, it } from "vitest";
import type { Activity, DayPlan } from "../types";
import {
  addActivityAtIndex,
  cloneDays,
  getActivity,
  moveActivityPosition,
  moveActivityToDay,
  removeActivity,
  updateActivity,
} from "./activityOperations";

function createActivity(id: string, title: string = "Activity"): Activity {
  return {
    id,
    title,
    description: "",
    color: "bg-blue-500",
    duration: 60,
    category: "general",
  };
}

function createDay(id: string, activities: Activity[] = []): DayPlan {
  return {
    id,
    label: `Day ${id}`,
    position: `a${id}`,
    activities,
  };
}

describe("cloneDays", () => {
  it("creates a deep copy of days", () => {
    const activity = createActivity("a1", "Test");
    const original = [createDay("1", [activity])];
    const cloned = cloneDays(original);

    expect(cloned).not.toBe(original);
    expect(cloned[0]).not.toBe(original[0]);
    expect(cloned[0].activities[0]).not.toBe(original[0].activities[0]);
    expect(cloned[0].activities[0].title).toBe("Test");
  });

  it("modifications to clone don't affect original", () => {
    const activity = createActivity("a1", "Original");
    const original = [createDay("1", [activity])];
    const cloned = cloneDays(original);

    cloned[0].activities[0].title = "Modified";

    expect(original[0].activities[0].title).toBe("Original");
  });
});

describe("moveActivityPosition", () => {
  it("moves activity within same day", () => {
    const a1 = createActivity("a1", "First");
    const a2 = createActivity("a2", "Second");
    const a3 = createActivity("a3", "Third");
    const days = [createDay("1", [a1, a2, a3])];

    const result = moveActivityPosition(days, "a2", 0);

    expect(result[0].activities[0].id).toBe("a2");
    expect(result[0].activities[1].id).toBe("a1");
    expect(result[0].activities[2].id).toBe("a3");
  });

  it("returns original array when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];

    const result = moveActivityPosition(days, "nonexistent", 0);

    expect(result).toBe(days);
  });

  it("clamps index to valid range", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1, a2])];

    const result = moveActivityPosition(days, "a1", 100);

    expect(result[0].activities[1].id).toBe("a1");
  });

  it("handles moving to beginning", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1, a2])];

    const result = moveActivityPosition(days, "a2", 0);

    expect(result[0].activities[0].id).toBe("a2");
    expect(result[0].activities[1].id).toBe("a1");
  });
});

describe("moveActivityToDay", () => {
  it("moves activity to different day", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", [a1]), createDay("2", [])];

    const result = moveActivityToDay(days, "a1", "2");

    expect(result[0].activities).toHaveLength(0);
    expect(result[1].activities).toHaveLength(1);
    expect(result[1].activities[0].id).toBe("a1");
  });

  it("returns original when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];

    const result = moveActivityToDay(days, "nonexistent", "2");

    expect(result).toBe(days);
  });

  it("returns original when target day not found", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", [a1])];

    const result = moveActivityToDay(days, "a1", "nonexistent");

    expect(result).toBe(days);
  });

  it("appends to end of target day", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1]), createDay("2", [a2])];

    const result = moveActivityToDay(days, "a1", "2");

    expect(result[1].activities[0].id).toBe("a2");
    expect(result[1].activities[1].id).toBe("a1");
  });
});

describe("updateActivity", () => {
  it("updates activity properties", () => {
    const a1 = createActivity("a1", "Original");
    const days = [createDay("1", [a1])];

    const result = updateActivity(days, "a1", { title: "Updated", duration: 120 });

    expect(result[0].activities[0].title).toBe("Updated");
    expect(result[0].activities[0].duration).toBe(120);
  });

  it("returns original when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];

    const result = updateActivity(days, "nonexistent", { title: "Updated" });

    expect(result).toBe(days);
  });

  it("partial update doesn't affect other properties", () => {
    const a1 = createActivity("a1", "Title");
    a1.description = "Description";
    a1.duration = 60;
    const days = [createDay("1", [a1])];

    const result = updateActivity(days, "a1", { title: "New Title" });

    expect(result[0].activities[0].description).toBe("Description");
    expect(result[0].activities[0].duration).toBe(60);
  });
});

describe("removeActivity", () => {
  it("removes activity from day", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1, a2])];

    const result = removeActivity(days, "a1");

    expect(result[0].activities).toHaveLength(1);
    expect(result[0].activities[0].id).toBe("a2");
  });

  it("returns original when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];

    const result = removeActivity(days, "nonexistent");

    expect(result).toBe(days);
  });
});

describe("addActivityAtIndex", () => {
  it("inserts activity at specified index", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const a3 = createActivity("a3");
    const days = [createDay("1", [a1, a2])];

    const result = addActivityAtIndex(days, "1", a3, 1);

    expect(result[0].activities[0].id).toBe("a1");
    expect(result[0].activities[1].id).toBe("a3");
    expect(result[0].activities[2].id).toBe("a2");
  });

  it("clamps index to valid range", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1])];

    const result = addActivityAtIndex(days, "1", a2, 100);

    expect(result[0].activities[1].id).toBe("a2");
  });

  it("handles index 0", () => {
    const a1 = createActivity("a1");
    const a2 = createActivity("a2");
    const days = [createDay("1", [a1])];

    const result = addActivityAtIndex(days, "1", a2, 0);

    expect(result[0].activities[0].id).toBe("a2");
    expect(result[0].activities[1].id).toBe("a1");
  });
});

describe("getActivity", () => {
  it("returns the activity by id", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", [a1])];

    const result = getActivity(days, "a1");

    expect(result?.id).toBe("a1");
  });

  it("returns undefined when activity not found", () => {
    const days = [createDay("1", [createActivity("a1")])];

    const result = getActivity(days, "nonexistent");

    expect(result).toBeUndefined();
  });

  it("searches across all days", () => {
    const a1 = createActivity("a1");
    const days = [createDay("1", []), createDay("2", [a1])];

    const result = getActivity(days, "a1");

    expect(result).toBeDefined();
  });
});

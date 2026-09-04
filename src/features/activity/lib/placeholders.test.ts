import { describe, expect, it } from "vitest";
import { createBlankActivity, generateActivityId, isPlaceholder, sanitizeTitle } from "./placeholders";

describe("generateActivityId", () => {
  it("generates unique IDs", () => {
    const id1 = generateActivityId();
    const id2 = generateActivityId();

    expect(id1).not.toBe(id2);
  });

  it("prefixes with act-", () => {
    const id = generateActivityId();

    expect(id.startsWith("act-")).toBe(true);
  });
});

describe("isPlaceholder", () => {
  it("returns true for placeholder ID prefix", () => {
    const activity = { id: "blank-abc123", title: "Some Title" };

    const result = isPlaceholder(activity);

    expect(result).toBe(true);
  });

  it("returns true for empty title", () => {
    const activity = { id: "act-abc123", title: "" };

    const result = isPlaceholder(activity);

    expect(result).toBe(true);
  });

  it("returns true for whitespace-only title", () => {
    const activity = { id: "act-abc123", title: "   " };

    const result = isPlaceholder(activity);

    expect(result).toBe(true);
  });

  it("returns false for non-placeholder ID with valid title", () => {
    const activity = { id: "act-abc123", title: "Valid Title" };

    const result = isPlaceholder(activity);

    expect(result).toBe(false);
  });

  it("returns true for null title", () => {
    const activity = { id: "act-abc123", title: null as unknown as string };

    const result = isPlaceholder(activity);

    expect(result).toBe(true);
  });

  it("returns true for undefined title", () => {
    const activity = { id: "act-abc123", title: undefined as unknown as string };

    const result = isPlaceholder(activity);

    expect(result).toBe(true);
  });
});

describe("createBlankActivity", () => {
  it("creates activity with unique ID", () => {
    const activity1 = createBlankActivity();
    const activity2 = createBlankActivity();

    expect(activity1.id).not.toBe(activity2.id);
  });

  it("creates activity with empty title", () => {
    const activity = createBlankActivity();

    expect(activity.title).toBe("");
  });

  it("creates activity with default color", () => {
    const activity = createBlankActivity();

    expect(activity.color).toBeDefined();
    expect(activity.color.length).toBeGreaterThan(0);
  });

  it("creates activity with zero duration", () => {
    const activity = createBlankActivity();

    expect(activity.duration).toBe(0);
  });

  it("creates activity with zero budget", () => {
    const activity = createBlankActivity();

    expect(activity.budget).toBe(0);
  });

  it("creates activity with empty category", () => {
    const activity = createBlankActivity();

    expect(activity.category).toBe("");
  });

  it("creates activity with empty description", () => {
    const activity = createBlankActivity();

    expect(activity.description).toBe("");
  });
});

describe("sanitizeTitle", () => {
  it("returns trimmed title when valid", () => {
    const result = sanitizeTitle("  Valid Title  ");

    expect(result).toBe("Valid Title");
  });

  it("returns fallback for empty string", () => {
    const result = sanitizeTitle("");

    expect(result).toBe("Untitled activity");
  });

  it("returns fallback for whitespace-only", () => {
    const result = sanitizeTitle("   ");

    expect(result).toBe("Untitled activity");
  });

  it("returns fallback for null", () => {
    const result = sanitizeTitle(null);

    expect(result).toBe("Untitled activity");
  });

  it("returns fallback for undefined", () => {
    const result = sanitizeTitle(undefined);

    expect(result).toBe("Untitled activity");
  });

  it("uses custom fallback when provided", () => {
    const result = sanitizeTitle("", "Custom Fallback");

    expect(result).toBe("Custom Fallback");
  });

  it("returns title as-is when valid", () => {
    const result = sanitizeTitle("Exact Title");

    expect(result).toBe("Exact Title");
  });
});

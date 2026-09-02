import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPlan } from "@/features/activity/types";
import { useDragHandlers } from "./useDragHandlers";

const createMockDay = (id: string, activities: string[]): DayPlan => ({
  id,
  label: `Day ${id}`,
  position: `d${id}`,
  activities: activities.map((aid) => ({
    id: aid,
    title: `Activity ${aid}`,
    color: "bg-[var(--color-0)]",
    position: `a${aid}`,
    description: "",
    address: "",
    duration: 60,
  })),
});

const mockDays: DayPlan[] = [createMockDay("1", ["a1", "a2"]), createMockDay("2", ["a3"])];

describe("useDragHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with null activeId", () => {
    const { result } = renderHook(() => useDragHandlers(mockDays));
    expect(result.current.activeId).toBeNull();
  });

  it("returns sensors configuration", () => {
    const { result } = renderHook(() => useDragHandlers(mockDays));
    expect(result.current.sensors).toBeDefined();
    expect(result.current.sensors.length).toBe(2);
  });

  it("returns all handler functions", () => {
    const { result } = renderHook(() => useDragHandlers(mockDays));

    expect(typeof result.current.handleDragStart).toBe("function");
    expect(typeof result.current.handleDragOver).toBe("function");
    expect(typeof result.current.handleDragEnd).toBe("function");
    expect(typeof result.current.handleDragCancel).toBe("function");
  });

  it("accepts custom days from props", () => {
    const customDays = [createMockDay("custom1", ["c1"]), createMockDay("custom2", ["c2", "c3"])];
    const { result } = renderHook(() => useDragHandlers(customDays));

    expect(result.current.activeId).toBeNull();
    expect(result.current.sensors).toBeDefined();
  });

  it("handleDragCancel does not throw when no active drag", () => {
    const { result } = renderHook(() => useDragHandlers(mockDays));

    expect(() => result.current.handleDragCancel()).not.toThrow();
  });

  it("handles empty days array", () => {
    const { result } = renderHook(() => useDragHandlers([]));

    expect(result.current.activeId).toBeNull();
    expect(typeof result.current.handleDragStart).toBe("function");
  });
});

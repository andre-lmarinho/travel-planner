import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activity/types";
import { useEditorState } from "@/modules/planner/hooks/useEditorState";

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

describe("useEditorState", () => {
  it("initial state is closed with null values", () => {
    const { result } = renderHook(() => useEditorState());

    expect(result.current.activity).toBeNull();
    expect(result.current.dayId).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it("opens editor with activity and dayId", () => {
    const { result } = renderHook(() => useEditorState());
    const activity = createActivity("a1", "Test Activity");
    const dayId = "2024-01-15";

    act(() => {
      result.current.openEditor(activity, dayId);
    });

    expect(result.current.activity).toEqual(activity);
    expect(result.current.dayId).toBe(dayId);
    expect(result.current.isOpen).toBe(true);
  });

  it("closes editor and resets state", () => {
    const { result } = renderHook(() => useEditorState());
    const activity = createActivity("a1");
    const dayId = "2024-01-15";

    act(() => {
      result.current.openEditor(activity, dayId);
    });

    act(() => {
      result.current.closeEditor();
    });

    expect(result.current.activity).toBeNull();
    expect(result.current.dayId).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it("updates activity partially", () => {
    const { result } = renderHook(() => useEditorState());
    const activity = createActivity("a1", "Original Title");

    act(() => {
      result.current.openEditor(activity, "day-1");
    });

    act(() => {
      result.current.updateActivity({ title: "Updated Title", duration: 120 });
    });

    expect(result.current.activity?.title).toBe("Updated Title");
    expect(result.current.activity?.duration).toBe(120);
    expect(result.current.activity?.color).toBe(activity.color);
  });

  it("handles update when activity is null", () => {
    const { result } = renderHook(() => useEditorState());

    act(() => {
      result.current.updateActivity({ title: "No Activity" });
    });

    expect(result.current.activity).toBeNull();
  });

  it("multiple open/close cycles work correctly", () => {
    const { result } = renderHook(() => useEditorState());

    act(() => {
      result.current.openEditor(createActivity("a1"), "day-1");
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeEditor();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openEditor(createActivity("a2"), "day-2");
    });
    expect(result.current.activity?.id).toBe("a2");
    expect(result.current.dayId).toBe("day-2");
  });

  it("opening new activity replaces previous", () => {
    const { result } = renderHook(() => useEditorState());

    act(() => {
      result.current.openEditor(createActivity("a1"), "day-1");
    });

    act(() => {
      result.current.openEditor(createActivity("a2"), "day-2");
    });

    expect(result.current.activity?.id).toBe("a2");
    expect(result.current.dayId).toBe("day-2");
  });

  it("updateActivity merges with existing activity", () => {
    const { result } = renderHook(() => useEditorState());

    act(() => {
      result.current.openEditor(createActivity("a1", "Title"), "day-1");
    });

    act(() => {
      result.current.updateActivity({ title: "New Title", description: "New Description" });
    });

    expect(result.current.activity?.title).toBe("New Title");
    expect(result.current.activity?.description).toBe("New Description");
    expect(result.current.activity?.duration).toBe(60);
  });
});

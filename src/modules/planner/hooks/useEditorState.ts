"use client";

import { useCallback, useState } from "react";

import type { Activity } from "@/features/activity/types";

interface EditorState {
  activity: Activity | null;
  dayId: string | null;
  isOpen: boolean;
}

/**
 * Hook to manage which activity is being edited.
 */
export function useEditorState() {
  const [state, setState] = useState<EditorState>({
    activity: null,
    dayId: null,
    isOpen: false,
  });

  const openEditor = useCallback((activity: Activity, dayId: string) => {
    setState({
      activity,
      dayId,
      isOpen: true,
    });
  }, []);

  const closeEditor = useCallback(() => {
    setState({
      activity: null,
      dayId: null,
      isOpen: false,
    });
  }, []);

  const updateActivity = useCallback((updates: Partial<Activity>) => {
    setState((prev) => ({
      ...prev,
      activity: prev.activity ? { ...prev.activity, ...updates } : null,
    }));
  }, []);

  return {
    ...state,
    openEditor,
    closeEditor,
    updateActivity,
  };
}

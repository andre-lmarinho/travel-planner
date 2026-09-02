"use client";

import { addDays, parseISO } from "date-fns";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

import {
  addActivity,
  addActivityAtIndex,
  moveActivityPosition,
  moveActivityToDay,
  removeActivity,
  updateActivity,
} from "@/features/activity/lib/activityOperations";
import { buildInitialDays, syncDaysWithRange } from "@/features/activity/lib/dayOperations";
import { createBlankActivity } from "@/features/activity/lib/placeholders";
import type { Activity, DayPlan } from "@/features/activity/types";
import { useEditorState } from "@/features/activityDialog/hooks/useEditorState";
import { usePlanCollaboration } from "@/features/events/hooks/usePlanCollaboration";
import { trpc } from "@/trpc/react";

interface DestCoords {
  lat: number;
  lng: number;
}

interface PlannerContextValue {
  // Core state
  planId: string;
  days: DayPlan[];
  setDays: (days: DayPlan[]) => void;

  // Destination
  dest?: string;
  destCoords: DestCoords | null;

  // Date range
  currentRange: DateRange | undefined;
  handleRangeChange: (range: DateRange | undefined) => void;

  // Selected activity (from editor state)
  selectedActivity: (Activity & { dayId: string }) | null;
  setSelectedActivity: (activity: (Activity & { dayId: string }) | null) => void;

  // Activity operations
  addActivity: (dayId: string, activity: Activity) => void;
  addActivityWithTitle: (
    dayId: string,
    title: string,
    index: number,
    suggestion?: Partial<Activity>
  ) => Promise<Activity | null>;
  removeActivity: (activityId: string) => void;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;

  // Convenience methods for editor
  addBlankActivity: (dayIndex: number) => void;
  addBlankAndSelect: (dayIndex: number) => void;
  changeDay: (newDayId: string) => void;
  changePosition: (newIndex: number) => void;
  save: (updates: Partial<Activity>) => void;
  deleteActivity: () => void;
  changeColor: (color: string) => void;
  closeDialog: () => void;

  // Access control
  canEdit: boolean;
  viewerUserId: string | null;
  isOwner: boolean;
  canManageMembers: boolean;
  isPublic: boolean;
}

interface PlannerProviderProps {
  initialDays?: DayPlan[];
  planId: string;
  dest?: string;
  canEdit?: boolean;
  viewerUserId?: string | null;
  isOwner?: boolean;
  canManageMembers?: boolean;
  isPublic?: boolean;
}

/**
 * Generate default trip dates (3 days starting from today).
 */
function getDefaultTripDates(count: number = 3): Date[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/**
 * Convert DateRange to array of dates for syncDaysWithRange.
 */
function dateRangeToArray(range: DateRange): Date[] {
  if (!range.from) return [];
  const dates: Date[] = [];
  let current = range.from;
  const end = range.to ?? range.from;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function usePlannerContextValue({
  initialDays,
  planId,
  dest,
  canEdit = true,
  viewerUserId = null,
  isOwner = false,
  canManageMembers = false,
  isPublic = false,
}: PlannerProviderProps): PlannerContextValue {
  // Persistence follows edit access: read-only viewers (public plans) neither subscribe to
  // realtime nor write. Members/owners (canEdit) collaborate normally.
  const updateDatesMutation = trpc.viewer.plan.updateDates.useMutation();
  const { data: storedDays, persistDays } = usePlanCollaboration(planId, {
    enabled: canEdit,
    actorId: viewerUserId,
  });

  // Days state - start with initialDays or default days
  const [localDays, setLocalDays] = useState<DayPlan[]>(
    () => initialDays ?? buildInitialDays(getDefaultTripDates())
  );
  const hasLoadedRef = useRef(false);

  // Sync with stored days when they arrive
  useEffect(() => {
    if (storedDays !== undefined && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (storedDays.length > 0) {
        setLocalDays(storedDays);
      }
    }
  }, [storedDays]);

  // Use stored days if available (and non-empty), otherwise local
  const days = storedDays && storedDays.length > 0 ? storedDays : localDays;

  // Derive date range from days
  const deriveDateRange = useCallback((daysArray: DayPlan[]): DateRange | undefined => {
    if (daysArray.length === 0) return undefined;
    const from = parseISO(daysArray[0].id);
    const to = parseISO(daysArray[daysArray.length - 1].id);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return undefined;
    return { from, to };
  }, []);

  // Date range - derived from days using useMemo
  const currentRange = useMemo(() => deriveDateRange(days), [days, deriveDateRange]);

  // Editor state for selected activity
  const editor = useEditorState();

  // Destination coordinates (geocoded from dest string)
  const [destCoords, setDestCoords] = useState<DestCoords | null>(null);

  useEffect(() => {
    // dest geocoding only powers editor conveniences (centering an empty plan, defaulting a new
    // activity's location), so it's gated on canEdit. Public read-only viewers don't need it —
    // the map fits to the snapshot's activity markers.
    if (!dest || !canEdit) {
      setDestCoords(null);
      return;
    }

    const controller = new AbortController();
    const fetchCoords = async () => {
      try {
        const params = new URLSearchParams({ text: dest });
        const res = await fetch(`/api/places/city-country?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const data = (await res.json()) as { results?: Array<{ latitude?: number; longitude?: number }> };
        const first = data.results?.[0];
        if (first?.latitude != null && first?.longitude != null) {
          setDestCoords({ lat: first.latitude, lng: first.longitude });
        }
      } catch {
        // Ignore abort errors and network failures
      }
    };

    fetchCoords();
    return () => controller.abort();
  }, [dest, canEdit]);

  // Set days with persistence
  const setDays = useCallback(
    (nextDays: DayPlan[]) => {
      setLocalDays(nextDays);
      if (canEdit && hasLoadedRef.current) {
        persistDays.mutate(nextDays);
      }
    },
    [canEdit, persistDays]
  );

  // Handle range change with day sync and server persistence
  const handleRangeChange = useCallback(
    (range: DateRange | undefined) => {
      if (range?.from) {
        const tripDates = dateRangeToArray(range);
        const synced = syncDaysWithRange(days, tripDates);
        setDays(synced);

        // Persist date range to server
        if (canEdit) {
          const to = range.to ?? range.from;
          updateDatesMutation
            .mutateAsync({ planId, from: range.from.toISOString(), to: to.toISOString() })
            .catch((err) => {
              console.error("Failed to persist plan dates:", err);
            });
        }
      }
    },
    [days, setDays, canEdit, planId, updateDatesMutation]
  );

  // Activity CRUD operations
  const handleAddActivity = useCallback(
    (dayId: string, activity: Activity) => {
      const nextDays = addActivity(days, dayId, activity);
      setDays(nextDays);
    },
    [days, setDays]
  );

  const handleRemoveActivity = useCallback(
    (activityId: string) => {
      const nextDays = removeActivity(days, activityId);
      setDays(nextDays);
    },
    [days, setDays]
  );

  const handleUpdateActivity = useCallback(
    (activityId: string, updates: Partial<Activity>) => {
      const nextDays = updateActivity(days, activityId, updates);
      setDays(nextDays);
    },
    [days, setDays]
  );

  // Add activity with title at specific index (for inline add)
  const addActivityWithTitle = useCallback(
    async (
      dayId: string,
      title: string,
      index: number,
      suggestion?: Partial<Activity>
    ): Promise<Activity | null> => {
      const activity = createBlankActivity();
      activity.title = title;
      // Apply autocomplete suggestion data if provided
      if (suggestion) {
        Object.assign(activity, suggestion);
      }
      const nextDays = addActivityAtIndex(days, dayId, activity, index);
      setDays(nextDays);
      return activity;
    },
    [days, setDays]
  );

  // Convenience: add blank activity to day index
  const addBlankActivity = useCallback(
    (dayIndex: number) => {
      const day = days[dayIndex];
      if (!day) return;
      const blank = createBlankActivity();
      handleAddActivity(day.id, blank);
    },
    [days, handleAddActivity]
  );

  // Convenience: add blank and select for editing
  const addBlankAndSelect = useCallback(
    (dayIndex: number) => {
      const day = days[dayIndex];
      if (!day) return;
      const blank = createBlankActivity();
      handleAddActivity(day.id, blank);
      editor.openEditor(blank, day.id);
    },
    [days, editor, handleAddActivity]
  );

  // Selected activity with dayId
  const selectedActivity = useMemo(() => {
    if (!editor.activity || !editor.dayId) return null;
    return { ...editor.activity, dayId: editor.dayId };
  }, [editor.activity, editor.dayId]);

  // Set selected activity
  const setSelectedActivity = useCallback(
    (activity: (Activity & { dayId: string }) | null) => {
      if (activity) {
        const { dayId, ...activityData } = activity;
        editor.openEditor(activityData, dayId);
      } else {
        editor.closeEditor();
      }
    },
    [editor]
  );

  // Change day for selected activity
  const changeDay = useCallback(
    (newDayId: string) => {
      if (!selectedActivity) return;
      const { dayId: oldDayId } = selectedActivity;
      if (oldDayId === newDayId) return;

      // Move activity to new day
      const nextDays = moveActivityToDay(days, selectedActivity.id, newDayId);
      setDays(nextDays);

      // Update editor state
      const { dayId: _, ...activity } = selectedActivity;
      editor.openEditor(activity, newDayId);
    },
    [days, editor, selectedActivity, setDays]
  );

  // Change position of selected activity within the same day
  const changePosition = useCallback(
    (newIndex: number) => {
      if (!selectedActivity) return;
      const nextDays = moveActivityPosition(days, selectedActivity.id, newIndex);
      setDays(nextDays);
    },
    [days, selectedActivity, setDays]
  );

  // Save changes to selected activity
  const save = useCallback(
    (updates: Partial<Activity>) => {
      if (!selectedActivity) return;
      handleUpdateActivity(selectedActivity.id, updates);
      editor.updateActivity(updates);
    },
    [editor, handleUpdateActivity, selectedActivity]
  );

  // Delete selected activity
  const deleteActivity = useCallback(() => {
    if (!selectedActivity) return;
    handleRemoveActivity(selectedActivity.id);
    editor.closeEditor();
  }, [editor, handleRemoveActivity, selectedActivity]);

  // Change color of selected activity
  const changeColor = useCallback(
    (color: string) => {
      save({ color });
    },
    [save]
  );

  // Close dialog
  const closeDialog = useCallback(() => {
    editor.closeEditor();
  }, [editor]);

  return {
    // Core state
    planId,
    days,
    setDays,

    // Destination
    dest,
    destCoords,

    // Date range
    currentRange,
    handleRangeChange,

    // Selected activity
    selectedActivity,
    setSelectedActivity,

    // Activity operations
    addActivity: handleAddActivity,
    addActivityWithTitle,
    removeActivity: handleRemoveActivity,
    updateActivity: handleUpdateActivity,

    // Convenience methods
    addBlankActivity,
    addBlankAndSelect,
    changeDay,
    changePosition,
    save,
    deleteActivity,
    changeColor,
    closeDialog,

    // Access control
    canEdit,
    viewerUserId,
    isOwner,
    canManageMembers,
    isPublic,
  };
}

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

export function PlannerProvider({ children, ...props }: PropsWithChildren<PlannerProviderProps>) {
  const value = usePlannerContextValue(props);
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlannerContext() {
  const value = useContext(PlannerContext);
  if (value === undefined) {
    throw new Error("usePlannerContext must be inside PlannerProvider");
  }
  return value;
}

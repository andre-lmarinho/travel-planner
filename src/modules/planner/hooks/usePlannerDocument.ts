"use client";

import { addDays, parseISO } from "date-fns";
import { useCallback, useMemo } from "react";
import type { DateRange } from "react-day-picker";

import { buildInitialDays, syncDaysWithRange } from "@/features/activity/lib/dayOperations";
import type { DayPlan } from "@/features/activity/types";
import { usePlanCollaboration } from "@/features/events/hooks/usePlanCollaboration";
import { useDestinationCoordinates } from "@/features/search/hooks/useDestinationCoordinates";

interface PlannerDocumentOptions {
  initialDays?: DayPlan[];
  planId: string;
  dest?: string;
  viewerUserId?: string | null;
}

function getDefaultTripDates(count = 3): Date[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => addDays(today, index));
}

function dateRangeToArray(range: DateRange): Date[] {
  if (!range.from) return [];

  const dates: Date[] = [];
  const end = range.to ?? range.from;
  for (let current = range.from; current <= end; current = addDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

export function usePlannerDocument({
  initialDays,
  planId,
  dest,
  viewerUserId = null,
}: PlannerDocumentOptions) {
  const seedDays = initialDays ?? buildInitialDays(getDefaultTripDates());
  const {
    data: days = seedDays,
    persistDays,
    retryPending,
    hasPendingChanges,
  } = usePlanCollaboration(planId, {
    enabled: true,
    actorId: viewerUserId,
    initialDays: seedDays,
  });
  const destCoords = useDestinationCoordinates(dest);

  const setDays = useCallback(
    (nextDays: DayPlan[]) => {
      persistDays.mutate(nextDays);
    },
    [persistDays]
  );

  const currentRange = useMemo(() => {
    if (days.length === 0) return undefined;
    const from = parseISO(days[0].id);
    const to = parseISO(days[days.length - 1].id);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return undefined;
    return { from, to };
  }, [days]);

  const handleRangeChange = useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from) return;

      const syncedDays = syncDaysWithRange(days, dateRangeToArray(range));
      persistDays.mutate(syncedDays);
    },
    [days, persistDays]
  );

  return {
    planId,
    days,
    setDays,
    dest,
    destCoords,
    currentRange,
    handleRangeChange,
    retryPending,
    hasPendingChanges,
  };
}

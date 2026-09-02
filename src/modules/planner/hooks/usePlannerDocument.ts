"use client";

import { addDays, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { buildInitialDays, syncDaysWithRange } from "@/features/activity/lib/dayOperations";
import type { DayPlan } from "@/features/activity/types";
import { usePlanCollaboration } from "@/features/events/hooks/usePlanCollaboration";
import { trpc } from "@/trpc/react";

interface DestCoords {
  lat: number;
  lng: number;
}

interface PlannerDocumentOptions {
  initialDays?: DayPlan[];
  planId: string;
  dest?: string;
  canEdit?: boolean;
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
  canEdit = true,
  viewerUserId = null,
}: PlannerDocumentOptions) {
  const updateDatesMutation = trpc.viewer.plan.updateDates.useMutation();
  const seedDays = initialDays ?? buildInitialDays(getDefaultTripDates());
  const {
    data: days = seedDays,
    persistDays,
    retryPending,
    hasPendingChanges,
  } = usePlanCollaboration(planId, {
    enabled: canEdit,
    actorId: viewerUserId,
    initialDays: seedDays,
  });
  const [destCoords, setDestCoords] = useState<DestCoords | null>(null);

  useEffect(() => {
    if (!dest) {
      setDestCoords(null);
      return;
    }

    const controller = new AbortController();
    const fetchCoords = async () => {
      try {
        const params = new URLSearchParams({ text: dest });
        const response = await fetch(`/api/places/city-country?${params}`, { signal: controller.signal });
        if (!response.ok) return;

        const data = (await response.json()) as {
          results?: Array<{ latitude?: number; longitude?: number }>;
        };
        const first = data.results?.[0];
        if (first?.latitude != null && first.longitude != null) {
          setDestCoords({ lat: first.latitude, lng: first.longitude });
        }
      } catch {
        // Ignore abort errors and network failures.
      }
    };

    void fetchCoords();
    return () => controller.abort();
  }, [dest]);

  const setDays = useCallback(
    (nextDays: DayPlan[]) => {
      if (canEdit) persistDays.mutate(nextDays);
    },
    [canEdit, persistDays]
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
      if (!canEdit || !range?.from) return;

      const syncedDays = syncDaysWithRange(days, dateRangeToArray(range));
      setDays(syncedDays);

      const to = range.to ?? range.from;
      updateDatesMutation
        .mutateAsync({ planId, from: range.from.toISOString(), to: to.toISOString() })
        .catch((error) => {
          console.error("Failed to persist plan dates", { planId, error });
        });
    },
    [canEdit, days, planId, setDays, updateDatesMutation]
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cloneDays } from "@/features/activity/lib/activityOperations";
import type { DayPlan } from "@/features/activity/types";
import { trpc } from "@/trpc/react";

import { diffEvents } from "../lib/diffEvents";
import { applyEvent, reduceEvents } from "../lib/eventReducer";
import { subscribeToEvents } from "../services/eventsRealtimeClient";
import type { EventInsert, EventRecord } from "../types";

interface UsePlanCollaborationOptions {
  enabled?: boolean;
  actorId?: string | null;
}

interface PersistMutation {
  mutate: (state: DayPlan[]) => void;
  mutateAsync: (state: DayPlan[]) => Promise<void>;
  isPending: boolean;
}

export function usePlanCollaboration(
  planId: string,
  { enabled = true, actorId }: UsePlanCollaborationOptions = {}
): {
  data?: DayPlan[];
  isLoading: boolean;
  error?: unknown;
  persistDays: PersistMutation;
  version: number;
} {
  const versionRef = useRef(0);
  const snapshotRef = useRef<DayPlan[]>([]);
  const pendingEventIdsRef = useRef(new Set<string>());
  const [state, setState] = useState<{ days: DayPlan[]; version: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [isPending, setIsPending] = useState(false);
  const trpcUtils = trpc.useUtils();
  const appendMutation = trpc.viewer.events.append.useMutation();

  const load = useCallback(async () => {
    if (!planId || !enabled) return;
    setIsLoading(true);
    try {
      const snapshot = await trpcUtils.viewer.snapshots.get.fetch({ planId });
      const events = await trpcUtils.viewer.events.list.fetch({
        planId,
        sinceVersion: snapshot.version,
      });
      const reduced = reduceEvents(snapshot, events);
      versionRef.current = reduced.version;
      snapshotRef.current = cloneDays(reduced.days);
      setState(reduced);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, planId, trpcUtils]);

  useEffect(() => {
    if (!planId || !enabled) return;
    void load();
  }, [enabled, load, planId]);

  const handleRealtimeEvent = useCallback(
    (event: EventRecord) => {
      if (!enabled) return;
      if (pendingEventIdsRef.current.has(event.id)) {
        pendingEventIdsRef.current.delete(event.id);
      }
      if (event.version <= versionRef.current) return;
      if (event.version > versionRef.current + 1) {
        void load();
        return;
      }
      const nextDays = applyEvent(snapshotRef.current, event);
      versionRef.current = event.version;
      snapshotRef.current = cloneDays(nextDays);
      setState({ version: event.version, days: nextDays });
    },
    [enabled, load]
  );

  useEffect(() => {
    if (!planId || !enabled) return;
    const channel = subscribeToEvents(planId, handleRealtimeEvent);
    return () => {
      void channel.unsubscribe();
    };
  }, [enabled, handleRealtimeEvent, planId]);

  const appendEventsWithState = useCallback(
    async (events: EventInsert[], baseVersion: number, previous: DayPlan[]) => {
      const { version, events: storedEvents } = await appendMutation.mutateAsync({
        planId,
        baseVersion,
        events,
      });
      let updated = cloneDays(previous);
      for (const ev of storedEvents) {
        pendingEventIdsRef.current.delete(ev.id);
        updated = applyEvent(updated, ev);
      }

      const appliedVersion = storedEvents.at(-1)?.version ?? baseVersion;
      const expectedVersion = baseVersion + storedEvents.length;

      versionRef.current = appliedVersion;
      snapshotRef.current = cloneDays(updated);
      setState({ version: appliedVersion, days: updated });

      if (version > expectedVersion || appliedVersion !== version) {
        await load();
        return;
      }

      versionRef.current = version;
    },
    [appendMutation, load, planId]
  );

  const mutateAsync = useCallback(
    async (nextDays: DayPlan[]) => {
      if (!planId || !enabled) return;
      const prevSnapshot = cloneDays(snapshotRef.current);
      const events = diffEvents(planId, snapshotRef.current, nextDays, actorId);
      if (events.length === 0) return;
      const baseVersion = versionRef.current;
      setIsPending(true);
      let optimistic = cloneDays(snapshotRef.current);
      let tempVersion = baseVersion;
      const now = new Date().toISOString();
      for (const event of events) {
        pendingEventIdsRef.current.add(event.id);
        tempVersion += 1;
        const optimisticEvent = {
          ...event,
          version: tempVersion,
          createdAt: now,
        } as EventRecord;
        optimistic = applyEvent(optimistic, optimisticEvent);
      }
      versionRef.current = tempVersion;
      snapshotRef.current = cloneDays(optimistic);
      setState({ version: tempVersion, days: optimistic });

      try {
        await appendEventsWithState(events, baseVersion, prevSnapshot);
      } catch (err) {
        for (const event of events) {
          pendingEventIdsRef.current.delete(event.id);
        }
        versionRef.current = baseVersion;
        snapshotRef.current = prevSnapshot;
        setState({ version: baseVersion, days: prevSnapshot });
        setError(err);
        void load();
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [actorId, appendEventsWithState, enabled, load, planId]
  );

  const persistDays = useMemo<PersistMutation>(
    () => ({
      mutate: (value: DayPlan[]) => {
        void mutateAsync(value);
      },
      mutateAsync,
      isPending,
    }),
    [isPending, mutateAsync]
  );

  return {
    data: state?.days,
    isLoading,
    error,
    persistDays,
    version: state?.version ?? 0,
  };
}

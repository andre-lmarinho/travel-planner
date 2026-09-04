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
  initialDays?: DayPlan[];
}

interface PersistMutation {
  mutate: (state: DayPlan[]) => void;
  mutateAsync: (state: DayPlan[]) => Promise<void>;
  isPending: boolean;
}

function applyOperations(days: DayPlan[], operations: EventInsert[], baseVersion: number): DayPlan[] {
  const createdAt = new Date().toISOString();
  return operations.reduce(
    (current, operation, index) =>
      applyEvent(current, {
        ...operation,
        version: baseVersion + index + 1,
        createdAt,
      }),
    cloneDays(days)
  );
}

export function usePlanCollaboration(
  planId: string,
  { enabled = true, actorId, initialDays }: UsePlanCollaborationOptions = {}
): {
  data?: DayPlan[];
  isLoading: boolean;
  error?: unknown;
  persistDays: PersistMutation;
  retryPending: () => Promise<void>;
  hasPendingChanges: boolean;
  version: number;
} {
  const versionRef = useRef(0);
  const snapshotRef = useRef<DayPlan[]>([]);
  const pendingEventIdsRef = useRef(new Set<string>());
  const seedDaysRef = useRef(initialDays ? cloneDays(initialDays) : []);
  const [state, setState] = useState<{ days: DayPlan[]; version: number } | null>(() =>
    initialDays ? { days: cloneDays(initialDays), version: 0 } : null
  );
  const [isLoaded, setIsLoaded] = useState(!enabled);
  const loadedRef = useRef(!enabled);
  const pendingOperationsRef = useRef<EventInsert[] | null>(null);
  const deferredPersistingRef = useRef(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
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
      const baseDays =
        reduced.version === 0 && reduced.days.length === 0 ? cloneDays(seedDaysRef.current) : reduced.days;
      versionRef.current = reduced.version;
      snapshotRef.current = cloneDays(baseDays);
      const pendingOperations = pendingOperationsRef.current;
      const displayedDays =
        pendingOperations && !deferredPersistingRef.current
          ? applyOperations(baseDays, pendingOperations, reduced.version)
          : baseDays;
      setState({ version: reduced.version, days: displayedDays });
      setError(null);
      loadedRef.current = true;
      setIsLoaded(true);
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
      const pendingOperations = pendingOperationsRef.current;
      const displayedDays =
        pendingOperations && !deferredPersistingRef.current
          ? applyOperations(nextDays, pendingOperations, event.version)
          : nextDays;
      setState({ version: event.version, days: displayedDays });
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
      if (!loadedRef.current) {
        const operations = diffEvents(planId, seedDaysRef.current, nextDays, actorId);
        pendingOperationsRef.current = operations;
        setHasPendingChanges(true);
        setState((current) => ({ version: current?.version ?? 0, days: cloneDays(nextDays) }));
        return;
      }
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

  const retryPending = useCallback(async () => {
    const operations = pendingOperationsRef.current;
    if (!loadedRef.current || !operations) return;

    const rebasedDays = applyOperations(snapshotRef.current, operations, versionRef.current);
    deferredPersistingRef.current = true;
    try {
      await mutateAsync(rebasedDays);
      if (pendingOperationsRef.current === operations) {
        pendingOperationsRef.current = null;
        setHasPendingChanges(false);
      }
    } finally {
      deferredPersistingRef.current = false;
    }
  }, [mutateAsync]);

  useEffect(() => {
    if (!isLoaded || !pendingOperationsRef.current) return;
    void retryPending().catch(() => undefined);
  }, [isLoaded, retryPending]);

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
    retryPending,
    hasPendingChanges,
    version: state?.version ?? 0,
  };
}

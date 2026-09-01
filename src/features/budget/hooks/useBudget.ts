"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import * as BudgetService from "../services/BudgetService.actions";
import type { BudgetQueryResult, CategoryKey, Entry } from "../types";

export function useBudget(
  planId: string,
  activitiesTotal: number,
  options: {
    initialBudget?: number;
    initialEntries?: Entry[];
    canEdit?: boolean;
  } = {}
) {
  const { initialBudget = 0, initialEntries, canEdit = true } = options;
  const [budget, setBudgetState] = useState(initialBudget);
  const [entries, setEntries] = useState<Entry[]>(initialEntries ?? []);

  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<CategoryKey>("transport");
  const [amount, setAmount] = useState(0);

  const initialBudgetRef = useRef(0);
  const [persistError, setPersistError] = useState<string | null>(null);
  const qc = useQueryClient();

  // persistence follows edit access: a read-only viewer never fetches or writes, and renders
  // the initialEntries/initialBudget passed in from the snapshot.
  const persistEnabled = canEdit && Boolean(planId);
  const queryKey = ["budget", planId] as const;

  const budgetQuery = useQuery<BudgetQueryResult, Error, BudgetQueryResult, typeof queryKey>({
    queryKey,
    enabled: persistEnabled,
    queryFn: async () => BudgetService.getPlanBudget(planId),
  });
  const loaded = budgetQuery.data;
  const hasLoaded = !persistEnabled || budgetQuery.isSuccess;

  const saveBudgetMutation = useMutation({
    mutationFn: async (newBudget: number) => BudgetService.updatePlanBudget(planId, newBudget),
    onSuccess: (b: number) => {
      initialBudgetRef.current = b;
      qc.setQueryData<BudgetQueryResult>(queryKey, (prev) =>
        prev ? { ...prev, budget: b } : { budget: b, entries: [] }
      );
    },
    onError: (_error, newBudget) =>
      setPersistError(`Failed to update budget: planId=${planId} value=${newBudget}`),
  });
  const saveBudget = saveBudgetMutation.mutate;
  const setBudget = (value: number) => {
    setBudgetState(value);
    if (!persistEnabled) return;
    if (!budgetQuery.isSuccess) return;
    if (value === initialBudgetRef.current) return;
    setPersistError(null);
    saveBudget(value);
  };

  useEffect(() => {
    if (!persistEnabled) {
      initialBudgetRef.current = initialBudget;
      setBudgetState(initialBudget);
      setEntries(initialEntries ?? []);
      return;
    }
    if (loaded) {
      setBudgetState(loaded.budget);
      initialBudgetRef.current = loaded.budget;
      setEntries(loaded.entries);
    }
  }, [persistEnabled, initialBudget, initialEntries, loaded]);

  const categoryTotals = useMemo(() => {
    const totals: Record<CategoryKey, number> = {
      transport: 0,
      lodging: 0,
      food: 0,
      activities: activitiesTotal,
      shopping: 0,
      documents: 0,
    };
    for (const e of entries) {
      totals[e.category] += e.amount;
    }
    return totals;
  }, [entries, activitiesTotal]);

  const totalSpent = useMemo(
    () => Object.values(categoryTotals).reduce((s, n) => s + n, 0),
    [categoryTotals]
  );

  const addEntryMutation = useMutation({
    mutationFn: async (payload: { description: string; category: CategoryKey; amount: number }) => {
      const id = await BudgetService.createBudgetEntry(planId, payload);
      qc.invalidateQueries({ queryKey });
      return id;
    },
    onError: (_error, payload) =>
      setPersistError(`Failed to create budget entry: planId=${planId} category=${payload.category}`),
  });
  const addEntryMut = addEntryMutation.mutateAsync;

  const handleAdd = async () => {
    if (!canEdit) return;
    if (!desc || amount <= 0) return;
    setPersistError(null);
    if (persistEnabled) {
      try {
        const newId = await addEntryMut({
          description: desc,
          category: cat,
          amount,
        });
        setEntries((prev) => [...prev, { id: newId, description: desc, category: cat, amount }]);
      } catch {
        return;
      }
    } else {
      const newId = crypto.randomUUID();
      setEntries((prev) => [...prev, { id: newId, description: desc, category: cat, amount }]);
    }
    setDesc("");
    setAmount(0);
  };

  const updateEntryMutation = useMutation({
    mutationFn: async (updated: Entry) => {
      await BudgetService.updateBudgetEntry(updated);
      qc.invalidateQueries({ queryKey });
    },
    onError: (_error, updated) =>
      setPersistError(`Failed to update budget entry: planId=${planId} entryId=${updated.id}`),
  });
  const updateEntryMut = updateEntryMutation.mutateAsync;

  const handleUpdateEntry = async (index: number, updated: Entry) => {
    if (!canEdit) return;
    if (index < 0 || index >= entries.length) return;
    const previousEntries = [...entries];
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
    if (!persistEnabled) return;
    try {
      await updateEntryMut(updated);
    } catch {
      setEntries(previousEntries);
    }
  };

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await BudgetService.deleteBudgetEntry(id);
      qc.invalidateQueries({ queryKey });
    },
    onError: (_error, id) => setPersistError(`Failed to delete budget entry: planId=${planId} entryId=${id}`),
  });
  const deleteEntryMut = deleteEntryMutation.mutateAsync;

  const handleDeleteEntry = async (index: number) => {
    if (!canEdit) return;
    if (index < 0 || index >= entries.length) return;
    const entry = entries[index];
    const previousEntries = [...entries];
    setEntries((prev) => prev.filter((_, i) => i !== index));
    if (!persistEnabled) return;
    try {
      await deleteEntryMut(entry.id);
    } catch {
      setEntries(previousEntries);
    }
  };

  return {
    budget,
    setBudget,
    entries,
    categoryTotals,
    totalSpent,
    difference: budget - totalSpent,
    persistError,
    hasLoaded,

    desc,
    setDesc,
    cat,
    setCat,
    amount,
    setAmount,

    handleAdd,
    handleUpdateEntry,
    handleDeleteEntry,
  };
}

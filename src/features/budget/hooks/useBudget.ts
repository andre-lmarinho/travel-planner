"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { trpc } from "@/trpc/react";

import type { CategoryKey, Entry } from "../types";

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
  const utils = trpc.useUtils();

  // persistence follows edit access: a read-only viewer never fetches or writes, and renders
  // the initialEntries/initialBudget passed in from the snapshot.
  const persistEnabled = canEdit && Boolean(planId);
  const budgetQuery = trpc.budget.get.useQuery({ planId }, { enabled: persistEnabled });
  const loaded = budgetQuery.data;
  const hasLoaded = !persistEnabled || budgetQuery.isSuccess;

  const saveBudgetMutation = trpc.budget.updatePlan.useMutation({
    onSuccess: (budget) => {
      initialBudgetRef.current = budget;
      utils.budget.get.setData({ planId }, (previous) =>
        previous ? { ...previous, budget } : { budget, entries: [] }
      );
    },
    onError: (_error, input) =>
      setPersistError(`Failed to update budget: planId=${planId} value=${input.budget}`),
  });
  const saveBudget = saveBudgetMutation.mutate;
  const setBudget = (value: number) => {
    setBudgetState(value);
    if (!persistEnabled) return;
    if (!budgetQuery.isSuccess) return;
    if (value === initialBudgetRef.current) return;
    setPersistError(null);
    saveBudget({ planId, budget: value });
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

  const addEntryMutation = trpc.budget.createEntry.useMutation({
    onSuccess: () => {
      utils.budget.get.invalidate({ planId });
    },
    onError: (_error, input) =>
      setPersistError(`Failed to create budget entry: planId=${planId} category=${input.payload.category}`),
  });
  const addEntryMut = addEntryMutation.mutateAsync;

  const handleAdd = async () => {
    if (!canEdit) return;
    if (!desc || amount <= 0) return;
    setPersistError(null);
    if (persistEnabled) {
      try {
        const newId = await addEntryMut({
          planId,
          payload: { description: desc, category: cat, amount },
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

  const updateEntryMutation = trpc.budget.updateEntry.useMutation({
    onSuccess: () => {
      utils.budget.get.invalidate({ planId });
    },
    onError: (_error, input) =>
      setPersistError(`Failed to update budget entry: planId=${planId} entryId=${input.entry.id}`),
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
      await updateEntryMut({ entry: updated });
    } catch {
      setEntries(previousEntries);
    }
  };

  const deleteEntryMutation = trpc.budget.deleteEntry.useMutation({
    onSuccess: () => {
      utils.budget.get.invalidate({ planId });
    },
    onError: (_error, input) =>
      setPersistError(`Failed to delete budget entry: planId=${planId} entryId=${input.entryId}`),
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
      await deleteEntryMut({ entryId: entry.id });
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

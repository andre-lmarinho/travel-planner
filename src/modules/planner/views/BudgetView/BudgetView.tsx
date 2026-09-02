"use client";

import { useEffect, useState } from "react";

import type { DayPlan } from "@/features/activity/types";
import type { CategoryKey, Entry } from "@/features/budget/types";
import { usePlannerContext } from "@/modules/planner/hooks/PlannerContext";
import { trpc } from "@/trpc/react";

import { CategoryChart } from "./CategoryChart";
import { ExpenseTable } from "./ExpenseTable";
import { Summary } from "./Summary";

interface Props {
  initialEntries?: Entry[];
  canEdit?: boolean;
}

export function BudgetView({ initialEntries = [], canEdit = true }: Props) {
  const { planId, days } = usePlannerContext();
  const activitiesTotal = days.reduce(
    (sum, day: DayPlan) =>
      sum + day.activities.reduce((total, activity) => total + (activity.budget ?? 0), 0),
    0
  );
  const [entries, setEntries] = useState(initialEntries);
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<CategoryKey>("transport");
  const [amount, setAmount] = useState(0);
  const [persistError, setPersistError] = useState<string | null>(null);
  const persistEnabled = canEdit && Boolean(planId);
  const utils = trpc.useUtils();
  const budgetQuery = trpc.viewer.budget.get.useQuery({ planId }, { enabled: persistEnabled });

  useEffect(() => {
    setEntries(persistEnabled ? (budgetQuery.data?.entries ?? initialEntries) : initialEntries);
  }, [budgetQuery.data, initialEntries, persistEnabled]);

  const categoryTotals: Record<CategoryKey, number> = {
    transport: 0,
    lodging: 0,
    food: 0,
    activities: activitiesTotal,
    shopping: 0,
    documents: 0,
  };
  for (const entry of entries) categoryTotals[entry.category] += entry.amount;
  const totalSpent = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

  const createEntry = trpc.viewer.budget.createEntry.useMutation({
    onSuccess: () => utils.viewer.budget.get.invalidate({ planId }),
    onError: (_error, input) =>
      setPersistError(`Failed to create budget entry: planId=${planId} category=${input.payload.category}`),
  });
  const updateEntry = trpc.viewer.budget.updateEntry.useMutation({
    onSuccess: () => utils.viewer.budget.get.invalidate({ planId }),
    onError: (_error, input) =>
      setPersistError(`Failed to update budget entry: planId=${planId} entryId=${input.entry.id}`),
  });
  const deleteEntry = trpc.viewer.budget.deleteEntry.useMutation({
    onSuccess: () => utils.viewer.budget.get.invalidate({ planId }),
    onError: (_error, input) =>
      setPersistError(`Failed to delete budget entry: planId=${planId} entryId=${input.entryId}`),
  });

  const handleAdd = async () => {
    if (!canEdit || !desc || amount <= 0) return;
    setPersistError(null);
    const entry = { description: desc, category: cat, amount };

    try {
      const id = persistEnabled
        ? await createEntry.mutateAsync({ planId, payload: entry })
        : crypto.randomUUID();
      setEntries((current) => [...current, { id, ...entry }]);
      setDesc("");
      setAmount(0);
    } catch {
      // mutation error is already exposed by onError
    }
  };

  const handleUpdate = async (index: number, entry: Entry) => {
    if (!canEdit || index < 0 || index >= entries.length) return;
    const previous = entries;
    setEntries((current) => current.map((item, itemIndex) => (itemIndex === index ? entry : item)));
    if (!persistEnabled) return;

    try {
      await updateEntry.mutateAsync({ entry });
    } catch {
      setEntries(previous);
    }
  };

  const handleDelete = async (index: number) => {
    if (!canEdit || index < 0 || index >= entries.length) return;
    const entry = entries[index];
    setEntries((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (!persistEnabled) return;

    try {
      await deleteEntry.mutateAsync({ entryId: entry.id });
    } catch {
      setEntries((current) => [...current.slice(0, index), entry, ...current.slice(index)]);
    }
  };

  return (
    <div className="bg-background flex h-full w-full flex-col gap-5 overflow-y-auto rounded-2xl border p-4 [scrollbar-color:var(--border)_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent md:p-5">
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5 md:contents xl:flex">
          <Summary totalSpent={totalSpent} persistError={persistError} />
          <CategoryChart totalSpent={totalSpent} categoryTotals={categoryTotals} />
        </div>
        <div className="md:col-span-2 xl:col-span-1">
          <ExpenseTable
            entries={entries}
            amount={amount}
            desc={desc}
            cat={cat}
            canEdit={canEdit}
            onAdd={handleAdd}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onDescriptionChange={setDesc}
            onCategoryChange={setCat}
            onAmountChange={setAmount}
          />
        </div>
      </div>
    </div>
  );
}

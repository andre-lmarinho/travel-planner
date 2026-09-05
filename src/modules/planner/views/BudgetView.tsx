"use client";

import { useEffect, useRef, useState } from "react";

import type { DayPlan } from "@/features/activity/types";
import type { CategoryKey, Entry } from "@/features/budget/types";
import { CATEGORIES, CHART_COLORS } from "@/features/budget/types";
import { trpc } from "@/trpc/react";
import { Check, DollarSign, Pencil, Plus, Trash2, X } from "@/ui/components/icon";

const currencySymbol = "\u0024";
const EMPTY_ENTRIES: Entry[] = [];
const inputClasses =
  "h-11 w-full rounded-xl border border-border bg-background px-3 pl-8 text-right text-base font-semibold tabular-nums outline-none transition-shadow focus:ring-2 focus:ring-ring focus:ring-offset-1";
interface Props {
  planId: string;
  days: DayPlan[];
  initialEntries?: Entry[];
}

export function BudgetView({ planId, days, initialEntries }: Props) {
  const activitiesTotal = days.reduce(
    (sum, day: DayPlan) =>
      sum + day.activities.reduce((total, activity) => total + (activity.budget ?? 0), 0),
    0
  );
  const [persistError, setPersistError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const cache = utils.viewer.budget.get;
  const { data } = trpc.viewer.budget.get.useQuery(
    { planId },
    {
      initialData: { budget: 0, entries: initialEntries ?? EMPTY_ENTRIES },
    }
  );
  const entries = data.entries;

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

  const createEntry = trpc.viewer.budget.createEntry.useMutation();
  const updateEntry = trpc.viewer.budget.updateEntry.useMutation();
  const deleteEntry = trpc.viewer.budget.deleteEntry.useMutation();
  const isPending = createEntry.isPending || updateEntry.isPending || deleteEntry.isPending;

  const saveEntry = async (entry: ExpenseInput) => {
    await cache.cancel({ planId });
    const previous = cache.getData({ planId });
    setPersistError(null);
    try {
      if (entry.id) {
        const updated = { ...entry, id: entry.id };
        cache.setData(
          { planId },
          (current) =>
            current && {
              ...current,
              entries: current.entries.map((item) => (item.id === updated.id ? updated : item)),
            }
        );
        await updateEntry.mutateAsync({ entry: updated });
      } else {
        const id = await createEntry.mutateAsync({ planId, payload: entry });
        cache.setData(
          { planId },
          (current) => current && { ...current, entries: [...current.entries, { ...entry, id }] }
        );
      }
      return true;
    } catch {
      cache.setData({ planId }, previous);
      setPersistError(`Failed to save budget entry: planId=${planId} entryId=${entry.id ?? "new"}`);
      return false;
    } finally {
      void cache.invalidate({ planId });
    }
  };
  const removeEntry = async (entryId: string) => {
    await cache.cancel({ planId });
    const previous = cache.getData({ planId });
    setPersistError(null);
    cache.setData(
      { planId },
      (current) => current && { ...current, entries: current.entries.filter((item) => item.id !== entryId) }
    );
    try {
      await deleteEntry.mutateAsync({ entryId });
    } catch {
      cache.setData({ planId }, previous);
      setPersistError(`Failed to delete budget entry: planId=${planId} entryId=${entryId}`);
    } finally {
      void cache.invalidate({ planId });
    }
  };

  return (
    <div className="bg-background flex h-full w-full flex-col gap-5 overflow-y-auto rounded-2xl border p-2 [scrollbar-color:var(--border)_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent md:p-4">
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5 md:contents xl:flex">
          <Summary totalSpent={totalSpent} persistError={persistError} />
          <CategoryChart totalSpent={totalSpent} categoryTotals={categoryTotals} />
        </div>
        <div className="md:col-span-2 xl:col-span-1">
          <ExpenseTable entries={entries} onSave={saveEntry} onDelete={removeEntry} disabled={isPending} />
        </div>
      </div>
    </div>
  );
}

function AmountDisplay({
  value,
  compact = false,
  ariaLabel = "Amount",
}: {
  value: number;
  compact?: boolean;
  ariaLabel?: string;
}) {
  const formattedValue = value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const accessibleLabel = (ariaLabel || "Amount").concat(": ", currencySymbol, formattedValue);

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={
        compact
          ? "inline-flex items-baseline gap-1 text-base font-semibold tracking-[-0.02em] tabular-nums"
          : "inline-flex items-baseline gap-1 text-2xl font-semibold tracking-[-0.04em] tabular-nums"
      }>
      <span
        className={
          compact
            ? "text-current text-xs font-medium opacity-65"
            : "text-current text-base font-medium opacity-65"
        }>
        {currencySymbol}
      </span>
      <span>{formattedValue}</span>
    </span>
  );
}

export function CategoryChart({
  totalSpent,
  categoryTotals,
}: {
  totalSpent: number;
  categoryTotals: Record<CategoryKey, number>;
}) {
  const maxCategoryValue = Math.max(...Object.values(categoryTotals), 0);

  return (
    <section
      aria-labelledby="budget-categories-heading"
      className="border-border bg-card h-fit rounded-2xl border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="budget-categories-heading" className="font-semibold tracking-[-0.02em]">
          Categories
        </h2>
      </div>

      {totalSpent <= 0 ? (
        <p className="bg-muted/35 text-muted-foreground rounded-xl px-3 py-6 text-center text-sm">
          No expenses yet
        </p>
      ) : (
        <div>
          {CATEGORIES.map((category, index) => {
            const value = categoryTotals[category.key] || 0;
            const percent = maxCategoryValue > 0 ? Math.min(100, (value / maxCategoryValue) * 100) : 0;
            const { label, icon: Icon } = category;

            return (
              <div key={category.key} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon size={13} aria-hidden="true" className="text-muted-foreground shrink-0" />
                    <span className="truncate text-sm">{label}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                    $\{value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  aria-label={`${label} usage ${Math.round(percent)}%`}
                  className="bg-muted mt-2 h-1.5 rounded-full">
                  <div
                    className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function Summary({ totalSpent, persistError }: { totalSpent: number; persistError: string | null }) {
  if (persistError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {persistError}
      </p>
    );
  }

  return (
    <section aria-label="Summary">
      <article className="border-border bg-card rounded-2xl border p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold tracking-[-0.02em]">Total spent</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">All recorded expenses</p>
          </div>
          <span className="bg-card text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
            <DollarSign className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6">
          <AmountDisplay value={totalSpent} ariaLabel="Total spent" />
        </div>
      </article>
    </section>
  );
}

type ExpenseInput = Omit<Entry, "id"> & { id?: string };
type ExpenseDraft = Omit<ExpenseInput, "amount"> & { amount: string };
const EMPTY_DRAFT: ExpenseDraft = { description: "", category: "transport", amount: "" };

function ExpenseEditor({
  entry,
  onSave,
  onCancel,
  disabled,
}: {
  entry?: Entry;
  onSave: (entry: ExpenseInput) => Promise<boolean>;
  onCancel?: () => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>(() =>
    entry ? { ...entry, amount: String(entry.amount) } : EMPTY_DRAFT
  );
  const [submitting, setSubmitting] = useState(false);
  const descriptionRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (entry) descriptionRef.current?.focus();
  }, [entry]);
  const amount = Number(draft.amount);
  const isInvalid = !Number.isFinite(amount) || !draft.description.trim() || amount <= 0;
  const save = async () => {
    if (submitting || isInvalid) return;
    setSubmitting(true);
    try {
      if (await onSave({ ...draft, description: draft.description.trim(), amount })) {
        if (entry) onCancel?.();
        else setDraft({ ...EMPTY_DRAFT, category: draft.category });
      }
    } finally {
      setSubmitting(false);
    }
  };
  const id = entry?.id ?? "new-row";
  return (
    <tr className="border-border">
      <td className="p-2">
        <input
          ref={descriptionRef}
          id={`description-${id}`}
          name="description"
          aria-label="Description"
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          placeholder="Description"
          autoComplete="off"
          disabled={disabled || submitting}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </td>
      <td className="p-2">
        <select
          id={`category-${id}`}
          aria-label="Category"
          value={draft.category}
          disabled={disabled || submitting}
          onChange={(event) => {
            const category = CATEGORIES.find(({ key }) => key === event.target.value);
            if (category) setDraft({ ...draft, category: category.key });
          }}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
          {CATEGORIES.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2 text-right">
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {currencySymbol}
          </span>
          <input
            id={`amount-${id}`}
            aria-label="Amount"
            value={draft.amount}
            disabled={disabled || submitting}
            onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
            type="text"
            inputMode="decimal"
            placeholder="Amount"
            autoComplete="off"
            className={inputClasses}
          />
        </div>
      </td>
      <td className="p-2 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => void save()}
            aria-label={entry ? "Save entry" : "Add expense"}
            disabled={disabled || submitting || isInvalid}
            className="border-border bg-background inline-flex size-8 items-center justify-center rounded-full border disabled:opacity-50">
            {entry ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel edit"
              disabled={disabled || submitting}
              className="border-border bg-background inline-flex size-8 items-center justify-center rounded-full border">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ExpenseTable({
  entries,
  onSave,
  onDelete,
  disabled,
}: {
  entries: Entry[];
  onSave: (entry: ExpenseInput) => Promise<boolean>;
  onDelete: (entryId: string) => Promise<void>;
  disabled: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const renderRow = (entry: Entry) => {
    if (editingId === entry.id)
      return (
        <ExpenseEditor
          key={entry.id}
          entry={entry}
          onSave={onSave}
          onCancel={() => setEditingId(null)}
          disabled={disabled}
        />
      );
    return (
      <tr key={entry.id} className="border-border">
        <th scope="row" className="p-2 text-left font-medium">
          {entry.description}
        </th>
        <td className="p-2">{CATEGORIES.find(({ key }) => key === entry.category)?.label ?? "Unknown"}</td>
        <td className="p-2 text-right">
          <AmountDisplay value={entry.amount} compact />
        </td>
        <td className="p-2 text-right">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingId(entry.id)}
              aria-label="Edit entry"
              disabled={disabled}
              className="border-border bg-background inline-flex size-8 items-center justify-center rounded-full border">
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => void onDelete(entry.id)}
              aria-label="Delete entry"
              disabled={disabled}
              className="border-border bg-background inline-flex size-8 items-center justify-center rounded-full border">
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section className="min-w-0" aria-labelledby="expenses-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="expenses-heading" className="font-semibold tracking-[-0.02em]">
          Expenses
        </h2>
      </div>
      <table
        aria-labelledby="expense-table-caption"
        className="w-full border-separate border-spacing-y-2 text-sm">
        <caption id="expense-table-caption" className="sr-only">
          Expenses table showing description, category, amount, and actions
        </caption>
        <thead className="text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="p-2 text-left font-normal">
              Description
            </th>
            <th scope="col" className="p-2 text-left font-normal">
              Category
            </th>
            <th scope="col" className="w-32 p-2 text-right font-normal">
              Amount
            </th>
            <th scope="col" className="p-2 text-right font-normal">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="[&>tr]:rounded-xl [&>tr]:border [&>tr]:bg-background [&>tr]:shadow-sm">
          {entries.map(renderRow)}
          <ExpenseEditor onSave={onSave} disabled={disabled} />
        </tbody>
      </table>
    </section>
  );
}

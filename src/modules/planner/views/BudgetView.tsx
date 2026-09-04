"use client";

import type { FocusEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { DayPlan } from "@/features/activity/types";
import type { BudgetRowInputsResult, CategoryKey, Entry } from "@/features/budget/types";
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
  canEdit?: boolean;
}

export function BudgetView({ planId, days, initialEntries, canEdit = true }: Props) {
  const seedEntries = initialEntries ?? EMPTY_ENTRIES;
  const activitiesTotal = days.reduce(
    (sum, day: DayPlan) =>
      sum + day.activities.reduce((total, activity) => total + (activity.budget ?? 0), 0),
    0
  );
  const [entries, setEntries] = useState(seedEntries);
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<CategoryKey>("transport");
  const [amount, setAmount] = useState(0);
  const [persistError, setPersistError] = useState<string | null>(null);
  const persistEnabled = canEdit && Boolean(planId);
  const utils = trpc.useUtils();
  const budgetQuery = trpc.viewer.budget.get.useQuery({ planId }, { enabled: persistEnabled });

  useEffect(() => {
    setEntries(persistEnabled ? (budgetQuery.data?.entries ?? seedEntries) : seedEntries);
  }, [budgetQuery.data, persistEnabled, seedEntries]);

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
    <div className="bg-background flex h-full w-full flex-col gap-5 overflow-y-auto rounded-2xl border p-2 [scrollbar-color:var(--border)_transparent] scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent md:p-4">
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

export interface AmountDisplayProps {
  value?: number | string;
  variant: "input" | "span";
  onValueChange?: (value: number) => void;
  onBlur?: () => void;
  ariaLabel?: string;
  placeholder?: string;
  inputId?: string;
  compact?: boolean;
}

export function AmountDisplay({
  value = 0,
  variant,
  onValueChange,
  onBlur,
  ariaLabel,
  placeholder,
  inputId,
  compact = false,
}: AmountDisplayProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const lastReportedValue = useRef<number>(Number(value) || 0);

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    const parsedValue = Number(inputValue);
    const normalized = Number.isFinite(parsedValue) ? parsedValue : 0;
    if (onValueChange && normalized !== lastReportedValue.current) {
      onValueChange(normalized);
      lastReportedValue.current = normalized;
    }
    setInputValue(normalized ? String(normalized) : "0");
    onBlur?.();
  };

  if (variant === "input") {
    return (
      <div className="relative">
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-base font-semibold">
          {currencySymbol}
        </span>
        <input
          id={inputId}
          name={inputId}
          type="text"
          value={inputValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            const parsedValue = Number(nextValue);
            const normalized = Number.isFinite(parsedValue) ? parsedValue : 0;
            onValueChange?.(normalized);
            lastReportedValue.current = normalized;
          }}
          onBlur={handleBlur}
          autoComplete="off"
          placeholder={placeholder}
          className={inputClasses}
          inputMode="decimal"
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const formattedValue = numericValue.toLocaleString("en-US", {
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
          <AmountDisplay value={totalSpent} variant="span" ariaLabel="Total spent" />
        </div>
      </article>
    </section>
  );
}

const isValidCategoryKey = (value: string): value is CategoryKey =>
  CATEGORIES.some(({ key }) => key === value);

function BudgetRowInputs({ description, category, amount }: BudgetRowInputsResult) {
  const descriptionRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!description.autoFocus) return;
    descriptionRef.current?.focus();
  }, [description.autoFocus]);

  return (
    <>
      <td className="p-2">
        <label htmlFor={description.id} className="sr-only">
          {description.ariaLabel ?? "Description"}
        </label>
        <input
          ref={descriptionRef}
          id={description.id}
          name="description"
          value={description.value}
          autoComplete="off"
          placeholder={description.placeholder}
          onChange={(event) => description.onChange(event.target.value)}
          aria-label={description.ariaLabel ?? "Description"}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />
      </td>
      <td className="p-2">
        <label htmlFor={category.id} className="sr-only">
          {category.ariaLabel ?? "Category"}
        </label>
        <select
          id={category.id}
          name="category"
          value={category.value}
          onChange={(event) => {
            const value = event.target.value;
            if (isValidCategoryKey(value)) category.onChange(value);
          }}
          aria-label={category.ariaLabel ?? "Category"}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring focus:ring-offset-1">
          {CATEGORIES.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2 text-right">
        <label htmlFor={amount.id} className="sr-only">
          {amount.ariaLabel ?? "Amount"}
        </label>
        <AmountDisplay
          inputId={amount.id}
          value={amount.value}
          variant="input"
          onValueChange={amount.onValueChange}
          onBlur={amount.onBlur}
          ariaLabel={amount.ariaLabel ?? "Amount"}
          placeholder={amount.placeholder}
        />
      </td>
    </>
  );
}

export function ExpenseTable({
  entries,
  amount,
  desc,
  cat,
  canEdit = true,
  onAdd,
  onDelete,
  onUpdate,
  onDescriptionChange,
  onCategoryChange,
  onAmountChange,
}: {
  entries: Entry[];
  amount: number;
  desc: string;
  cat: CategoryKey;
  canEdit?: boolean;
  onAdd: () => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onUpdate: (index: number, entry: Entry) => Promise<void>;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: CategoryKey) => void;
  onAmountChange: (value: number) => void;
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [amountInput, onAmountChangeInput] = useState(amount ? String(amount) : "");
  const [editAmountInput, setEditAmountInput] = useState("");

  const startEdit = (index: number) => {
    if (!canEdit || index < 0 || index >= entries.length) return;
    setEditIndex(index);
    setEditEntry(entries[index]);
    setEditAmountInput(String(entries[index].amount));
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditEntry(null);
  };

  const saveEdit = (index: number, entry: Entry) => {
    onUpdate(index, entry);
    cancelEdit();
  };

  const renderRow = (entry: Entry, index: number) => {
    const isEditing = canEdit && editIndex === index && editEntry;

    if (isEditing) {
      const editId = `edit-${index}`;

      return (
        <tr key={entry.id} className="border-border">
          <BudgetRowInputs
            description={{
              id: `description-${editId}`,
              value: editEntry.description,
              onChange: (value) => setEditEntry((prev) => (prev ? { ...prev, description: value } : prev)),
              autoFocus: true,
            }}
            category={{
              id: `category-${editId}`,
              value: editEntry.category,
              onChange: (value) => setEditEntry((prev) => (prev ? { ...prev, category: value } : prev)),
            }}
            amount={{
              id: `amount-${editId}`,
              value: editAmountInput,
              onValueChange: (value) => setEditAmountInput(String(value)),
              onBlur: () => {
                const normalized = Number(editAmountInput) || 0;
                setEditEntry((prev) => (prev ? { ...prev, amount: normalized } : prev));
                setEditAmountInput(normalized ? String(normalized) : "0");
              },
            }}
          />
          <td className="p-2 text-right">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => saveEdit(index, editEntry)}
                aria-label="Save entry"
                className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors">
                <Check className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Cancel edit"
                className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    const formattedAmount = entry.amount.toFixed(2);
    const categoryLabel = CATEGORIES.find((c) => c.key === entry.category)?.label ?? "Unknown";

    return (
      <tr key={entry.id} className="border-border">
        <th scope="row" className="p-2 text-left font-medium">
          {entry.description}
        </th>
        <td className="p-2">{categoryLabel}</td>
        <td className="p-2 text-right">
          <AmountDisplay
            value={entry.amount}
            variant="span"
            compact
            ariaLabel={`Amount: $${formattedAmount}`}
          />
        </td>
        <td className="p-2 text-right">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => startEdit(index)}
              aria-label="Edit entry"
              className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEdit}>
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onDelete(index)}
                aria-label="Delete entry"
                className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canEdit}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderNewRow = () => {
    if (!canEdit) return null;

    const newId = "new-row";

    return (
      <tr className="border-border">
        <BudgetRowInputs
          description={{
            id: `description-${newId}`,
            value: desc,
            onChange: onDescriptionChange,
            placeholder: "Description",
          }}
          category={{
            id: `category-${newId}`,
            value: cat,
            onChange: onCategoryChange,
          }}
          amount={{
            id: `amount-${newId}`,
            value: amountInput,
            onValueChange: (value) => {
              onAmountChangeInput(String(value));
              onAmountChange(value);
            },
            onBlur: () => {
              const normalized = Number(amountInput) || 0;
              onAmountChange(normalized);
              onAmountChangeInput(normalized ? String(normalized) : "0");
            },
            placeholder: "Amount",
          }}
        />
        <td className="p-2 text-right">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onAdd}
              aria-label="Add expense"
              className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors">
              <Plus className="size-4" aria-hidden="true" />
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
          {renderNewRow()}
        </tbody>
      </table>
    </section>
  );
}

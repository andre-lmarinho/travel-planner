"use client";

import { useEffect, useRef, useState } from "react";
import type { BudgetRowInputsResult, CategoryKey, Entry } from "@/features/budget/types";
import { CATEGORIES } from "@/features/budget/types";
import { Check, Pencil, Plus, Trash2, X } from "@/ui/components/icon";
import { AmountDisplay } from "./AmountDisplay";

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

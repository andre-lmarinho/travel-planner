"use client";

import { useEffect, useRef, useState } from "react";

import { Check, Pencil, Plus, Trash2, X } from "@/ui/components/icon";
import { useBudgetContext } from "../hooks/BudgetContext";
import { normalizeAmount } from "../lib/normalizeAmount";
import type { BudgetRowInputsResult, CategoryKey, Entry } from "../types";
import { CATEGORIES } from "../types";
import { AmountDisplay } from "../ui/AmountDisplay";

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
          className="focus:ring-primary w-full rounded border px-2 py-1 focus:ring-2 focus:ring-offset-2 focus:outline-none"
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
          className="focus:ring-primary w-full rounded border px-2 py-1 focus:ring-2 focus:ring-offset-2 focus:outline-none">
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

export function ExpenseTable({ canEdit = true }: { canEdit?: boolean }) {
  const {
    entries,
    amount,
    handleAdd,
    handleDeleteEntry,
    handleUpdateEntry,
    desc,
    setDesc,
    cat,
    setCat,
    setAmount,
  } = useBudgetContext();
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [amountInput, setAmountInput] = useState(amount ? String(amount) : "");
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
    handleUpdateEntry(index, entry);
    cancelEdit();
  };

  const renderRow = (entry: Entry, index: number) => {
    const isEditing = canEdit && editIndex === index && editEntry;

    if (isEditing) {
      const editId = `edit-${index}`;

      return (
        <tr key={entry.id} className="border-t">
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
                const normalized = normalizeAmount(editAmountInput);
                setEditEntry((prev) => (prev ? { ...prev, amount: normalized } : prev));
                setEditAmountInput(normalized ? String(normalized) : "0");
              },
            }}
          />
          <td className="flex justify-end gap-2 p-2 text-right">
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
          </td>
        </tr>
      );
    }

    const formattedAmount = entry.amount.toFixed(2);
    const categoryLabel = CATEGORIES.find((c) => c.key === entry.category)?.label ?? "Unknown";

    return (
      <tr key={entry.id} className="border-t">
        <th scope="row" className="p-2 text-left font-medium">
          {entry.description}
        </th>
        <td className="p-2">{categoryLabel}</td>
        <td className="p-2 text-right">
          <AmountDisplay value={entry.amount} variant="span" ariaLabel={`Amount: $${formattedAmount}`} />
        </td>
        <td className="flex justify-end gap-2 p-2 text-right">
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
              onClick={() => handleDeleteEntry(index)}
              aria-label="Delete entry"
              className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canEdit}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderNewRow = () => {
    if (!canEdit) return null;

    const newId = "new-row";

    return (
      <tr className="border-t">
        <BudgetRowInputs
          description={{
            id: `description-${newId}`,
            value: desc,
            onChange: setDesc,
            placeholder: "Description",
          }}
          category={{
            id: `category-${newId}`,
            value: cat,
            onChange: setCat,
          }}
          amount={{
            id: `amount-${newId}`,
            value: amountInput,
            onValueChange: (value) => {
              setAmountInput(String(value));
              setAmount(value);
            },
            onBlur: () => {
              const normalized = normalizeAmount(amountInput);
              setAmount(normalized);
              setAmountInput(normalized ? String(normalized) : "0");
            },
            placeholder: "Amount",
          }}
        />
        <td className="p-2 text-right">
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Add expense"
            className="border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-colors">
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <section className="col-span-2 md:ml-12" aria-labelledby="expenses-heading">
      <h2 id="expenses-heading" className="pb-2 font-semibold">
        Expenses
      </h2>
      <table aria-labelledby="expense-table-caption" className="w-full rounded border text-sm">
        <caption id="expense-table-caption" className="sr-only">
          Expenses table showing description, category, amount, and actions
        </caption>
        <thead className="bg-card">
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
        <tbody>
          {entries.map(renderRow)}
          {renderNewRow()}
        </tbody>
      </table>
    </section>
  );
}

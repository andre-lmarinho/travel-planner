"use server";

import { ApplicationError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import * as BudgetRepository from "../repositories/BudgetRepository";
import type { BudgetQueryResult, Entry } from "../types";

export async function getPlanBudget(planId: string): Promise<BudgetQueryResult> {
  const client = createSupabaseServerClient();

  const [budgetRow, entryRows] = await Promise.all([
    BudgetRepository.fetchPlanBudgetRow(planId, { client }),
    BudgetRepository.fetchPlanBudgetEntries(planId, { client }),
  ]);

  const entries = BudgetRepository.mapEntries(entryRows);

  return {
    budget: budgetRow?.budget ?? 0,
    entries,
  };
}

export async function updatePlanBudget(planId: string, newBudget: number): Promise<number> {
  if (newBudget < 0) {
    throw new ApplicationError("BAD_REQUEST", "Budget cannot be negative");
  }
  const client = createSupabaseServerClient();
  const data = await BudgetRepository.updatePlanBudget(planId, newBudget, { client });
  return data?.budget ?? newBudget;
}

type BudgetEntryInput = Pick<Entry, "description" | "category" | "amount">;

export async function createBudgetEntry(planId: string, payload: BudgetEntryInput): Promise<string> {
  const client = createSupabaseServerClient();
  const { id } = await BudgetRepository.createBudgetEntry(planId, payload, { client });
  return id;
}

export async function updateBudgetEntry(entry: Entry): Promise<void> {
  const client = createSupabaseServerClient();
  const payload: Pick<Entry, "description" | "category" | "amount"> = {
    description: entry.description,
    category: entry.category,
    amount: entry.amount,
  };
  await BudgetRepository.updateBudgetEntry(entry.id, payload, { client });
}

export async function deleteBudgetEntry(entryId: string): Promise<void> {
  const client = createSupabaseServerClient();
  await BudgetRepository.deleteBudgetEntry(entryId, { client });
}

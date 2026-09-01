"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { BudgetRepository } from "../repositories/BudgetRepository";
import type { BudgetQueryResult, Entry } from "../types";
import { type BudgetEntryInput, BudgetService } from "./BudgetService";

function makeBudgetService(): BudgetService {
  return new BudgetService(new BudgetRepository(createSupabaseServerClient()));
}

export async function getPlanBudget(planId: string): Promise<BudgetQueryResult> {
  return makeBudgetService().getPlanBudget(planId);
}

export async function updatePlanBudget(planId: string, newBudget: number): Promise<number> {
  return makeBudgetService().updatePlanBudget(planId, newBudget);
}

export async function createBudgetEntry(planId: string, payload: BudgetEntryInput): Promise<string> {
  return makeBudgetService().createBudgetEntry(planId, payload);
}

export async function updateBudgetEntry(entry: Entry): Promise<void> {
  return makeBudgetService().updateBudgetEntry(entry);
}

export async function deleteBudgetEntry(entryId: string): Promise<void> {
  return makeBudgetService().deleteBudgetEntry(entryId);
}

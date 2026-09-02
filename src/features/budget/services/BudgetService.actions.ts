"use server";

import { getViewer } from "@/features/auth/lib/session";
import { ApplicationError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/supabase/server";

import { BudgetRepository } from "../repositories/BudgetRepository";
import type { BudgetQueryResult, Entry } from "../types";
import { type BudgetEntryInput, BudgetService } from "./BudgetService";

function makeBudgetService(): BudgetService {
  return new BudgetService(new BudgetRepository(createSupabaseServerClient()));
}

async function requireViewer(operation: string): Promise<void> {
  if (!(await getViewer())) {
    throw new ApplicationError("UNAUTHORIZED", `Sign in to ${operation}.`);
  }
}

export async function getPlanBudget(planId: string): Promise<BudgetQueryResult> {
  await requireViewer("view the plan budget");
  return makeBudgetService().getPlanBudget(planId);
}

export async function updatePlanBudget(planId: string, newBudget: number): Promise<number> {
  await requireViewer("update the plan budget");
  return makeBudgetService().updatePlanBudget(planId, newBudget);
}

export async function createBudgetEntry(planId: string, payload: BudgetEntryInput): Promise<string> {
  await requireViewer("create a budget entry");
  return makeBudgetService().createBudgetEntry(planId, payload);
}

export async function updateBudgetEntry(entry: Entry): Promise<void> {
  await requireViewer("update a budget entry");
  return makeBudgetService().updateBudgetEntry(entry);
}

export async function deleteBudgetEntry(entryId: string): Promise<void> {
  await requireViewer("delete a budget entry");
  return makeBudgetService().deleteBudgetEntry(entryId);
}

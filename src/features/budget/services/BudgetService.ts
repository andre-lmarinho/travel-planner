import { ApplicationError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { BudgetRepository } from "../repositories/BudgetRepository";
import type { BudgetQueryResult, Entry } from "../types";

type BudgetEntryInput = Pick<Entry, "description" | "category" | "amount">;

export class BudgetService {
  constructor(private readonly repo: BudgetRepository) {}

  async getPlanBudget(planId: string): Promise<BudgetQueryResult> {
    const [budgetRow, entryRows] = await Promise.all([
      this.repo.fetchPlanBudgetRow(planId),
      this.repo.fetchPlanBudgetEntries(planId),
    ]);

    const entries = BudgetRepository.mapEntries(entryRows);

    return {
      budget: budgetRow?.budget ?? 0,
      entries,
    };
  }

  async updatePlanBudget(planId: string, newBudget: number): Promise<number> {
    if (newBudget < 0) {
      throw new ApplicationError("BAD_REQUEST", "Budget cannot be negative");
    }
    const data = await this.repo.updatePlanBudget(planId, newBudget);
    return data?.budget ?? newBudget;
  }

  async createBudgetEntry(planId: string, payload: BudgetEntryInput): Promise<string> {
    const { id } = await this.repo.createBudgetEntry(planId, payload);
    return id;
  }

  async updateBudgetEntry(entry: Entry): Promise<void> {
    await this.repo.updateBudgetEntry(entry.id, {
      description: entry.description,
      category: entry.category,
      amount: entry.amount,
    });
  }

  async deleteBudgetEntry(entryId: string): Promise<void> {
    await this.repo.deleteBudgetEntry(entryId);
  }
}

function makeBudgetService(): BudgetService {
  return new BudgetService(new BudgetRepository(createSupabaseServerClient()));
}

export async function getPlanBudget(planId: string): Promise<BudgetQueryResult> {
  "use server";
  return makeBudgetService().getPlanBudget(planId);
}

export async function updatePlanBudget(planId: string, newBudget: number): Promise<number> {
  "use server";
  return makeBudgetService().updatePlanBudget(planId, newBudget);
}

export async function createBudgetEntry(planId: string, payload: BudgetEntryInput): Promise<string> {
  "use server";
  return makeBudgetService().createBudgetEntry(planId, payload);
}

export async function updateBudgetEntry(entry: Entry): Promise<void> {
  "use server";
  return makeBudgetService().updateBudgetEntry(entry);
}

export async function deleteBudgetEntry(entryId: string): Promise<void> {
  "use server";
  return makeBudgetService().deleteBudgetEntry(entryId);
}

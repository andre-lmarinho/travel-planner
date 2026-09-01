import "server-only";

import { ApplicationError } from "@/lib/errors";
import { BudgetRepository } from "../repositories/BudgetRepository";
import type { BudgetQueryResult, Entry } from "../types";

export type BudgetEntryInput = Pick<Entry, "description" | "category" | "amount">;

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

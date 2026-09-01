import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import type { Database } from "@/supabase/types";

import type { CategoryKey, Entry } from "../types";

export type BudgetPlanRow = {
  budget: Database["public"]["Tables"]["plans"]["Row"]["budget"];
};

export type BudgetEntryRow = Pick<
  Database["public"]["Tables"]["budget_entries"]["Row"],
  "id" | "description" | "category" | "amount"
>;

type BudgetEntryInsertPayload = Pick<
  Database["public"]["Tables"]["budget_entries"]["Insert"],
  "description" | "category" | "amount"
>;

const CATEGORY_KEYS: CategoryKey[] = ["transport", "lodging", "food", "activities", "shopping", "documents"];

function isCategoryKey(value: string): value is CategoryKey {
  return CATEGORY_KEYS.includes(value as CategoryKey);
}

export class BudgetRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchPlanBudgetRow(planId: string): Promise<BudgetPlanRow | null> {
    const { data, error } = await this.client.from("plans").select("budget").eq("id", planId).single();

    if (error) {
      throw formatSupabaseError({
        operation: "fetchPlanBudgetRow",
        identifiers: { planId },
        error,
      });
    }

    return data ?? null;
  }

  async fetchPlanBudgetEntries(planId: string): Promise<BudgetEntryRow[]> {
    const { data, error } = await this.client
      .from("budget_entries")
      .select("id, description, category, amount")
      .eq("plan_id", planId);

    if (error) {
      throw formatSupabaseError({
        operation: "fetchPlanBudgetEntries",
        identifiers: { planId },
        error,
      });
    }

    return data ?? [];
  }

  async updatePlanBudget(planId: string, newBudget: number): Promise<BudgetPlanRow | null> {
    const { data, error } = await this.client
      .from("plans")
      .update({ budget: newBudget })
      .eq("id", planId)
      .select("budget")
      .single();

    if (error) {
      throw formatSupabaseError({
        operation: "updatePlanBudget",
        identifiers: { planId },
        error,
      });
    }

    return data ?? null;
  }

  async createBudgetEntry(planId: string, payload: BudgetEntryInsertPayload): Promise<{ id: string }> {
    const { data, error } = await this.client
      .from("budget_entries")
      .insert({
        plan_id: planId,
        description: payload.description,
        category: payload.category,
        amount: payload.amount,
      })
      .select("id")
      .single();

    if (error) {
      throw formatSupabaseError({
        operation: "createBudgetEntry",
        identifiers: { planId },
        error,
      });
    }

    if (!data) {
      throw formatSupabaseError({
        operation: "createBudgetEntry:missing-row",
        identifiers: { planId },
      });
    }

    return data;
  }

  async updateBudgetEntry(entryId: string, payload: BudgetEntryInsertPayload): Promise<void> {
    const { error } = await this.client
      .from("budget_entries")
      .update({
        description: payload.description,
        category: payload.category,
        amount: payload.amount,
      })
      .eq("id", entryId);

    if (error) {
      throw formatSupabaseError({
        operation: "updateBudgetEntry",
        identifiers: { entryId },
        error,
      });
    }
  }

  async deleteBudgetEntry(entryId: string): Promise<void> {
    const { error } = await this.client.from("budget_entries").delete().eq("id", entryId);

    if (error) {
      throw formatSupabaseError({
        operation: "deleteBudgetEntry",
        identifiers: { entryId },
        error,
      });
    }
  }

  static mapEntries(rows: BudgetEntryRow[]): Entry[] {
    return rows.map((row) => {
      const rawCategory = row.category ?? "";
      const category = isCategoryKey(rawCategory) ? rawCategory : "transport";
      return {
        id: row.id,
        description: row.description ?? "",
        category,
        amount: row.amount ?? 0,
      };
    });
  }
}

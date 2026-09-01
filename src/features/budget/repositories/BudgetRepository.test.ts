import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTableMock, SUPABASE_ERRORS } from "@tests/utils/mocks";
import { describe, expect, it } from "vitest";

import type { Database } from "@/supabase/types";

import { BudgetRepository } from "./BudgetRepository";

function makeRepo(client: SupabaseClient<Database>): BudgetRepository {
  return new BudgetRepository(client);
}

describe("BudgetRepository", () => {
  describe("mapEntries", () => {
    it("maps rows to Entry objects with valid categories", () => {
      const rows = [
        { id: "e1", description: "Hotel", category: "lodging", amount: 200 },
        { id: "e2", description: "Train", category: "transport", amount: 100 },
      ];

      const result = BudgetRepository.mapEntries(rows);

      expect(result).toEqual([
        { id: "e1", description: "Hotel", category: "lodging", amount: 200 },
        { id: "e2", description: "Train", category: "transport", amount: 100 },
      ]);
    });

    it("defaults invalid category to transport", () => {
      const rows = [{ id: "e1", description: "Unknown", category: "invalid", amount: 50 }];

      const result = BudgetRepository.mapEntries(rows);

      expect(result[0].category).toBe("transport");
    });

    it("handles null category", () => {
      const rows = [{ id: "e1", description: "Test", category: null, amount: 50 }];

      const result = BudgetRepository.mapEntries(rows);

      expect(result[0].category).toBe("transport");
    });

    it("handles empty array input", () => {
      const rows: Array<{
        id: string;
        description: string | null;
        category: string | null;
        amount: number | null;
      }> = [];

      const result = BudgetRepository.mapEntries(rows);

      expect(result).toEqual([]);
    });

    it("handles undefined category", () => {
      const rows = [{ id: "e1", description: "Test", category: undefined as unknown as string, amount: 50 }];

      const result = BudgetRepository.mapEntries(rows);

      expect(result[0].category).toBe("transport");
    });

    it("handles empty string category", () => {
      const rows = [{ id: "e1", description: "Test", category: "", amount: 50 }];

      const result = BudgetRepository.mapEntries(rows);

      expect(result[0].category).toBe("transport");
    });
  });

  describe("fetchPlanBudgetRow", () => {
    it("fetches budget row successfully", async () => {
      const mockData = { budget: 1000 };
      const { supabase, chain } = buildTableMock("plans", { data: mockData, error: null });

      const result = await makeRepo(supabase).fetchPlanBudgetRow("plan-1");

      expect(result).toEqual(mockData);
      expect(chain.select).toHaveBeenCalledWith("budget");
      expect(chain.eq).toHaveBeenCalledWith("id", "plan-1");
      expect(chain.single).toHaveBeenCalled();
    });

    it("throws error when database error occurs", async () => {
      const { supabase, chain } = buildTableMock("plans", { data: null, error: SUPABASE_ERRORS.NOT_FOUND });
      chain.single.mockResolvedValue({ data: null, error: SUPABASE_ERRORS.NOT_FOUND });

      await expect(makeRepo(supabase).fetchPlanBudgetRow("plan-1")).rejects.toThrow("fetchPlanBudgetRow");
    });

    it("returns null when no data found", async () => {
      const { supabase } = buildTableMock("plans", { data: null, error: null });

      const result = await makeRepo(supabase).fetchPlanBudgetRow("plan-1");

      expect(result).toBeNull();
    });
  });

  describe("fetchPlanBudgetEntries", () => {
    it("fetches budget entries successfully", async () => {
      const mockData = [
        { id: "e1", description: "Hotel", category: "lodging", amount: 200 },
        { id: "e2", description: "Food", category: "food", amount: 100 },
      ];
      const { supabase, chain } = buildTableMock("budget_entries", { data: mockData, error: null });

      const result = await makeRepo(supabase).fetchPlanBudgetEntries("plan-1");

      expect(result).toEqual(mockData);
      expect(chain.select).toHaveBeenCalledWith("id, description, category, amount");
      expect(chain.eq).toHaveBeenCalledWith("plan_id", "plan-1");
    });

    it("throws error when database error occurs", async () => {
      const { supabase } = buildTableMock("budget_entries", { data: null, error: SUPABASE_ERRORS.NOT_FOUND });

      await expect(makeRepo(supabase).fetchPlanBudgetEntries("plan-1")).rejects.toThrow(
        "fetchPlanBudgetEntries"
      );
    });

    it("returns empty array when no entries found", async () => {
      const { supabase } = buildTableMock("budget_entries", { data: null, error: null });

      const result = await makeRepo(supabase).fetchPlanBudgetEntries("plan-1");

      expect(result).toEqual([]);
    });
  });

  describe("updatePlanBudget", () => {
    it("updates budget successfully", async () => {
      const mockData = { budget: 1500 };
      const { supabase, chain } = buildTableMock("plans", { data: mockData, error: null });

      const result = await makeRepo(supabase).updatePlanBudget("plan-1", 1500);

      expect(result).toEqual(mockData);
      expect(chain.update).toHaveBeenCalledWith({ budget: 1500 });
      expect(chain.eq).toHaveBeenCalledWith("id", "plan-1");
      expect(chain.select).toHaveBeenCalledWith("budget");
      expect(chain.single).toHaveBeenCalled();
    });

    it("throws error when update fails", async () => {
      const { supabase } = buildTableMock("plans", { data: null, error: SUPABASE_ERRORS.FORBIDDEN });

      await expect(makeRepo(supabase).updatePlanBudget("plan-1", 1500)).rejects.toThrow("updatePlanBudget");
    });
  });

  describe("createBudgetEntry", () => {
    it("creates budget entry successfully", async () => {
      const mockData = { id: "new-entry-id" };
      const payload = { description: "New Entry", category: "food", amount: 100 };
      const { supabase, chain } = buildTableMock("budget_entries", { data: mockData, error: null });

      const result = await makeRepo(supabase).createBudgetEntry("plan-1", payload);

      expect(result).toEqual(mockData);
      expect(chain.insert).toHaveBeenCalledWith({
        plan_id: "plan-1",
        description: "New Entry",
        category: "food",
        amount: 100,
      });
      expect(chain.select).toHaveBeenCalledWith("id");
      expect(chain.single).toHaveBeenCalled();
    });

    it("throws error when insert fails", async () => {
      const payload = { description: "New Entry", category: "food", amount: 100 };
      const { supabase } = buildTableMock("budget_entries", { data: null, error: SUPABASE_ERRORS.CONFLICT });

      await expect(makeRepo(supabase).createBudgetEntry("plan-1", payload)).rejects.toThrow(
        "createBudgetEntry"
      );
    });

    it("throws error when no data returned", async () => {
      const payload = { description: "New Entry", category: "food", amount: 100 };
      const { supabase } = buildTableMock("budget_entries", { data: null, error: null });

      await expect(makeRepo(supabase).createBudgetEntry("plan-1", payload)).rejects.toThrow(
        "createBudgetEntry:missing-row"
      );
    });
  });

  describe("updateBudgetEntry", () => {
    it("updates budget entry successfully", async () => {
      const payload = { description: "Updated Entry", category: "transport", amount: 200 };
      const { supabase, chain } = buildTableMock("budget_entries", { data: null, error: null });

      await expect(makeRepo(supabase).updateBudgetEntry("entry-1", payload)).resolves.toBeUndefined();

      expect(chain.update).toHaveBeenCalledWith({
        description: "Updated Entry",
        category: "transport",
        amount: 200,
      });
      expect(chain.eq).toHaveBeenCalledWith("id", "entry-1");
    });

    it("throws error when update fails", async () => {
      const payload = { description: "Updated Entry", category: "transport", amount: 200 };
      const { supabase } = buildTableMock("budget_entries", { data: null, error: SUPABASE_ERRORS.FORBIDDEN });

      await expect(makeRepo(supabase).updateBudgetEntry("entry-1", payload)).rejects.toThrow(
        "updateBudgetEntry"
      );
    });
  });

  describe("deleteBudgetEntry", () => {
    it("deletes budget entry successfully", async () => {
      const { supabase, chain } = buildTableMock("budget_entries", { data: null, error: null });

      await expect(makeRepo(supabase).deleteBudgetEntry("entry-1")).resolves.toBeUndefined();

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "entry-1");
    });

    it("throws error when delete fails", async () => {
      const { supabase } = buildTableMock("budget_entries", { data: null, error: SUPABASE_ERRORS.FORBIDDEN });

      await expect(makeRepo(supabase).deleteBudgetEntry("entry-1")).rejects.toThrow("deleteBudgetEntry");
    });
  });
});

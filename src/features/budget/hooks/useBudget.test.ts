import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Entry } from "../types";
import { BudgetProvider, useBudgetContext } from "./BudgetContext";
import { useBudget } from "./useBudget";

const trpcMocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue("new-entry"),
  setData: vi.fn(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: {
    budget: {
      createEntry: { useMutation: () => ({ mutateAsync: trpcMocks.mutateAsync }) },
      deleteEntry: { useMutation: () => ({ mutateAsync: trpcMocks.mutateAsync }) },
      get: { useQuery: () => ({ data: null, isSuccess: true }) },
      updateEntry: { useMutation: () => ({ mutateAsync: trpcMocks.mutateAsync }) },
      updatePlan: { useMutation: () => ({ mutate: trpcMocks.mutate }) },
    },
    useUtils: () => ({
      budget: { get: { invalidate: trpcMocks.invalidate, setData: trpcMocks.setData } },
    }),
  },
}));

describe("BudgetContext", () => {
  it("is exported as a function (useBudgetContext)", () => {
    expect(typeof useBudgetContext).toBe("function");
  });

  it("BudgetProvider is exported", () => {
    expect(typeof BudgetProvider).toBe("function");
  });
});

describe("useBudget hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is exported as a function", () => {
    expect(typeof useBudget).toBe("function");
  });

  it("returns expected properties", () => {
    const { result } = renderHook(() => useBudget("plan-1", 100, {}));

    const { current } = result;

    expect(current.budget).toBe(0);
    expect(current.entries).toEqual([]);
    expect(current.categoryTotals).toBeDefined();
    expect(typeof current.categoryTotals).toBe("object");
    expect(current.categoryTotals).not.toBeNull();
    expect(typeof current.totalSpent).toBe("number");
    expect(typeof current.difference).toBe("number");
    expect(current.desc).toBe("");
    expect(current.cat).toBe("transport");
    expect(current.amount).toBe(0);

    expect(typeof current.setBudget).toBe("function");
    expect(typeof current.setDesc).toBe("function");
    expect(typeof current.setCat).toBe("function");
    expect(typeof current.setAmount).toBe("function");

    expect(typeof current.handleAdd).toBe("function");
    expect(typeof current.handleUpdateEntry).toBe("function");
    expect(typeof current.handleDeleteEntry).toBe("function");
  });

  it("handles initial values", () => {
    const initialEntries: Entry[] = [{ id: "e1", description: "Hotel", category: "lodging", amount: 200 }];

    const { result } = renderHook(() => useBudget("plan-1", 1000, { initialBudget: 500, initialEntries }));

    expect(result.current.budget).toBe(500);
    expect(result.current.entries).toHaveLength(1);
  });

  it("calculates category totals correctly", () => {
    const initialEntries: Entry[] = [
      { id: "e1", description: "Hotel", category: "lodging", amount: 200 },
      { id: "e2", description: "Food", category: "food", amount: 150 },
      { id: "e3", description: "Transport", category: "transport", amount: 100 },
    ];

    const { result } = renderHook(() => useBudget("plan-1", 500, { initialEntries, initialBudget: 500 }));

    expect(result.current.categoryTotals.lodging).toBe(200);
    expect(result.current.categoryTotals.food).toBe(150);
    expect(result.current.categoryTotals.transport).toBe(100);
    expect(result.current.categoryTotals.activities).toBe(500); // activitiesTotal parameter
    expect(result.current.categoryTotals.activities).toBe(500); // activitiesTotal parameter

    expect(result.current.totalSpent).toBe(950); // 200 + 150 + 100 + 500(activities)

    expect(result.current.totalSpent).toBe(950); // 200 + 150 + 100 + 500(activities)
    expect(result.current.difference).toBe(-450); // 500 - 950
  });

  it("updates budget state locally", () => {
    const { result } = renderHook(() => useBudget("plan-1", 0, {}));

    act(() => {
      result.current.setBudget(1500);
    });

    expect(result.current.budget).toBe(1500);
  });

  it("adds entry locally when persist is disabled", async () => {
    const { result } = renderHook(() => useBudget("plan-1", 0, {}));

    act(() => {
      result.current.setDesc("New Entry");
      result.current.setAmount(100);
      result.current.setCat("food");
    });

    await act(async () => {
      await result.current.handleAdd();
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].description).toBe("New Entry");
    expect(result.current.entries[0].amount).toBe(100);
    expect(result.current.entries[0].category).toBe("food");
  });

  it("does not add entry when editing is disabled", async () => {
    const { result } = renderHook(() => useBudget("plan-1", 0, { canEdit: false }));

    act(() => {
      result.current.setDesc("New Entry");
      result.current.setAmount(100);
    });

    await act(async () => {
      await result.current.handleAdd();
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it("deletes entry locally when persist is disabled", async () => {
    const initialEntries: Entry[] = [
      { id: "e1", description: "Test", category: "food", amount: 100 },
      { id: "e2", description: "Test 2", category: "transport", amount: 200 },
    ];

    const { result } = renderHook(() => useBudget("plan-1", 0, { initialEntries }));

    await act(async () => {
      await result.current.handleDeleteEntry(0);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].id).toBe("e2");
  });

  it("updates form state correctly", () => {
    const { result } = renderHook(() => useBudget("plan-1", 0, {}));

    act(() => {
      result.current.setDesc("Test Description");
      result.current.setAmount(250);
      result.current.setCat("lodging");
    });

    expect(result.current.desc).toBe("Test Description");
    expect(result.current.amount).toBe(250);
    expect(result.current.cat).toBe("lodging");
  });
});

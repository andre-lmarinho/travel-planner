import { createMockSupabaseClient } from "@tests/utils/mocks";
import { describe, expect, it } from "vitest";

import { createTRPCInnerContext } from "../createContext";
import { createCallerFactory } from "../trpc";
import { appRouter } from "./_app";

const USER_ID = "00000000-0000-4000-8000-000000000001";

function createCaller() {
  return createCallerFactory(appRouter)(
    createTRPCInnerContext({
      viewer: { email: "user@example.com", id: USER_ID },
      requestMeta: { ip: null, requestId: "test", userAgent: null },
      supabase: createMockSupabaseClient({
        fromData: {
          budget_entries: [{ amount: 120, category: "food", description: "Lunch", id: "entry-1" }],
          plans: { id: "plan-1", user_id: USER_ID, budget: 500 },
          profiles: { avatar_url: null, display_name: "Ada", id: USER_ID, slug: "ada" },
        },
      }),
    })
  );
}

describe("appRouter", () => {
  it("returns the authenticated landing route after leaving a plan", async () => {
    await expect(createCaller().viewer.members.leave({ planIdOrSlug: "plan-1" })).resolves.toBe("/");
  });
  it("reads the viewer profile through ProfileService and ProfileRepository", async () => {
    await expect(createCaller().viewer.profile.get({})).resolves.toMatchObject({
      slug: "ada",
      userId: USER_ID,
    });
  });

  it("reads the plan budget through BudgetService and BudgetRepository", async () => {
    await expect(createCaller().viewer.budget.get({ planId: "plan-1" })).resolves.toEqual({
      budget: 500,
      entries: [{ amount: 120, category: "food", description: "Lunch", id: "entry-1" }],
    });
  });

  it("converts a budget validation failure into a BAD_REQUEST transport error", async () => {
    await expect(
      createCaller().viewer.budget.updatePlan({ budget: -1, planId: "plan-1" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Budget cannot be negative",
    });
  });
});

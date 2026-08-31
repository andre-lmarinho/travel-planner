import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserPlannerSummary } from "@/features/plan/lib/getUserPlanners";
import { getUpcomingPlan } from "./UpcomingTripSection";

const plan: UserPlannerSummary = {
  id: "plan-1",
  title: "Lisbon escape",
  destination: "Lisbon",
  startDate: "2026-09-05",
  endDate: "2026-09-09",
  updatedAt: null,
  publicSlug: "lisbon-escape",
  coverImage: null,
};

describe("getUpcomingPlan", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the closest future plan", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00"));

    const upcomingPlan = getUpcomingPlan([
      { ...plan, id: "past", startDate: "2026-08-31" },
      { ...plan, id: "later", startDate: "2026-10-01" },
      plan,
    ]);

    expect(upcomingPlan?.id).toBe(plan.id);
    expect(
      getUpcomingPlan([
        { ...plan, id: "past", startDate: "2026-08-31" },
        { ...plan, id: "undated", startDate: null },
      ])
    ).toBeNull();
  });
});

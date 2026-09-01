import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser } from "@/shared/lib/auth/session";

import {
  fetchPlanByIdWithMembers,
  fetchPlanBySlug,
  fetchPublicPlanById,
  fetchPublicPlanBySlug,
} from "../repositories/PlanRepository";
import { getPlannerExperience } from "./getPlannerExperience";

vi.mock("@/shared/lib/auth/session", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib/auth/session")>("@/shared/lib/auth/session");
  return { ...actual, getCurrentUser: vi.fn() };
});
vi.mock("../repositories/PlanRepository", () => ({
  fetchPlanByIdWithMembers: vi.fn(),
  fetchPlanBySlug: vi.fn(),
  fetchPublicPlanById: vi.fn(),
  fetchPublicPlanBySlug: vi.fn(),
  fetchLatestSnapshot: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/features/budget/repositories/BudgetRepository", () => ({
  fetchPlanBudgetEntries: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/features/profile/repositories/ProfileRepository", () => ({
  fetchProfileByUserId: vi
    .fn()
    .mockResolvedValue({ userId: "owner-1", slug: "owner", displayName: "Owner", avatarUrl: null }),
}));

const SLUG = "abc123slug";
const UUID = "11111111-2222-4333-8444-555555555555";

// Private plan whose only member is the owner.
const PLAN = {
  id: "plan-1",
  ownerId: "owner-1",
  members: [{ userId: "owner-1", tier: "admin" }],
  destinationName: "Rome",
  title: "Trip",
  budget: null,
  startDate: null,
  endDate: null,
  isPublic: false,
} as unknown as Awaited<ReturnType<typeof fetchPlanBySlug>>;

// Same plan, published, with no membership for the viewer.
const PUBLIC_PLAN = { ...(PLAN as object), members: [], isPublic: true } as unknown as typeof PLAN;

describe("getPlannerExperience — membership-only access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws UNAUTHORIZED for an anonymous visitor and never fetches the plan", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);

    await expect(getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(fetchPlanBySlug).not.toHaveBeenCalled();
    expect(fetchPublicPlanBySlug).not.toHaveBeenCalled();
  });

  it("grants a member edit access via slug", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "owner-1" });
    vi.mocked(fetchPlanBySlug).mockResolvedValueOnce(PLAN);

    const result = await getPlannerExperience({ identifier: SLUG });

    expect(result).toMatchObject({ planId: "plan-1", slug: SLUG, isOwner: true, canEdit: true });
    expect(fetchPlanByIdWithMembers).not.toHaveBeenCalled();
  });

  it("grants a member edit access via UUID id", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "owner-1" });
    vi.mocked(fetchPlanByIdWithMembers).mockResolvedValueOnce(PLAN);

    const result = await getPlannerExperience({ identifier: UUID });

    expect(result).toMatchObject({ planId: "plan-1", slug: undefined, isOwner: true, canEdit: true });
    expect(fetchPlanBySlug).not.toHaveBeenCalled();
    expect(fetchPublicPlanById).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the resolved plan does not exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "owner-1" });
    vi.mocked(fetchPlanBySlug).mockResolvedValueOnce(null);

    await expect(getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws FORBIDDEN for a logged-in non-member even on a public plan", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "stranger" });
    vi.mocked(fetchPlanBySlug).mockResolvedValueOnce(PUBLIC_PLAN);

    await expect(getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN for a logged-in non-member on a private plan", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "stranger" });
    vi.mocked(fetchPlanByIdWithMembers).mockResolvedValueOnce(PLAN);

    await expect(getPlannerExperience({ identifier: UUID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("falls back to undefined days when the plan date range is reversed", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "owner-1" });
    vi.mocked(fetchPlanBySlug).mockResolvedValueOnce({
      ...(PLAN as object),
      startDate: "2026-07-20",
      endDate: "2026-07-10",
    } as unknown as typeof PLAN);

    const result = await getPlannerExperience({ identifier: SLUG });

    expect(result.initialDays).toBeUndefined();
  });
});

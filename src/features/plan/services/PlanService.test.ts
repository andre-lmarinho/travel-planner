import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import type { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { fetchGeoapifyPlaceDetails } from "@/features/search/services/GeoapifyService";
import { fetchWikidataImage } from "@/features/search/services/WikidataService";
import { getCurrentUser, requireUser } from "@/shared/lib/auth/session";
import type { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "./PlanService";

const { fetchProfileSlugByUserId } = vi.hoisted(() => ({ fetchProfileSlugByUserId: vi.fn() }));

vi.mock("@/shared/lib/auth/session", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib/auth/session")>("@/shared/lib/auth/session");
  return { ...actual, getCurrentUser: vi.fn(), requireUser: vi.fn() };
});
vi.mock("@/features/search/services/GeoapifyService", () => ({
  fetchGeoapifyPlaceDetails: vi.fn(),
}));
vi.mock("@/features/search/services/WikidataService", () => ({
  fetchWikidataImage: vi.fn(),
}));

const SLUG = "abc123slug";

// Private plan where the only member is the owner.
const OWNED_PLAN = {
  id: "plan-1",
  ownerId: "owner-1",
  members: [{ userId: "owner-1", tier: "admin" }],
  destinationName: "Rome",
  title: "Trip",
  budget: null,
  startDate: null,
  endDate: null,
  isPublic: false,
};

function makeService(repo: Partial<PlanRepository>) {
  const budgetRepo = {
    fetchPlanBudgetEntries: vi.fn().mockResolvedValue([]),
  } as unknown as BudgetRepository;
  const profileRepo = { fetchProfileSlugByUserId } as unknown as ProfileRepository;
  return new PlanService(repo as PlanRepository, budgetRepo, profileRepo);
}

describe("PlanService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(requireUser).mockResolvedValue({ id: "owner-1" });
    vi.mocked(fetchProfileSlugByUserId).mockResolvedValue(null);
  });

  describe("getPlannerExperience — membership-only access", () => {
    it("throws UNAUTHORIZED for an anonymous visitor", async () => {
      const service = makeService({
        fetchPlanByIdWithMembers: vi.fn(),
        fetchPlanBySlug: vi.fn(),
      });

      await expect(service.getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("throws NOT_FOUND when the plan does not exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "owner-1" });
      const service = makeService({
        fetchPlanBySlug: vi.fn().mockResolvedValue(null),
      });

      await expect(service.getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("throws FORBIDDEN for a non-member", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "stranger" });
      const service = makeService({
        fetchPlanBySlug: vi.fn().mockResolvedValue({ ...OWNED_PLAN, members: [], isPublic: true }),
      });

      await expect(service.getPlannerExperience({ identifier: SLUG })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("deletePlan", () => {
    it("throws BAD_REQUEST for an empty id", async () => {
      const service = makeService({});
      await expect(service.deletePlan("   ")).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("throws NOT_FOUND when the plan does not exist", async () => {
      const service = makeService({
        fetchPlanByIdWithMembers: vi.fn().mockResolvedValue(null),
      });

      await expect(service.deletePlan("plan-1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws FORBIDDEN for a non-owner", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "other" });
      const service = makeService({
        fetchPlanByIdWithMembers: vi.fn().mockResolvedValue(OWNED_PLAN),
      });

      await expect(service.deletePlan("plan-1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("deletes the plan and resolves a redirect to the user's public page", async () => {
      vi.mocked(requireUser).mockResolvedValue({ id: "owner-1" });
      vi.mocked(fetchProfileSlugByUserId).mockResolvedValue("owner-slug");
      const deleteFn = vi.fn().mockResolvedValue(undefined);
      const service = makeService({
        fetchPlanByIdWithMembers: vi.fn().mockResolvedValue(OWNED_PLAN),
        delete: deleteFn,
      });

      await expect(service.deletePlan("plan-1")).resolves.toBe("/u/owner-slug");

      expect(deleteFn).toHaveBeenCalledWith("plan-1");
    });
  });

  describe("member mutations", () => {
    it.each([
      ["updatePlanTitle", (s: PlanService) => s.updatePlanTitle("plan-1", "New")],
      [
        "updatePlanDates",
        (s: PlanService) => s.updatePlanDates("plan-1", new Date("2024-01-10"), new Date("2024-01-15")),
      ],
      ["setPlanVisibility", (s: PlanService) => s.setPlanVisibility("plan-1", true)],
    ])("throws UNAUTHORIZED for an anonymous %s caller without hitting the repo", async (_name, call) => {
      const service = makeService({});
      await expect(call(service)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("setPlanVisibility", () => {
    it("throws FORBIDDEN for a non-member on a private plan", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ id: "stranger" });
      const service = makeService({
        fetchPlanByIdWithMembers: vi.fn().mockResolvedValue({ ...OWNED_PLAN, members: [] }),
      });

      await expect(service.setPlanVisibility("plan-1", true)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("createUserPlan", () => {
    it("requires a user and delegates to the repo, returning formatted output", async () => {
      const service = makeService({
        createPlan: vi.fn().mockResolvedValue({ id: "plan-123", publicSlug: "slug-123" }),
        setPlanVisibility: vi.fn().mockResolvedValue(undefined),
        updatePlanCoverImage: vi.fn().mockResolvedValue(undefined),
      });

      const result = await service.createUserPlan({
        title: "Paris trip",
        destination: { name: "Paris", country: "FR" },
        startDate: "2024-01-10T00:00:00Z",
        endDate: "2024-01-15T00:00:00Z",
      });

      expect(result).toEqual({ planId: "plan-123", publicSlug: "slug-123" });
    });

    it("publishes the plan when isPublic is true", async () => {
      const setVisibility = vi.fn().mockResolvedValue(undefined);
      const service = makeService({
        createPlan: vi.fn().mockResolvedValue({ id: "plan-123", publicSlug: "slug-123" }),
        setPlanVisibility: setVisibility,
        updatePlanCoverImage: vi.fn().mockResolvedValue(undefined),
      });

      await service.createUserPlan({
        title: "Paris trip",
        destination: { name: "Paris" },
        startDate: "2024-01-10T00:00:00Z",
        endDate: "2024-01-15T00:00:00Z",
        isPublic: true,
      });

      expect(setVisibility).toHaveBeenCalledWith("plan-123", true);
    });

    it("updates cover image in the background when placeId is provided", async () => {
      vi.mocked(fetchGeoapifyPlaceDetails).mockResolvedValue({
        placeId: "place-123",
        name: "Paris",
        formatted: "Paris, France",
        latitude: 48.85,
        longitude: 2.35,
        wikidataId: "Q90",
        categories: [],
      });
      vi.mocked(fetchWikidataImage).mockResolvedValue("https://wikimedia.org/image.jpg");
      const updateCover = vi.fn().mockResolvedValue(undefined);

      const service = makeService({
        createPlan: vi.fn().mockResolvedValue({ id: "plan-123", publicSlug: "slug-123" }),
        updatePlanCoverImage: updateCover,
      });

      await service.createUserPlan({
        title: "Paris trip",
        destination: { name: "Paris", placeId: "place-123" },
        startDate: "2024-01-10T00:00:00Z",
        endDate: "2024-01-15T00:00:00Z",
      });

      await vi.waitFor(
        () => {
          expect(updateCover).toHaveBeenCalledWith("plan-123", "https://wikimedia.org/image.jpg");
        },
        { timeout: 1000 }
      );
    });
  });
});

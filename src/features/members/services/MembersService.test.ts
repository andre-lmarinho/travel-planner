import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import type { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import type { ProfileSummary } from "@/features/profile/types";

import type { MembersRepository } from "../repositories/MembersRepository";
import type { ShareMember, ShareMembersData } from "../types";
import { MembersService } from "./MembersService";

const planRepositoryMocks = vi.hoisted(() => ({
  fetchPlanIdentityById: vi.fn(),
  fetchPlanIdentityBySlug: vi.fn(),
}));

const profileRepositoryMocks = vi.hoisted(() => ({
  fetchProfileByUserId: vi.fn(),
}));

function makeService(
  partialRepo: Partial<MembersRepository>,
  partialPlanRepo: Partial<PlanRepository> = {},
  partialProfileRepo: Partial<ProfileRepository> = {}
) {
  return new MembersService(
    partialRepo as MembersRepository,
    {
      fetchPlanIdentityById: planRepositoryMocks.fetchPlanIdentityById,
      fetchPlanIdentityBySlug: planRepositoryMocks.fetchPlanIdentityBySlug,
      ...partialPlanRepo,
    } as PlanRepository,
    {
      fetchProfileByUserId: profileRepositoryMocks.fetchProfileByUserId,
      ...partialProfileRepo,
    } as ProfileRepository
  );
}

describe("MembersService", () => {
  beforeEach(() => {
    planRepositoryMocks.fetchPlanIdentityById.mockReset();
    planRepositoryMocks.fetchPlanIdentityBySlug.mockReset();
    profileRepositoryMocks.fetchProfileByUserId.mockReset();
  });

  it.each([
    ["getMembers", (s: MembersService) => s.getMembers("plan-1"), "getMembers: plan not found"],
    [
      "addMember",
      (s: MembersService) => s.addMember("plan-1", "user@example.com", "member"),
      "addMember: plan not found",
    ],
    [
      "updateMemberTier",
      (s: MembersService) => s.updateMemberTier("plan-1", "user-1", "member"),
      "updateMemberTier: plan not found",
    ],
    [
      "removeMember",
      (s: MembersService) => s.removeMember("plan-1", "user-1"),
      "removeMember: plan not found",
    ],
    ["leavePlan", (s: MembersService) => s.leavePlan("plan-1"), "leavePlan: plan not found"],
  ])(
    "throws NOT_FOUND when %s cannot resolve the plan",
    async (_label: string, call: (service: MembersService) => Promise<unknown>, message: string) => {
      planRepositoryMocks.fetchPlanIdentityBySlug.mockResolvedValue(null);
      const service = makeService({});

      await expect(call(service)).rejects.toMatchObject({ code: "NOT_FOUND", message });
    }
  );

  it("adds the owner to the members list when missing", async () => {
    const members: ShareMember[] = [
      {
        userId: "user-2",
        tier: "member",
        slug: "member-slug",
        displayName: "Member",
        avatarUrl: null,
      },
    ];
    planRepositoryMocks.fetchPlanIdentityBySlug.mockResolvedValue({ id: "plan-1", ownerId: "owner-1" });
    profileRepositoryMocks.fetchProfileByUserId.mockResolvedValue({
      userId: "owner-1",
      slug: "owner-slug",
      displayName: "Owner",
      avatarUrl: null,
    } satisfies ProfileSummary);

    const service = makeService({
      fetchMembers: vi.fn().mockResolvedValue(members),
    });

    const result = await service.getMembers("plan-1");

    expect(result.ownerId).toBe("owner-1");
    expect(result.members[0]).toMatchObject({
      userId: "owner-1",
      tier: "admin",
      slug: "owner-slug",
      displayName: "Owner",
    });
    expect(result.members).toHaveLength(2);
  });

  it("resolves by id (UUID) instead of slug when the input is a UUID", async () => {
    const planId = "123e4567-e89b-42d3-a456-426614174000";
    planRepositoryMocks.fetchPlanIdentityById.mockResolvedValue({ id: planId, ownerId: "owner-1" });
    planRepositoryMocks.fetchPlanIdentityBySlug.mockResolvedValue({ id: "wrong-plan", ownerId: "owner-1" });

    const service = makeService({
      fetchMembers: vi.fn().mockResolvedValue([]),
    });

    const result = await service.getMembers(planId);

    expect(planRepositoryMocks.fetchPlanIdentityById).toHaveBeenCalledWith(planId);
    expect(planRepositoryMocks.fetchPlanIdentityBySlug).not.toHaveBeenCalled();
    expect(result.ownerId).toBe("owner-1");
  });

  it("falls back to the first admin when the owner is missing", async () => {
    const members: ShareMember[] = [
      {
        userId: "admin-1",
        tier: "admin",
        slug: "admin-slug",
        displayName: "Admin",
        avatarUrl: null,
      },
      {
        userId: "user-2",
        tier: "member",
        slug: "member-slug",
        displayName: "Member",
        avatarUrl: null,
      },
    ];
    planRepositoryMocks.fetchPlanIdentityBySlug.mockResolvedValue({ id: "plan-1", ownerId: null });

    const service = makeService({
      fetchMembers: vi.fn().mockResolvedValue(members),
    });

    const result: ShareMembersData = await service.getMembers("plan-1");

    expect(result.ownerId).toBe("admin-1");
    expect(result.members.map((member) => member.userId)).toEqual(["admin-1", "user-2"]);
    expect(profileRepositoryMocks.fetchProfileByUserId).not.toHaveBeenCalled();
  });
});

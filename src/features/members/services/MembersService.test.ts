import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShareMember, ShareMembersData } from "../types";
import { addMember, getMembers, leavePlan, removeMember, updateMemberTier } from "./MembersService";

const { mockCreateSupabaseServerClient } = vi.hoisted(() => ({
  mockCreateSupabaseServerClient: vi.fn(),
}));

const planRepositoryMocks = vi.hoisted(() => ({
  resolvePlanIdentity: vi.fn(),
}));

const profileRepositoryMocks = vi.hoisted(() => ({
  fetchProfileByUserId: vi.fn(),
}));

const membersRepositoryMocks = vi.hoisted(() => ({
  fetchMembers: vi.fn(),
  addMemberByEmail: vi.fn(),
  updateMemberTier: vi.fn(),
  removeMember: vi.fn(),
  leavePlan: vi.fn(),
}));

vi.mock("@/shared/lib/supabaseServer", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/features/plan/repositories/PlanRepository", () => ({
  __esModule: true,
  resolvePlanIdentity: (...args: unknown[]) => planRepositoryMocks.resolvePlanIdentity(...args),
}));

vi.mock("@/features/profile/repositories/ProfileRepository", () => ({
  __esModule: true,
  fetchProfileByUserId: (...args: unknown[]) => profileRepositoryMocks.fetchProfileByUserId(...args),
}));

vi.mock("../repositories/MembersRepository", () => ({
  __esModule: true,
  fetchMembers: membersRepositoryMocks.fetchMembers,
  addMemberByEmail: membersRepositoryMocks.addMemberByEmail,
  updateMemberTier: membersRepositoryMocks.updateMemberTier,
  removeMember: membersRepositoryMocks.removeMember,
  leavePlan: membersRepositoryMocks.leavePlan,
}));

describe("MembersService", () => {
  const client = { id: "client-1" };

  beforeEach(() => {
    mockCreateSupabaseServerClient.mockReset();
    planRepositoryMocks.resolvePlanIdentity.mockReset();
    profileRepositoryMocks.fetchProfileByUserId.mockReset();
    membersRepositoryMocks.fetchMembers.mockReset();
    membersRepositoryMocks.addMemberByEmail.mockReset();
    membersRepositoryMocks.updateMemberTier.mockReset();
    membersRepositoryMocks.removeMember.mockReset();
    membersRepositoryMocks.leavePlan.mockReset();
    mockCreateSupabaseServerClient.mockReturnValue(client);
  });

  it.each([
    ["getMembers", () => getMembers("plan-1"), "getMembers: plan not found"],
    ["addMember", () => addMember("plan-1", "user@example.com", "member"), "addMember: plan not found"],
    [
      "updateMemberTier",
      () => updateMemberTier("plan-1", "user-1", "member"),
      "updateMemberTier: plan not found",
    ],
    ["removeMember", () => removeMember("plan-1", "user-1"), "removeMember: plan not found"],
    ["leavePlan", () => leavePlan("plan-1"), "leavePlan: plan not found"],
  ])(
    "throws NOT_FOUND when %s cannot resolve the plan",
    async (_label: string, call: () => Promise<unknown>, message: string) => {
      planRepositoryMocks.resolvePlanIdentity.mockResolvedValue(null);

      await expect(call()).rejects.toMatchObject({ code: "NOT_FOUND", message });
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
    planRepositoryMocks.resolvePlanIdentity.mockResolvedValue({ id: "plan-1", ownerId: "owner-1" });
    membersRepositoryMocks.fetchMembers.mockResolvedValue(members);
    profileRepositoryMocks.fetchProfileByUserId.mockResolvedValue({
      userId: "owner-1",
      slug: "owner-slug",
      displayName: "Owner",
      avatarUrl: null,
    });

    const result = await getMembers("plan-1");

    expect(result.ownerId).toBe("owner-1");
    expect(result.members[0]).toMatchObject({
      userId: "owner-1",
      tier: "admin",
      slug: "owner-slug",
      displayName: "Owner",
    });
    expect(result.members).toHaveLength(2);
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
    planRepositoryMocks.resolvePlanIdentity.mockResolvedValue({ id: "plan-1", ownerId: null });
    membersRepositoryMocks.fetchMembers.mockResolvedValue(members);

    const result: ShareMembersData = await getMembers("plan-1");

    expect(result.ownerId).toBe("admin-1");
    expect(result.members.map((member) => member.userId)).toEqual(["admin-1", "user-2"]);
    expect(profileRepositoryMocks.fetchProfileByUserId).not.toHaveBeenCalled();
  });
});

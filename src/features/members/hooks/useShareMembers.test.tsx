import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShareMembersData } from "../types";
import { useShareMembers } from "./useShareMembers";

const shareServiceMocks = vi.hoisted(() => ({
  getMembers: vi.fn(),
  addMember: vi.fn(),
  updateMemberTier: vi.fn(),
  removeMember: vi.fn(),
  leavePlan: vi.fn(),
}));

vi.mock("@/features/members/services/membersService.actions", () => ({
  __esModule: true,
  getMembers: shareServiceMocks.getMembers,
  addMember: shareServiceMocks.addMember,
  updateMemberTier: shareServiceMocks.updateMemberTier,
  removeMember: shareServiceMocks.removeMember,
  leavePlan: shareServiceMocks.leavePlan,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
};

const membersKey = (planId: string) => ["share", "members", planId];
describe("useShareMembers", () => {
  beforeEach(() => {
    shareServiceMocks.getMembers.mockReset();
    shareServiceMocks.addMember.mockReset();
    shareServiceMocks.updateMemberTier.mockReset();
    shareServiceMocks.removeMember.mockReset();
    shareServiceMocks.leavePlan.mockReset();
  });

  it("adds new members to the cache on success", async () => {
    const { wrapper, queryClient } = createWrapper();
    const planId = "plan-1";
    const initialData: ShareMembersData = {
      ownerId: "user-1",
      members: [
        {
          userId: "user-1",
          tier: "admin",
          slug: null,
          displayName: null,
          avatarUrl: null,
        },
      ],
    };
    queryClient.setQueryData(membersKey(planId), initialData);
    shareServiceMocks.addMember.mockResolvedValue({ userId: "user-2", tier: "member" });

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await result.current.addMember.mutateAsync({ email: "new@example.com", tier: "member" });
    });

    const updated = queryClient.getQueryData<ShareMembersData>(membersKey(planId));
    expect(updated?.members.map((member) => member.userId)).toEqual(["user-1", "user-2"]);
  });

  it("skips adding a duplicate member to the cache", async () => {
    const { wrapper, queryClient } = createWrapper();
    const planId = "plan-1";
    const initialData: ShareMembersData = {
      ownerId: "user-1",
      members: [
        {
          userId: "user-1",
          tier: "admin",
          slug: null,
          displayName: null,
          avatarUrl: null,
        },
      ],
    };
    queryClient.setQueryData(membersKey(planId), initialData);
    shareServiceMocks.addMember.mockResolvedValue({ userId: "user-1", tier: "admin" });

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await result.current.addMember.mutateAsync({ email: "owner@example.com", tier: "admin" });
    });

    const updated = queryClient.getQueryData<ShareMembersData>(membersKey(planId));
    expect(updated?.members).toHaveLength(1);
  });

  it("rolls back tier updates when the mutation fails", async () => {
    const { wrapper, queryClient } = createWrapper();
    const planId = "plan-1";
    const initialData: ShareMembersData = {
      ownerId: "user-1",
      members: [
        {
          userId: "user-2",
          tier: "member",
          slug: null,
          displayName: null,
          avatarUrl: null,
        },
      ],
    };
    queryClient.setQueryData(membersKey(planId), initialData);
    shareServiceMocks.updateMemberTier.mockRejectedValue(new Error("update failed"));

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await expect(
        result.current.updateTier.mutateAsync({ userId: "user-2", tier: "admin" })
      ).rejects.toThrow("update failed");
    });

    await waitFor(() => {
      const updated = queryClient.getQueryData<ShareMembersData>(membersKey(planId));
      expect(updated?.members[0]?.tier).toBe("member");
    });
  });

  it("rolls back removals when the mutation fails", async () => {
    const { wrapper, queryClient } = createWrapper();
    const planId = "plan-1";
    const initialData: ShareMembersData = {
      ownerId: "user-1",
      members: [
        {
          userId: "user-2",
          tier: "member",
          slug: null,
          displayName: null,
          avatarUrl: null,
        },
        {
          userId: "user-3",
          tier: "member",
          slug: null,
          displayName: null,
          avatarUrl: null,
        },
      ],
    };
    queryClient.setQueryData(membersKey(planId), initialData);
    shareServiceMocks.removeMember.mockRejectedValue(new Error("remove failed"));

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await expect(result.current.removeMember.mutateAsync({ userId: "user-2" })).rejects.toThrow(
        "remove failed"
      );
    });

    await waitFor(() => {
      const updated = queryClient.getQueryData<ShareMembersData>(membersKey(planId));
      expect(updated?.members.map((member) => member.userId)).toEqual(["user-2", "user-3"]);
    });
  });
});

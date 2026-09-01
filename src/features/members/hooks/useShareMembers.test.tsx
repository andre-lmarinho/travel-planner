import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShareMembersData } from "../types";
import { useShareMembers } from "./useShareMembers";

const trpcMocks = vi.hoisted(() => ({
  getMembers: vi.fn(),
  addMember: vi.fn(),
  updateMemberTier: vi.fn(),
  removeMember: vi.fn(),
  leavePlan: vi.fn(),
}));

vi.mock("@/trpc/react", async () => {
  const { useMutation, useQuery, useQueryClient } = await import("@tanstack/react-query");
  const key = (planIdOrSlug: string) => ["viewer", "members", "get", planIdOrSlug];

  return {
    trpc: {
      useUtils: () => {
        const queryClient = useQueryClient();
        return {
          viewer: {
            members: {
              get: {
                cancel: (input: { planIdOrSlug: string }) =>
                  queryClient.cancelQueries({ queryKey: key(input.planIdOrSlug) }),
                getData: (input: { planIdOrSlug: string }) =>
                  queryClient.getQueryData(key(input.planIdOrSlug)),
                invalidate: (input: { planIdOrSlug: string }) =>
                  queryClient.invalidateQueries({ queryKey: key(input.planIdOrSlug) }),
                reset: (input: { planIdOrSlug: string }) =>
                  queryClient.removeQueries({ queryKey: key(input.planIdOrSlug) }),
                setData: (input: { planIdOrSlug: string }, updater: unknown) =>
                  queryClient.setQueryData(key(input.planIdOrSlug), updater),
              },
            },
          },
        };
      },
      viewer: {
        members: {
          get: {
            useQuery: (input: { planIdOrSlug: string }, options: Record<string, unknown>) =>
              useQuery({
                queryKey: key(input.planIdOrSlug),
                queryFn: () => trpcMocks.getMembers(),
                ...options,
              }),
          },
          add: {
            useMutation: (options: Record<string, unknown>) =>
              useMutation({
                mutationFn: (input: unknown) => trpcMocks.addMember(input),
                ...options,
              } as never),
          },
          update: {
            useMutation: (options: Record<string, unknown>) =>
              useMutation({
                mutationFn: (input: unknown) => trpcMocks.updateMemberTier(input),
                ...options,
              } as never),
          },
          remove: {
            useMutation: (options: Record<string, unknown>) =>
              useMutation({
                mutationFn: (input: unknown) => trpcMocks.removeMember(input),
                ...options,
              } as never),
          },
          leave: {
            useMutation: (options: Record<string, unknown>) =>
              useMutation({
                mutationFn: (input: unknown) => trpcMocks.leavePlan(input),
                ...options,
              } as never),
          },
        },
      },
    },
  };
});

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

const membersKey = (planId: string) => ["viewer", "members", "get", planId];
describe("useShareMembers", () => {
  beforeEach(() => {
    trpcMocks.getMembers.mockReset();
    trpcMocks.addMember.mockReset();
    trpcMocks.updateMemberTier.mockReset();
    trpcMocks.removeMember.mockReset();
    trpcMocks.leavePlan.mockReset();
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
    trpcMocks.addMember.mockResolvedValue({ userId: "user-2", tier: "member" });

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await result.current.addMember.mutateAsync({
        planIdOrSlug: planId,
        email: "new@example.com",
        tier: "member",
      });
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
    trpcMocks.addMember.mockResolvedValue({ userId: "user-1", tier: "admin" });

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await result.current.addMember.mutateAsync({
        planIdOrSlug: planId,
        email: "owner@example.com",
        tier: "admin",
      });
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
    trpcMocks.updateMemberTier.mockRejectedValue(new Error("update failed"));

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await expect(
        result.current.updateTier.mutateAsync({ planIdOrSlug: planId, userId: "user-2", tier: "admin" })
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
    trpcMocks.removeMember.mockRejectedValue(new Error("remove failed"));

    const { result } = renderHook(() => useShareMembers(planId, { enabled: false }), { wrapper });

    await act(async () => {
      await expect(
        result.current.removeMember.mutateAsync({ planIdOrSlug: planId, userId: "user-2" })
      ).rejects.toThrow("remove failed");
    });

    await waitFor(() => {
      const updated = queryClient.getQueryData<ShareMembersData>(membersKey(planId));
      expect(updated?.members.map((member) => member.userId)).toEqual(["user-2", "user-3"]);
    });
  });
});

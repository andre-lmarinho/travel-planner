"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as MembersService from "../services/membersService.actions";
import type { ShareMembersData, ShareTier } from "../types";

// Query Keys

const keys = {
  members: (planId: string) => ["share", "members", planId] as const,
};

// useShareMembers

type UseShareMembersOptions = {
  enabled?: boolean;
};

export function useShareMembers(planId: string, options: UseShareMembersOptions = {}) {
  const enabled = options.enabled ?? true;
  const qc = useQueryClient();
  const queryKey = keys.members(planId);

  const query = useQuery<ShareMembersData>({
    queryKey,
    enabled: Boolean(planId) && enabled,
    queryFn: () => MembersService.getMembers(planId),
  });

  const addMember = useMutation({
    mutationFn: ({ email, tier }: { email: string; tier: ShareTier }) =>
      MembersService.addMember(planId, email, tier),
    onSuccess: (result) => {
      qc.setQueryData<ShareMembersData | undefined>(queryKey, (current) => {
        if (!current) return current;
        if (current.members.some((m) => m.userId === result.userId)) return current;
        return {
          ...current,
          members: [
            ...current.members,
            {
              userId: result.userId,
              tier: result.tier,
              slug: null,
              displayName: null,
              avatarUrl: null,
            },
          ],
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const updateTier = useMutation({
    mutationFn: ({ userId, tier }: { userId: string; tier: ShareTier }) =>
      MembersService.updateMemberTier(planId, userId, tier).then(() => ({ userId, tier })),
    onMutate: async ({ userId, tier }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ShareMembersData>(queryKey);
      qc.setQueryData<ShareMembersData | undefined>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          members: current.members.map((m) => (m.userId === userId ? { ...m, tier } : m)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const removeMember = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      MembersService.removeMember(planId, userId).then(() => ({ userId })),
    onMutate: async ({ userId }) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<ShareMembersData>(queryKey);
      qc.setQueryData<ShareMembersData | undefined>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          members: current.members.filter((m) => m.userId !== userId),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const leave = useMutation({
    mutationFn: () => MembersService.leavePlan(planId),
    onSuccess: () => qc.removeQueries({ queryKey }),
  });

  return {
    ...query,
    addMember,
    updateTier,
    removeMember,
    leave,
  };
}

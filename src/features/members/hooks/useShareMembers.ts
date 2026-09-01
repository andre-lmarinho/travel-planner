"use client";

import { trpc } from "@/trpc/react";

type UseShareMembersOptions = {
  enabled?: boolean;
};

export function useShareMembers(planId: string, options: UseShareMembersOptions = {}) {
  const enabled = options.enabled ?? true;
  const utils = trpc.useUtils();
  const query = trpc.viewer.members.get.useQuery(
    { planIdOrSlug: planId },
    { enabled: Boolean(planId) && enabled }
  );

  const addMutation = trpc.viewer.members.add.useMutation({
    onSuccess: (result) => {
      utils.viewer.members.get.setData({ planIdOrSlug: planId }, (current) => {
        if (!current || current.members.some((member) => member.userId === result.userId)) return current;
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
    onSettled: () => utils.viewer.members.get.invalidate({ planIdOrSlug: planId }),
  });

  const updateMutation = trpc.viewer.members.update.useMutation({
    onMutate: async ({ userId, tier }) => {
      await utils.viewer.members.get.cancel({ planIdOrSlug: planId });
      const previous = utils.viewer.members.get.getData({ planIdOrSlug: planId });
      utils.viewer.members.get.setData({ planIdOrSlug: planId }, (current) => {
        if (!current) return current;
        return {
          ...current,
          members: current.members.map((member) => (member.userId === userId ? { ...member, tier } : member)),
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.viewer.members.get.setData({ planIdOrSlug: planId }, context.previous);
      }
    },
    onSettled: () => utils.viewer.members.get.invalidate({ planIdOrSlug: planId }),
  });

  const removeMutation = trpc.viewer.members.remove.useMutation({
    onMutate: async ({ userId }) => {
      await utils.viewer.members.get.cancel({ planIdOrSlug: planId });
      const previous = utils.viewer.members.get.getData({ planIdOrSlug: planId });
      utils.viewer.members.get.setData({ planIdOrSlug: planId }, (current) => {
        if (!current) return current;
        return { ...current, members: current.members.filter((member) => member.userId !== userId) };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        utils.viewer.members.get.setData({ planIdOrSlug: planId }, context.previous);
      }
    },
    onSettled: () => utils.viewer.members.get.invalidate({ planIdOrSlug: planId }),
  });

  const leaveMutation = trpc.viewer.members.leave.useMutation({
    onSuccess: () => utils.viewer.members.get.reset({ planIdOrSlug: planId }),
  });

  return {
    ...query,
    addMember: addMutation,
    updateTier: updateMutation,
    removeMember: removeMutation,
    leave: leaveMutation,
  };
}

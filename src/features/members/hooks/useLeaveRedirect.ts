"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { trpc } from "@/trpc/react";

import type { ShareMember } from "../types";

type UseLeaveMutation = {
  mutateAsync: (input: { planIdOrSlug: string }) => Promise<unknown>;
};

type UseLeaveRedirectOptions = {
  planIdOrSlug: string;
  viewerUserId: string | null;
  leave: UseLeaveMutation;
};

export function useLeaveRedirect({ planIdOrSlug, viewerUserId, leave }: UseLeaveRedirectOptions) {
  const router = useRouter();
  const profileUtils = trpc.useUtils();
  const ensureProfileMutation = trpc.viewer.profile.ensure.useMutation();
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchProfileSlug = useCallback(async (): Promise<string | null> => {
    try {
      const profile = await profileUtils.viewer.profile.get.fetch({});
      if (profile.slug?.trim()) return profile.slug;
    } catch {
      // Profile may not exist yet; the auth boundary below can create it.
    }

    if (!viewerUserId) return null;

    try {
      return await ensureProfileMutation.mutateAsync({});
    } catch {
      return null;
    }
  }, [ensureProfileMutation, profileUtils, viewerUserId]);

  const handleLeave = useCallback(
    async (member: ShareMember) => {
      setIsLeaving(true);

      try {
        await leave.mutateAsync({ planIdOrSlug });

        const slug = member.slug ?? (viewerUserId ? await fetchProfileSlug() : null);
        const redirectUrl = slug ? `/u/${slug}` : null;

        if (redirectUrl) {
          router.push(redirectUrl);
          router.refresh();
        }
      } finally {
        setIsLeaving(false);
      }
    },
    [fetchProfileSlug, leave, planIdOrSlug, router, viewerUserId]
  );

  return { handleLeave, isLeaving };
}

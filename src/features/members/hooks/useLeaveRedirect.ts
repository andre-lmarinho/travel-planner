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
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchProfileSlug = useCallback(async (): Promise<string | null> => {
    try {
      const profile = await profileUtils.viewer.profile.get.fetch({});
      if (profile.slug?.trim()) return profile.slug;
    } catch {
      // Profile may not exist yet; the auth boundary below can create it.
    }

    try {
      const postController = new AbortController();
      const postTimeout = setTimeout(() => postController.abort(), 5000);
      try {
        const postRes = await fetch("/api/profile/ensure", {
          method: "POST",
          credentials: "same-origin",
          signal: postController.signal,
        });

        if (!postRes.ok) return null;
        const data = (await postRes.json()) as { slug?: string | null };
        return data.slug?.trim() ?? null;
      } finally {
        clearTimeout(postTimeout);
      }
    } catch {
      return null;
    }
  }, [profileUtils]);

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

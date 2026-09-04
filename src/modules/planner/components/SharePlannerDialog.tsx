"use client";

import { useRouter } from "next/navigation";

import type { SubmitEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShareMember, ShareTier } from "@/features/members/types";
import { SHARE_TIER_OPTIONS } from "@/features/members/types";
import { trpc } from "@/trpc/react";
import { Avatar } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTriggerButton } from "@/ui/components/dialog";
import { Share2 } from "@/ui/components/icon";
import { SelectMenu, type SelectMenuOption } from "@/ui/components/select/SelectMenu";
import { cn } from "@/ui/utils/cn";

export function SharePlannerDialog({
  planId,
  isPublic,
  canManageMembers,
  viewerUserId,
}: {
  planId: string;
  isPublic: boolean;
  canManageMembers: boolean;
  viewerUserId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTriggerButton
        type="button"
        className="text-foreground hover:bg-muted/60 inline-flex size-8 cursor-pointer items-center justify-center rounded-sm px-2 transition-colors"
        aria-label="Share planner">
        <Share2 className="size-4" aria-hidden="true" />
      </DialogTriggerButton>
      <DialogContent>
        <DialogHeader
          title="Share planner"
          description="Publish your plan publicly, invite people, and manage planner members."
        />
        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          <VisibilitySection planId={planId} isPublic={isPublic} canManageMembers={canManageMembers} />
          <InviteForm planId={planId} canManageMembers={canManageMembers} />
          <MembersSection planId={planId} canManageMembers={canManageMembers} viewerUserId={viewerUserId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Visibility = "private" | "public";

const VISIBILITY_OPTIONS: ReadonlyArray<SelectMenuOption<Visibility>> = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

function VisibilitySection({
  planId,
  isPublic,
  canManageMembers,
}: {
  planId: string;
  isPublic: boolean;
  canManageMembers: boolean;
}) {
  const [visibility, setVisibility] = useState<Visibility>(isPublic ? "public" : "private");
  const visibilityMutation = trpc.viewer.plan.setVisibility.useMutation();
  const pending = visibilityMutation.isPending;
  const [error, setError] = useState("");

  const handleChange = async (next: Visibility) => {
    const previous = visibility;
    setVisibility(next);
    setError("");
    try {
      await visibilityMutation.mutateAsync({ planId, isPublic: next === "public" });
    } catch {
      setVisibility(previous);
      setError("Could not update visibility. Please try again.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-medium">Visibility</p>
          <p className="text-muted-foreground text-xs">Public plans are viewable by anyone with the link.</p>
        </div>
        <SelectMenu
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onChange={handleChange}
          disabled={!canManageMembers || pending}
          ariaLabel="Plan visibility"
          triggerClassName="w-28 shrink-0"
          contentClassName="w-28"
        />
      </div>
      {!canManageMembers ? (
        <p className="text-muted-foreground text-xs">Only admins can change visibility.</p>
      ) : null}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const getInviteErrorMessage = (error: unknown) => {
  const errorCode =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (errorCode === "USER_NOT_REGISTERED") {
    return "This email has no account yet. Ask them to sign up first, then invite again.";
  }

  return "We could not add this member. Please try again.";
};

function InviteForm({ planId, canManageMembers }: { planId: string; canManageMembers: boolean }) {
  const { addMember, isLoading } = useShareMembers(planId, {
    enabled: Boolean(planId),
  });
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<ShareTier>("member");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const successTimeoutRef = useRef<number | null>(null);

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current === null) {
      return;
    }
    window.clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearSuccessTimeout();
    };
  }, [clearSuccessTimeout]);

  const clearMessages = () => {
    setFormError("");
    setFormSuccess("");
    clearSuccessTimeout();
  };

  const showSuccess = (message: string) => {
    setFormSuccess(message);
    setFormError("");
    clearSuccessTimeout();
    successTimeoutRef.current = window.setTimeout(() => {
      setFormSuccess("");
    }, 3000);
  };

  const showError = (message: string) => {
    setFormError(message);
    setFormSuccess("");
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageMembers) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showError("Enter a valid email.");
      return;
    }

    try {
      await addMember.mutateAsync({ planIdOrSlug: planId, email: trimmedEmail, tier });
      setEmail("");
      showSuccess("Member added.");
    } catch (error) {
      showError(getInviteErrorMessage(error));
    }
  };

  return (
    <div className="space-y-2">
      <form className="flex w-full flex-nowrap items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="Email address…"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (formError || formSuccess) {
              clearMessages();
            }
          }}
          className="border-border bg-background text-foreground min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={!canManageMembers}
        />
        <SelectMenu
          value={tier}
          options={SHARE_TIER_OPTIONS}
          onChange={setTier}
          disabled={!canManageMembers}
          ariaLabel="Select member role"
          triggerClassName="w-28 shrink-0"
          contentClassName="w-28"
        />
        <Button
          type="submit"
          className="shrink-0"
          disabled={!canManageMembers || addMember.isPending || isLoading}>
          Share
        </Button>
      </form>
      {!canManageMembers ? (
        <p className="text-muted-foreground text-xs">Only admins can invite people.</p>
      ) : null}
      {formSuccess ? (
        <output className="text-foreground block text-xs" aria-live="polite">
          {formSuccess}
        </output>
      ) : null}
      {formError ? (
        <p className="text-destructive text-xs" role="alert">
          {formError}
        </p>
      ) : null}
    </div>
  );
}

type MemberMenuOption = ShareTier | "leave" | "remove";

const LEAVE_OPTION: SelectMenuOption<MemberMenuOption> = {
  value: "leave",
  label: "Leave planner",
};
const REMOVE_OPTION: SelectMenuOption<MemberMenuOption> = {
  value: "remove",
  label: "Remove member",
};

const isTier = (value: MemberMenuOption): value is ShareTier => value === "admin" || value === "member";

type MemberMutations = Pick<ReturnType<typeof useShareMembers>, "updateTier" | "removeMember" | "leave">;

type TierOptionsParams = {
  canManageMembers: boolean;
  isSelf: boolean;
  isOwner: boolean;
  isLastAdmin: boolean;
  currentTier: ShareTier;
};

const getTierOptions = ({
  canManageMembers,
  isSelf,
  isOwner,
  isLastAdmin,
  currentTier,
}: TierOptionsParams): ReadonlyArray<SelectMenuOption<MemberMenuOption>> => {
  if (!canManageMembers && isSelf) {
    return SHARE_TIER_OPTIONS.filter((tierOption) => tierOption.value === currentTier);
  }

  if (isOwner || isLastAdmin) {
    return SHARE_TIER_OPTIONS.filter((tierOption) => tierOption.value === "admin");
  }

  return SHARE_TIER_OPTIONS;
};

type ShareMemberRowProps = {
  planId: string;
  member: ShareMember;
  ownerId: string | null;
  adminCount: number;
  viewerUserId: string | null;
  canManageMembers: boolean;
  mutations: MemberMutations;
  onLeave: (member: ShareMember) => void;
};

function ShareMemberRow({
  member,
  planId,
  ownerId,
  adminCount,
  viewerUserId,
  canManageMembers,
  mutations,
  onLeave,
}: ShareMemberRowProps) {
  const isOwner = ownerId === member.userId;
  const isSelf = viewerUserId === member.userId;
  const isAdmin = member.tier === "admin";
  const isLastAdmin = isAdmin && adminCount <= 1;
  const isAdminOrOwner = isAdmin || isOwner;
  const canManageMember = canManageMembers && !isOwner;
  const canRemove = canManageMember && !isSelf;
  const canSelfLeave = isSelf && (!isAdminOrOwner || adminCount > 1);
  const canSelect = isOwner ? canSelfLeave : canManageMembers || isSelf;
  const tierOptions = getTierOptions({
    canManageMembers,
    isSelf,
    isOwner,
    isLastAdmin,
    currentTier: member.tier,
  });
  const menuOptions = [
    ...tierOptions,
    ...(canSelfLeave ? [LEAVE_OPTION] : []),
    ...(canRemove ? [REMOVE_OPTION] : []),
  ];
  const displayName = member.displayName ?? (isOwner ? "Owner" : "User");
  const displayLabel = isOwner ? `${displayName} (owner)` : displayName;
  const isMutating =
    mutations.updateTier.isPending || mutations.leave.isPending || mutations.removeMember.isPending;

  const handleMenuChange = (nextValue: MemberMenuOption) => {
    if (nextValue === "leave") {
      if (canSelfLeave) {
        onLeave(member);
      }
      return;
    }

    if (nextValue === "remove") {
      if (canRemove) {
        mutations.removeMember.mutate({ planIdOrSlug: planId, userId: member.userId });
      }
      return;
    }

    if (!canManageMember || !isTier(nextValue)) {
      return;
    }

    mutations.updateTier.mutate({
      planIdOrSlug: planId,
      userId: member.userId,
      tier: nextValue,
    });
  };

  return (
    <div className="bg-background flex items-center justify-between gap-3 rounded-md py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="lg" displayName={displayName} />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-medium">{displayLabel}</p>
          {member.slug ? <p className="text-muted-foreground truncate text-xs"></p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SelectMenu<MemberMenuOption>
          value={member.tier}
          options={menuOptions}
          onChange={handleMenuChange}
          disabled={!canSelect || isMutating}
          ariaLabel={`${displayName} role`}
          triggerClassName="w-28 shrink-0"
          contentClassName="w-38"
          align="end"
        />
      </div>
    </div>
  );
}

function MembersSection({
  planId,
  canManageMembers,
  viewerUserId,
}: {
  planId: string;
  canManageMembers: boolean;
  viewerUserId: string | null;
}) {
  const { data, isLoading, error, updateTier, removeMember, leave } = useShareMembers(planId, {
    enabled: Boolean(planId),
  });
  const memberMutations = { updateTier, removeMember, leave };
  const { handleLeave, isLeaving } = useLeaveRedirect({
    planIdOrSlug: planId,
    viewerUserId,
    leave: memberMutations.leave,
  });

  const ownerId = data?.ownerId ?? null;
  const members = data?.members ?? [];
  const adminCount = members.filter((member) => member.tier === "admin").length;
  const hasMembers = members.length > 0;
  const isReady = !isLoading && !error;
  const shouldShowEmpty = isReady && !hasMembers;
  const shouldShowList = isReady && hasMembers;

  return (
    <div className="space-y-3">
      {isLeaving ? (
        <p className="text-muted-foreground text-xs" aria-live="polite">
          Leaving planner…
        </p>
      ) : null}
      {isLoading ? <p className="text-muted-foreground text-xs">Loading members…</p> : null}
      {error ? <p className="text-destructive text-xs">Unable to load members.</p> : null}
      {shouldShowEmpty ? <p className="text-muted-foreground text-xs">No members yet.</p> : null}
      {shouldShowList ? (
        <div className={cn("space-y-2", isLeaving && "pointer-events-none opacity-50")}>
          {members.map((member) => (
            <ShareMemberRow
              key={member.userId}
              planId={planId}
              member={member}
              ownerId={ownerId}
              adminCount={adminCount}
              viewerUserId={viewerUserId}
              canManageMembers={canManageMembers}
              mutations={memberMutations}
              onLeave={handleLeave}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type UseShareMembersOptions = {
  enabled?: boolean;
};

function useShareMembers(planId: string, options: UseShareMembersOptions = {}) {
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

type UseLeaveMutation = {
  mutateAsync: (input: { planIdOrSlug: string }) => Promise<unknown>;
};

type UseLeaveRedirectOptions = {
  planIdOrSlug: string;
  viewerUserId: string | null;
  leave: UseLeaveMutation;
};

function useLeaveRedirect({ planIdOrSlug, viewerUserId, leave }: UseLeaveRedirectOptions) {
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

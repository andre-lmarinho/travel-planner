"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEventHandler } from "react";

import { usePlannerContext } from "@/features/plan/hooks/PlannerContext";
import { Avatar } from "@/ui/components/avatar";
import type { SelectMenuOption } from "@/ui/components/select/SelectMenu";
import { SelectMenu } from "@/ui/components/select/SelectMenu";
import { cn } from "@/ui/utils/cn";

import { useLeaveRedirect } from "../hooks/useLeaveRedirect";
import { useShareMembers } from "../hooks/useShareMembers";
import type { ShareMember, ShareTier } from "../types";
import { SHARE_TIER_OPTIONS } from "../types";

type ShareTab = "members" | "requests";

const SHARE_TABS: { value: ShareTab; label: string }[] = [
  { value: "members", label: "Members" },
  { value: "requests", label: "Requests" },
];

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
          {member.slug ? <p className="text-muted-foreground truncate text-xs">@{member.slug}</p> : null}
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

export function MembersSection({ planId }: { planId: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const tab: ShareTab = searchParams.get("tab") === "requests" ? "requests" : "members";

  const updateTab = (newTab: ShareTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "members") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const focusTab = (nextTab: ShareTab) => {
    setTimeout(() => {
      document.getElementById(`share-tab-${nextTab}`)?.focus();
    }, 0);
  };

  const handleTabKeyDown: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const currentIndex = SHARE_TABS.findIndex((tabItem) => tabItem.value === tab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + SHARE_TABS.length) % SHARE_TABS.length;
    const nextTab = SHARE_TABS[nextIndex].value;
    updateTab(nextTab);
    focusTab(nextTab);
  };

  const { data, isLoading, error, updateTier, removeMember, leave } = useShareMembers(planId, {
    enabled: Boolean(planId),
  });
  const memberMutations = { updateTier, removeMember, leave };
  const { viewerUserId, canManageMembers } = usePlannerContext();
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
  const isMembersTab = tab === "members";

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Share sections"
        className="border-border flex items-center gap-3 border-b pb-2 text-sm font-medium">
        {SHARE_TABS.map((tabItem) => (
          <button
            key={tabItem.value}
            type="button"
            role="tab"
            id={`share-tab-${tabItem.value}`}
            aria-selected={tab === tabItem.value}
            aria-controls={`share-panel-${tabItem.value}`}
            tabIndex={tab === tabItem.value ? 0 : -1}
            onClick={() => updateTab(tabItem.value)}
            onKeyDown={handleTabKeyDown}
            className={`transition-colors ${tab === tabItem.value ? "text-primary" : "text-muted-foreground"}`}>
            {tabItem.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`share-panel-${tab}`} aria-labelledby={`share-tab-${tab}`}>
        {isMembersTab ? (
          <>
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
          </>
        ) : (
          <p className="text-muted-foreground text-xs">No requests yet.</p>
        )}
      </div>
    </div>
  );
}

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MembersSection } from "./MembersSection";

const {
  mockUseShareMembers,
  mockUsePlannerContext,
  removeMemberMutate,
  updateTierMutate,
  leaveMutateAsync,
  pushMock,
  refreshMock,
} = vi.hoisted(() => ({
  mockUseShareMembers: vi.fn(),
  mockUsePlannerContext: vi.fn(),
  removeMemberMutate: vi.fn(),
  updateTierMutate: vi.fn(),
  leaveMutateAsync: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: {
    useUtils: () => ({ viewer: { profile: { get: { fetch: vi.fn().mockResolvedValue(null) } } } }),
    viewer: {
      profile: { ensure: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue(null) }) } },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/planner/test",
}));

vi.mock("@/features/members/hooks/useShareMembers", () => ({
  useShareMembers: (...args: unknown[]) => mockUseShareMembers(...args),
}));

vi.mock("@/features/plan/hooks/PlannerContext", () => ({
  usePlannerContext: () => mockUsePlannerContext(),
}));

describe("MembersSection", () => {
  const members = [
    {
      userId: "user-2",
      tier: "member",
      slug: "member-slug",
      displayName: "Member User",
      avatarUrl: null,
    },
    {
      userId: "user-1",
      tier: "admin",
      slug: "owner-slug",
      displayName: "Owner User",
      avatarUrl: null,
    },
  ];

  beforeEach(() => {
    mockUseShareMembers.mockReset();
    mockUsePlannerContext.mockReset();
    removeMemberMutate.mockReset();
    updateTierMutate.mockReset();
    leaveMutateAsync.mockReset();
    pushMock.mockReset();
    refreshMock.mockReset();

    mockUsePlannerContext.mockReturnValue({
      viewerUserId: "user-1",
      canManageMembers: true,
    });

    mockUseShareMembers.mockReturnValue({
      data: { ownerId: "user-1", members },
      isLoading: false,
      error: null,
      updateTier: { mutate: updateTierMutate, isPending: false },
      removeMember: { mutate: removeMemberMutate, isPending: false },
      leave: { mutateAsync: leaveMutateAsync, isPending: false },
    });
  });

  it("renders members including the owner", () => {
    render(<MembersSection planId="plan-1" />);

    expect(screen.getByText("Owner User (owner)")).toBeVisible();
    expect(screen.getByText("Member User")).toBeVisible();
  });

  it("allows admins to remove a member", async () => {
    render(<MembersSection planId="plan-1" />);

    fireEvent.click(screen.getByLabelText("Member User role"));
    fireEvent.click(await screen.findByRole("option", { name: "Remove member" }));

    expect(removeMemberMutate).toHaveBeenCalledWith({ planIdOrSlug: "plan-1", userId: "user-2" });
  });

  it("redirects after a member leaves the planner", async () => {
    mockUsePlannerContext.mockReturnValue({
      viewerUserId: "user-2",
      canManageMembers: false,
    });

    render(<MembersSection planId="plan-1" />);

    fireEvent.click(screen.getByLabelText("Member User role"));
    fireEvent.click(await screen.findByRole("option", { name: "Leave planner" }));

    await waitFor(() => expect(leaveMutateAsync).toHaveBeenCalled());
    expect(pushMock).toHaveBeenCalledWith("/u/member-slug");
    expect(refreshMock).toHaveBeenCalled();
  });
});

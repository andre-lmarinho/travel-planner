import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SharePlannerDialog } from "./SharePlannerDialog";

vi.mock("next/navigation", () => ({
  usePathname: () => "/p/plan-1",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: {
    useUtils: () => ({
      viewer: {
        members: {
          get: {
            setData: vi.fn(),
            invalidate: vi.fn(),
            cancel: vi.fn(),
            getData: vi.fn(),
            reset: vi.fn(),
          },
        },
        profile: { get: { fetch: vi.fn() } },
      },
    }),
    viewer: {
      plan: {},
      members: {
        get: { useQuery: () => ({ data: { ownerId: "owner", members: [] }, isLoading: false, error: null }) },
        add: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
        update: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        remove: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        leave: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      },
      profile: {
        ensure: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      },
    },
  },
}));

describe("SharePlannerDialog", () => {
  it("provides an accessible description", () => {
    render(<SharePlannerDialog planId="plan-1" canManageMembers={true} viewerUserId={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Share planner" }));

    expect(screen.getByRole("dialog", { name: "Share planner" })).toHaveAccessibleDescription(
      "Invite people and manage planner members."
    );
  });
});

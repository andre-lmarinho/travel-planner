import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AddMemberResult, ShareMembersData, ShareTier } from "@/features/members/types";
import { SharePlannerDialog } from "./SharePlannerDialog";

type AddInput = { planIdOrSlug: string; email: string; tier: ShareTier };
type UpdateInput = { planIdOrSlug: string; userId: string; tier: ShareTier };
type RemoveInput = { planIdOrSlug: string; userId: string };
type Snapshot = { previous?: ShareMembersData };
const shared = vi.hoisted(() => ({
  client: null as QueryClient | null,
  data: { ownerId: "owner", members: [] } as ShareMembersData,
  add: vi.fn<(input: AddInput) => Promise<AddMemberResult>>(),
  update: vi.fn<(input: UpdateInput) => Promise<void>>(),
  remove: vi.fn<(input: RemoveInput) => Promise<void>>(),
  leave: vi.fn<(input: { planIdOrSlug: string }) => Promise<string>>(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: shared.push, refresh: shared.refresh }),
  usePathname: () => "/p/plan-1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/ui/components/select/SelectMenu", () => ({
  SelectMenu: ({
    value,
    options,
    onChange,
    disabled,
    ariaLabel,
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    disabled: boolean;
    ariaLabel: string;
  }) => (
    <select
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock("@/trpc/react", async () => {
  const { useQuery, useMutation, useQueryClient } = await import("@tanstack/react-query");
  const key = ["members"];
  return {
    trpc: {
      useUtils: () => {
        const client = useQueryClient();
        shared.client = client;
        return {
          viewer: {
            members: {
              get: {
                cancel: () => client.cancelQueries({ queryKey: key }),
                getData: () => client.getQueryData<ShareMembersData>(key),
                setData: (
                  _input: unknown,
                  data:
                    | ShareMembersData
                    | ((current: ShareMembersData | undefined) => ShareMembersData | undefined)
                ) => client.setQueryData<ShareMembersData>(key, data),
                invalidate: vi.fn(),
                reset: vi.fn(),
              },
            },
          },
        };
      },
      viewer: {
        members: {
          get: {
            useQuery: (_input: unknown, options: { enabled: boolean }) =>
              useQuery({
                queryKey: key,
                queryFn: async () => shared.data,
                initialData: shared.data,
                enabled: options.enabled,
              }),
          },
          add: {
            useMutation: (options: UseMutationOptions<AddMemberResult, Error, AddInput>) =>
              useMutation({ ...options, mutationFn: (input) => shared.add(input), retry: false }),
          },
          update: {
            useMutation: (options: UseMutationOptions<void, Error, UpdateInput, Snapshot>) =>
              useMutation({ ...options, mutationFn: (input) => shared.update(input), retry: false }),
          },
          remove: {
            useMutation: (options: UseMutationOptions<void, Error, RemoveInput, Snapshot>) =>
              useMutation({ ...options, mutationFn: (input) => shared.remove(input), retry: false }),
          },
          leave: {
            useMutation: (options: UseMutationOptions<string, Error, { planIdOrSlug: string }>) =>
              useMutation({ ...options, mutationFn: (input) => shared.leave(input), retry: false }),
          },
        },
      },
    },
  };
});
beforeEach(() => {
  shared.data = {
    ownerId: "owner",
    members: [
      { userId: "owner", tier: "admin", slug: "owner", displayName: "Owner", avatarUrl: null },
      { userId: "member", tier: "member", slug: "member", displayName: "Member", avatarUrl: null },
    ],
  };
  shared.add.mockReset().mockResolvedValue({ userId: "new-member", tier: "member" });
  shared.update.mockReset().mockResolvedValue(undefined);
  shared.remove.mockReset().mockResolvedValue(undefined);
  shared.leave.mockReset().mockResolvedValue("/");
  shared.push.mockClear();
  shared.refresh.mockClear();
});
function openDialog(canManageMembers = true, viewerUserId = "owner") {
  render(
    <SharePlannerDialog planId="plan-1" canManageMembers={canManageMembers} viewerUserId={viewerUserId} />
  );
  fireEvent.click(screen.getByRole("button", { name: "Share planner" }));
}
describe("SharePlannerDialog", () => {
  it("provides a description and shares one query observer across invite and list", () => {
    openDialog();
    expect(screen.getByRole("dialog", { name: "Share planner" })).toHaveAccessibleDescription(
      "Invite people and manage planner members."
    );
    expect(
      shared.client
        ?.getQueryCache()
        .find({ queryKey: ["members"] })
        ?.getObserversCount()
    ).toBe(1);
  });
  it("adds a member through the shared mutation", async () => {
    openDialog();
    fireEvent.change(screen.getByPlaceholderText("Email address…"), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() =>
      expect(shared.add).toHaveBeenCalledWith({
        planIdOrSlug: "plan-1",
        email: "new@example.com",
        tier: "member",
      })
    );
    expect(await screen.findByText("Member added.")).toBeInTheDocument();
    expect(shared.client?.getQueryData<ShareMembersData>(["members"])?.members).toHaveLength(3);
  });
  it("keeps invitation and owner role changes unavailable to ordinary members", () => {
    openDialog(false, "member");
    expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Owner role" })).toBeDisabled();
    expect(
      screen.getByRole("combobox", { name: "Member role" }).querySelector('option[value="admin"]')
    ).toBeNull();
  });
  it("rolls back a failed optimistic role change", async () => {
    let fail!: (reason: Error) => void;
    shared.update.mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          fail = reject;
        })
    );
    openDialog();
    fireEvent.change(screen.getByRole("combobox", { name: "Member role" }), { target: { value: "admin" } });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Member role" })).toHaveValue("admin"));
    await act(async () => fail(new Error("offline")));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Member role" })).toHaveValue("member"));
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to update members");
  });
  it("navigates to the server-provided destination after leaving", async () => {
    openDialog(false, "member");
    fireEvent.change(screen.getByRole("combobox", { name: "Member role" }), { target: { value: "leave" } });
    await waitFor(() => expect(shared.leave).toHaveBeenCalledWith({ planIdOrSlug: "plan-1" }));
    await waitFor(() => expect(shared.push).toHaveBeenCalledWith("/"));
    expect(shared.refresh).toHaveBeenCalledOnce();
  });
});

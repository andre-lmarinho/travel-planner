import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ShareMember } from "../types";
import { useLeaveRedirect } from "./useLeaveRedirect";

const { pushMock, refreshMock, profileFetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  profileFetchMock: vi.fn(),
}));

vi.mock("@/trpc/react", () => ({
  trpc: {
    useUtils: () => ({ viewer: { profile: { get: { fetch: profileFetchMock } } } }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const createMember = (overrides: Partial<ShareMember> = {}): ShareMember => ({
  userId: "user-1",
  tier: "member",
  slug: "member-slug",
  displayName: "Member User",
  avatarUrl: null,
  ...overrides,
});

const createDeferred = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
};

describe("useLeaveRedirect", () => {
  const fetchMock = vi.fn<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>();

  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    fetchMock.mockReset();
    profileFetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects using the member slug after leaving", async () => {
    const leave = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const member = createMember({ slug: "member-slug" });

    const { result } = renderHook(() =>
      useLeaveRedirect({ planIdOrSlug: "plan-1", viewerUserId: "user-1", leave })
    );

    await act(async () => {
      await result.current.handleLeave(member);
    });

    expect(leave.mutateAsync).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/u/member-slug");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.isLeaving).toBe(false);
  });

  it("resolves a slug via profile lookup when missing", async () => {
    profileFetchMock.mockResolvedValueOnce({ slug: "viewer-slug" });
    const leave = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const member = createMember({ slug: null });

    const { result } = renderHook(() =>
      useLeaveRedirect({ planIdOrSlug: "plan-1", viewerUserId: "user-1", leave })
    );

    await act(async () => {
      await result.current.handleLeave(member);
    });

    expect(profileFetchMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/u/viewer-slug");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not redirect when no slug can be resolved", async () => {
    const leave = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const member = createMember({ slug: null });

    const { result } = renderHook(() =>
      useLeaveRedirect({ planIdOrSlug: "plan-1", viewerUserId: null, leave })
    );

    await act(async () => {
      await result.current.handleLeave(member);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("clears the leaving state when the mutation fails", async () => {
    const deferred = createDeferred<void>();
    const leave = { mutateAsync: vi.fn().mockReturnValue(deferred.promise) };
    const member = createMember();

    const { result } = renderHook(() =>
      useLeaveRedirect({ planIdOrSlug: "plan-1", viewerUserId: "user-1", leave })
    );

    let leavePromise: Promise<void> = Promise.resolve();
    act(() => {
      leavePromise = result.current.handleLeave(member);
    });

    expect(result.current.isLeaving).toBe(true);

    deferred.reject(new Error("leave failed"));
    await act(async () => {
      await leavePromise.catch(() => undefined);
    });

    expect(result.current.isLeaving).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
  });
});

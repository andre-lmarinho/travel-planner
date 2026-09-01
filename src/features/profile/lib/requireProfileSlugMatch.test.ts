import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireUser, UnauthorizedError } from "@/features/auth/lib/session";
import { requireProfileSlugMatch } from "./requireProfileSlugMatch";

const { fetchProfileBySlug } = vi.hoisted(() => ({ fetchProfileBySlug: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/features/profile/repositories/ProfileRepository", () => ({
  ProfileRepository: class {
    fetchProfileBySlug = fetchProfileBySlug;
  },
}));

vi.mock("@/shared/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/auth/lib/session", () => {
  class UnauthorizedError extends Error {
    constructor(message = "Authentication required.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  }

  return {
    requireUser: vi.fn(),
    UnauthorizedError,
  };
});

describe("requireProfileSlugMatch", () => {
  const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT",
  });

  beforeEach(() => {
    vi.mocked(redirect).mockReset();
    vi.mocked(redirect).mockImplementation(() => {
      throw redirectError;
    });
    vi.mocked(requireUser).mockReset();
    fetchProfileBySlug.mockReset();
  });

  it("redirects when slug is empty", async () => {
    await expect(requireProfileSlugMatch("   ")).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(requireUser).not.toHaveBeenCalled();
    expect(fetchProfileBySlug).not.toHaveBeenCalled();
  });

  it("redirects when the user is unauthorized", async () => {
    vi.mocked(requireUser).mockRejectedValue(new UnauthorizedError());

    await expect(requireProfileSlugMatch("alice")).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when profile is missing", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1" });
    fetchProfileBySlug.mockResolvedValue(null);

    await expect(requireProfileSlugMatch("alice")).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledWith("/login");
    expect(fetchProfileBySlug).toHaveBeenCalledWith("alice");
  });

  it("redirects when profile does not match the user", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1" });
    fetchProfileBySlug.mockResolvedValue({
      userId: "user-2",
      slug: "alice",
      displayName: "Alice",
      avatarUrl: null,
    });

    await expect(requireProfileSlugMatch("alice")).rejects.toBe(redirectError);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns user and profile when slug matches", async () => {
    const user = { id: "user-1", email: "alice@example.com" };
    const profile = {
      userId: "user-1",
      slug: "alice",
      displayName: "Alice",
      avatarUrl: null,
    };
    vi.mocked(requireUser).mockResolvedValue(user);
    fetchProfileBySlug.mockResolvedValue(profile);

    await expect(requireProfileSlugMatch(" alice ")).resolves.toEqual({ user, profile });
    expect(fetchProfileBySlug).toHaveBeenCalledWith("alice");
  });

  it("wraps unexpected errors with context", async () => {
    const failure = new Error("Supabase failed");
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1" });
    fetchProfileBySlug.mockRejectedValue(failure);

    const error = await requireProfileSlugMatch("alice").catch((caught) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Unable to validate profile slug match: slug=alice");
    expect((error as Error).cause).toBe(failure);
  });
});

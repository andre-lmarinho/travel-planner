import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileRecord } from "../types";
import { getProfileBySlug } from "./getProfileBySlug";

const { mockFetchProfileBySlug } = vi.hoisted(() => ({ mockFetchProfileBySlug: vi.fn() }));

vi.mock("@/features/profile/repositories/ProfileRepository", () => ({
  ProfileRepository: class {
    fetchProfileBySlug = mockFetchProfileBySlug;
  },
}));
vi.mock("@/shared/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("getProfileBySlug", () => {
  beforeEach(() => {
    mockFetchProfileBySlug.mockReset();
  });

  it("returns null when slug is empty or whitespace", async () => {
    const result = await getProfileBySlug("   ");

    expect(result).toBeNull();
    expect(mockFetchProfileBySlug).not.toHaveBeenCalled();
  });

  it("returns null when repository has no profile", async () => {
    mockFetchProfileBySlug.mockResolvedValue(null);

    const profile = await getProfileBySlug("alice");

    expect(profile).toBeNull();
    expect(mockFetchProfileBySlug).toHaveBeenCalledWith("alice");
  });

  it("propagates repository errors", async () => {
    const failure = new Error("fail");
    mockFetchProfileBySlug.mockRejectedValue(failure);

    await expect(getProfileBySlug("alice")).rejects.toBe(failure);
  });

  it("returns a ProfileRecord from the repository", async () => {
    const profile: ProfileRecord = {
      userId: "user-1",
      slug: "alice",
      displayName: "Alice",
      avatarUrl: "https://avatar.png",
    };
    mockFetchProfileBySlug.mockResolvedValue(profile);

    const result = await getProfileBySlug(" alice ");

    expect(result).toEqual(profile);
    expect(mockFetchProfileBySlug).toHaveBeenCalledWith("alice");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "./ProfileService";

const repositoryMocks = vi.hoisted(() => ({
  fetchProfileByUserId: vi.fn(),
  upsertProfile: vi.fn(),
}));

function makeService(): ProfileService {
  return new ProfileService({
    fetchProfileByUserId: repositoryMocks.fetchProfileByUserId,
    upsertProfile: repositoryMocks.upsertProfile,
  } as unknown as ProfileRepository);
}

describe("ProfileService", () => {
  beforeEach(() => {
    repositoryMocks.fetchProfileByUserId.mockReset();
    repositoryMocks.upsertProfile.mockReset();
  });

  it("returns the authenticated viewer profile", async () => {
    repositoryMocks.fetchProfileByUserId.mockResolvedValue({
      avatarUrl: null,
      displayName: "Ada",
      slug: "ada",
      userId: "user-1",
    });

    await expect(makeService().getViewerProfile("user-1")).resolves.toMatchObject({ slug: "ada" });
    expect(repositoryMocks.fetchProfileByUserId).toHaveBeenCalledWith("user-1");
  });

  it("raises NOT_FOUND when the authenticated user has no profile", async () => {
    repositoryMocks.fetchProfileByUserId.mockResolvedValue(null);

    await expect(makeService().getViewerProfile("user-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Profile not found.",
    });
  });

  it("allocates a stable unique slug after a conflict", async () => {
    repositoryMocks.upsertProfile
      .mockRejectedValueOnce(new Error("duplicate", { cause: { code: "23505" } }))
      .mockResolvedValueOnce({ slug: "ada-user-1" });

    await expect(
      makeService().ensureProfile({ id: "user-1", email: "ada@example.com", user_metadata: null })
    ).resolves.toBe("ada-user-1");
    expect(repositoryMocks.upsertProfile).toHaveBeenCalledTimes(2);
    expect(repositoryMocks.upsertProfile).toHaveBeenLastCalledWith({
      avatarUrl: null,
      displayName: "ada",
      slug: "ada-user-1",
      userId: "user-1",
    });
  });
});

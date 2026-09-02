import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "./ProfileService";

const repositoryMocks = vi.hoisted(() => ({
  fetchProfileByUserId: vi.fn(),
  updateProfile: vi.fn(),
  upsertProfile: vi.fn(),
}));

function makeService(): ProfileService {
  return new ProfileService({
    fetchProfileByUserId: repositoryMocks.fetchProfileByUserId,
    updateProfile: repositoryMocks.updateProfile,
    upsertProfile: repositoryMocks.upsertProfile,
  } as unknown as ProfileRepository);
}

describe("ProfileService", () => {
  beforeEach(() => {
    repositoryMocks.fetchProfileByUserId.mockReset();
    repositoryMocks.updateProfile.mockReset();
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

  it("updates the viewer profile with normalized values", async () => {
    repositoryMocks.updateProfile.mockResolvedValue({
      avatarUrl: null,
      displayName: "Grace Hopper",
      slug: "grace-hopper",
      userId: "user-1",
    });

    await expect(
      makeService().updateViewerProfile("user-1", { displayName: "  Grace Hopper ", slug: " Grace-Hopper " })
    ).resolves.toMatchObject({ displayName: "Grace Hopper", slug: "grace-hopper" });
    expect(repositoryMocks.updateProfile).toHaveBeenCalledWith({
      displayName: "Grace Hopper",
      slug: "grace-hopper",
      userId: "user-1",
    });
  });

  it("rejects an invalid username before writing", async () => {
    await expect(
      makeService().updateViewerProfile("user-1", { displayName: "Grace", slug: "not valid" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repositoryMocks.updateProfile).not.toHaveBeenCalled();
  });

  it("maps a duplicate username to a conflict", async () => {
    repositoryMocks.updateProfile.mockRejectedValue(new Error("duplicate", { cause: { code: "23505" } }));

    await expect(
      makeService().updateViewerProfile("user-1", { displayName: "Grace", slug: "grace" })
    ).rejects.toMatchObject({ code: "CONFLICT", message: "Username is already in use." });
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

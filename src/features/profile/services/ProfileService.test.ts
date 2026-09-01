import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileRepository } from "../repositories/ProfileRepository";
import { ProfileService } from "./ProfileService";

const repositoryMocks = vi.hoisted(() => ({
  fetchProfileByUserId: vi.fn(),
}));

function makeService(): ProfileService {
  return new ProfileService({
    fetchProfileByUserId: repositoryMocks.fetchProfileByUserId,
  } as unknown as ProfileRepository);
}

describe("ProfileService", () => {
  beforeEach(() => {
    repositoryMocks.fetchProfileByUserId.mockReset();
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
});

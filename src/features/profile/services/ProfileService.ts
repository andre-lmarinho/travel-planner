import "server-only";

import { ApplicationError } from "@/lib/errors";

import type { ProfileRepository } from "../repositories/ProfileRepository";
import type { ProfileSummary } from "../types";

export class ProfileService {
  constructor(private readonly repo: ProfileRepository) {}

  async getViewerProfile(userId: string): Promise<ProfileSummary> {
    const profile = await this.repo.fetchProfileByUserId(userId);

    if (!profile) {
      throw new ApplicationError("NOT_FOUND", "Profile not found.");
    }

    return profile;
  }
}

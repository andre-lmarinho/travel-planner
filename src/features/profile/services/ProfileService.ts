import "server-only";
import slugify from "@sindresorhus/slugify";
import type { Viewer } from "@/features/auth/lib/session";
import { extractErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { ApplicationError } from "@/lib/errors";
import { isRecord, readString } from "@/lib/typeGuards";

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

  async ensureProfile(viewer: Viewer): Promise<string> {
    const metadata = viewer.user_metadata as Record<string, unknown> | null;
    const displayName =
      readMetadataString(metadata, "full_name") ??
      readMetadataString(metadata, "name") ??
      readMetadataString(metadata, "user_name") ??
      readMetadataString(metadata, "username") ??
      viewer.email?.split("@")[0] ??
      null;
    const avatarUrl = readMetadataString(metadata, "avatar_url");
    const base =
      readMetadataString(metadata, "username") ??
      readMetadataString(metadata, "user_name") ??
      readMetadataString(metadata, "preferred_username") ??
      readMetadataString(metadata, "full_name") ??
      viewer.email?.split("@")[0] ??
      viewer.id;
    const baseSlug =
      slugify(base, { separator: "-", lowercase: true }) ||
      slugify(viewer.id, { separator: "-", lowercase: true });
    const viewerSlug = slugify(viewer.id, { separator: "-", lowercase: true });
    const slugs = [baseSlug, `${baseSlug}-${viewerSlug}`];
    for (const slug of slugs) {
      try {
        return (await this.repo.upsertProfile({ userId: viewer.id, slug, displayName, avatarUrl })).slug;
      } catch (error) {
        if (extractSupabaseErrorCode(error) === "23505" && slug !== slugs[slugs.length - 1]) continue;
        const code = extractSupabaseErrorCode(error);
        const message = extractErrorMessage(error);
        throw new Error(
          "ensureProfile upsert failed: userId=" +
            viewer.id +
            " slug=" +
            slug +
            (code ? ` code=${code}` : "") +
            (message ? ` message=${message}` : ""),
          { cause: error }
        );
      }
    }
    throw new Error(`ensureProfile failed to allocate a unique slug: userId=${viewer.id}`);
  }
}

function readMetadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractSupabaseErrorCode(error: unknown): string | null {
  const direct = isRecord(error) ? error : null;
  const cause =
    error instanceof Error && "cause" in error ? (error as Error & { cause?: unknown }).cause : null;
  const causeRecord = isRecord(cause) ? cause : null;
  return readString(causeRecord?.code) ?? readString(direct?.code);
}

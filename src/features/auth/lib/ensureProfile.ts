import "server-only";

import slugify from "@sindresorhus/slugify";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { SupabaseUser } from "@/features/auth/lib/session";
import { requireUser } from "@/features/auth/lib/session";
import { extractErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { isRecord, readString } from "@/lib/typeGuards";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

const MAX_SLUG_ATTEMPTS = 10;

type EnsureProfileOptions = {
  client?: SupabaseClient;
};

type ProfileUpsertPayload = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  baseSlug: string;
};

export const ensureProfile = cache(async ({ client }: EnsureProfileOptions = {}): Promise<string> => {
  const user = await requireUser();

  const payload: ProfileUpsertPayload = {
    id: user.id,
    displayName: extractDisplayName(user),
    avatarUrl: extractAvatarUrl(user),
    baseSlug: buildSlugBase(user),
  };

  return upsertProfileWithUniqueSlug(payload, client);
});

function extractDisplayName(user: SupabaseUser): string | null {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const candidate =
    readMetadataString(metadata, "full_name") ??
    readMetadataString(metadata, "name") ??
    readMetadataString(metadata, "user_name") ??
    readMetadataString(metadata, "username");

  if (candidate) {
    return candidate;
  }

  const emailPrefix = user.email?.split("@")[0];

  return typeof emailPrefix === "string" && emailPrefix.length > 0 ? emailPrefix : null;
}

function extractAvatarUrl(user: SupabaseUser): string | null {
  const metadata = user.user_metadata as Record<string, unknown> | null;

  return readMetadataString(metadata, "avatar_url");
}

function buildSlugBase(user: SupabaseUser): string {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const slugCandidate =
    readMetadataString(metadata, "username") ??
    readMetadataString(metadata, "user_name") ??
    readMetadataString(metadata, "preferred_username") ??
    readMetadataString(metadata, "full_name") ??
    (user.email ? user.email.split("@")[0] : null) ??
    user.id;

  return (
    slugify(slugCandidate, { separator: "-", lowercase: true }) ||
    slugify(user.id, { separator: "-", lowercase: true })
  );
}

function readMetadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  if (!metadata) {
    return null;
  }

  const value = metadata[key as keyof typeof metadata];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function upsertProfileWithUniqueSlug(
  { id, displayName, avatarUrl, baseSlug }: ProfileUpsertPayload,
  client?: SupabaseClient
): Promise<string> {
  const repo = new ProfileRepository((client ?? createSupabaseServerClient()) as SupabaseClient<Database>);
  const sanitizedBase = baseSlug || slugify(id, { separator: "-", lowercase: true });

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidateSlug = attempt === 0 ? sanitizedBase : `${sanitizedBase}-${attempt}`;
    try {
      const result = await repo.upsertProfile({
        userId: id,
        slug: candidateSlug,
        displayName,
        avatarUrl,
      });
      return result.slug;
    } catch (error) {
      if (extractSupabaseErrorCode(error) === "23505") {
        continue;
      }

      throw buildProfileUpsertError({
        userId: id,
        slug: candidateSlug,
        error,
      });
    }
  }

  throw new Error(`ensureProfile failed to allocate a unique slug: userId=${id}`);
}

type BuildProfileUpsertErrorParams = {
  userId: string;
  slug: string;
  error: unknown;
};

function buildProfileUpsertError({ userId, slug, error }: BuildProfileUpsertErrorParams): Error {
  const message = extractErrorMessage(error);
  const code = extractSupabaseErrorCode(error);
  const messageText = message ? ` message=${message}` : "";
  const codeText = code ? ` code=${code}` : "";
  return new Error(`ensureProfile upsert failed: userId=${userId} slug=${slug}${codeText}${messageText}`);
}

function extractSupabaseErrorCode(error: unknown): string | null {
  const direct = isRecord(error) ? error : null;
  const cause =
    error instanceof Error && "cause" in error ? (error as Error & { cause?: unknown }).cause : null;
  const causeRecord = isRecord(cause) ? cause : null;
  const code = readString(causeRecord?.code) ?? readString(direct?.code);

  return code ?? null;
}

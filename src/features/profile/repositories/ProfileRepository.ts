import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import type { Database } from "@/supabase/types";

import type { ProfileRecord, ProfileSummary } from "../types";

export type ProfileUpsertPayload = {
  userId: string;
  slug: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ProfileUpsertResult = {
  slug: string;
};

export class ProfileRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchProfileBySlug(slug: string): Promise<ProfileRecord | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, slug, display_name, avatar_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchProfileBySlug", identifiers: { slug }, error });
    }

    if (!data?.slug) {
      return null;
    }

    return {
      userId: data.id,
      slug: data.slug,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
    };
  }

  async fetchProfileByUserId(userId: string): Promise<ProfileSummary | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, slug, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw formatSupabaseError({ operation: "fetchProfileByUserId", identifiers: { userId }, error });
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.id,
      slug: data.slug,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
    };
  }

  async fetchProfileSlugByUserId(userId: string): Promise<string | null> {
    const { data, error } = await this.client.from("profiles").select("slug").eq("id", userId).maybeSingle();

    if (error) {
      throw formatSupabaseError({
        operation: "fetchProfileSlugByUserId",
        identifiers: { userId },
        error,
      });
    }

    return data?.slug ?? null;
  }

  async upsertProfile(payload: ProfileUpsertPayload): Promise<ProfileUpsertResult> {
    const { userId, slug, displayName, avatarUrl } = payload;
    const { data, error } = await this.client
      .from("profiles")
      .upsert(
        {
          id: userId,
          slug,
          display_name: displayName,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      )
      .select("slug")
      .single();

    if (error) {
      throw formatSupabaseError({ operation: "upsertProfile", identifiers: { userId, slug }, error });
    }

    if (!data) {
      throw formatSupabaseError({ operation: "upsertProfile:missing-row", identifiers: { userId, slug } });
    }

    if (!data.slug) {
      throw formatSupabaseError({ operation: "upsertProfile:missing-slug", identifiers: { userId, slug } });
    }

    return { slug: data.slug };
  }
}

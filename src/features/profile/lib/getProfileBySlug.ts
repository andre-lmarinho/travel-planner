import "server-only";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { ProfileRepository } from "../repositories/ProfileRepository";
import type { ProfileRecord } from "../types";

export async function getProfileBySlug(slug: string): Promise<ProfileRecord | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  return new ProfileRepository(createSupabaseServerClient()).fetchProfileBySlug(normalizedSlug);
}

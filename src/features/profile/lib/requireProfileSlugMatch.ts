import "server-only";

import { redirect } from "next/navigation";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import type { SupabaseUser } from "@/shared/lib/auth/session";
import { requireUser, UnauthorizedError } from "@/shared/lib/auth/session";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import type { ProfileRecord } from "../types";

function isRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const digest = (error as { digest?: string }).digest;
  return typeof digest === "string" && digest.includes("NEXT_REDIRECT");
}

type RequireProfileSlugMatchResult = {
  user: SupabaseUser;
  profile: ProfileRecord;
};

export async function requireProfileSlugMatch(slug: string): Promise<RequireProfileSlugMatchResult> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    redirect("/login");
  }

  try {
    const user = await requireUser();
    const profile = await new ProfileRepository(createSupabaseServerClient()).fetchProfileBySlug(
      normalizedSlug
    );

    if (!profile || profile.userId !== user.id) {
      redirect("/login");
    }

    return { user, profile };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }

    const cause = error instanceof Error ? error : undefined;
    throw new Error(`Unable to validate profile slug match: slug=${normalizedSlug}`, { cause });
  }
}

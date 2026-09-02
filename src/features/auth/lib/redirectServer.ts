import "server-only";

import { redirect } from "next/navigation";
import { getViewer } from "@/features/auth/lib/session";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";
import { createSupabaseServerClient } from "@/supabase/server";

export async function redirectIfAuthenticated(nextPath: string | null): Promise<void> {
  const user = await getViewer();

  if (!user) {
    return;
  }

  const slug = await new ProfileService(new ProfileRepository(createSupabaseServerClient())).ensureProfile(
    user
  );
  redirect(nextPath ?? `/u/${slug}`);
}

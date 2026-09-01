import "server-only";

import { validUsername } from "@/features/auth/utils/validUsername";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { createSupabaseServiceRoleClient } from "@/supabase/serviceRole";

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!validUsername(username)) {
    return false;
  }

  const supabase = createSupabaseServiceRoleClient();
  const profile = await new ProfileRepository(supabase).fetchProfileBySlug(username);
  return !profile;
}

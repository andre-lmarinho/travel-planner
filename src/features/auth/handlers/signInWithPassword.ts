import type { AuthResponse } from "@supabase/auth-js";
import type { Session } from "@supabase/supabase-js";

import { extractErrorMessage } from "@/features/auth/utils/extractErrorMessage";
import { supabase } from "@/supabase/client";

type SignInWithPasswordInput = {
  email: string;
  password: string;
  resolveProfile: () => Promise<string>;
};

type SignInWithPasswordResult = {
  slug: string;
};

export async function signInWithPassword({
  email,
  password,
  resolveProfile,
}: SignInWithPasswordInput): Promise<SignInWithPasswordResult> {
  const trimmedEmail = email.trim();

  const { data, error } = (await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })) as AuthResponse;

  if (error) {
    throw new Error(`signIn failed: message=${error.message}`);
  }

  const session: Session | null = data.session ?? null;

  if (!session) {
    throw new Error(`signIn failed: reason=no_session`);
  }

  const userId = session.user?.id;

  if (!userId) {
    return { slug: await resolveProfile() };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    const message = extractErrorMessage(profileError) ?? "unknown";
    throw new Error(`getProfileSlug failed: userId=${userId} message=${message}`);
  }

  if (profile?.slug) {
    return { slug: profile.slug };
  }

  return { slug: await resolveProfile() };
}

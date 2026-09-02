import type { AuthResponse } from "@supabase/auth-js";
import type { Session } from "@supabase/supabase-js";

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

  return { slug: await resolveProfile() };
}

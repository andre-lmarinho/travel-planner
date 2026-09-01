import type { AuthResponse } from "@supabase/auth-js";
import type { Session } from "@supabase/supabase-js";

import { normalizeUsername, validUsername } from "@/features/auth/utils/validUsername";
import { supabase } from "@/supabase/client";

type RegisterWithPasswordInput = {
  username: string;
  email: string;
  password: string;
  finalizeProfile: () => Promise<string>;
  emailRedirectTo?: string;
};

type RegisterWithPasswordResult =
  | {
      status: "needs-confirmation";
    }
  | {
      status: "signed-in";
      slug: string;
    };

export async function registerWithPassword({
  username,
  email,
  password,
  finalizeProfile,
  emailRedirectTo,
}: RegisterWithPasswordInput): Promise<RegisterWithPasswordResult> {
  const normalizedUsername = normalizeUsername(username);
  if (!validUsername(normalizedUsername)) {
    throw new Error("Invalid username format");
  }

  const normalizedEmail = email.trim();
  const options = emailRedirectTo
    ? { emailRedirectTo, data: { username: normalizedUsername } }
    : { data: { username: normalizedUsername } };

  const { data, error } = (await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options,
  })) as AuthResponse;

  if (error) {
    throw new Error(`registerWithPassword failed: message=${error.message}`);
  }

  const session: Session | null = data.session ?? null;

  if (!session) {
    return { status: "needs-confirmation" };
  }

  const slug = await finalizeProfile();

  return { status: "signed-in", slug };
}

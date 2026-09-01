import { supabase } from "@/supabase/client";

type SendResetPasswordEmailInput = {
  email: string;
  redirectTo?: string;
};

export async function sendResetPasswordEmail({
  email,
  redirectTo,
}: SendResetPasswordEmailInput): Promise<void> {
  const trimmedEmail = email.trim();

  const { error } = await supabase.auth.resetPasswordForEmail(
    trimmedEmail,
    redirectTo ? { redirectTo } : undefined
  );

  if (error) {
    throw new Error(`sendResetPasswordEmail failed: message=${error.message}`);
  }
}

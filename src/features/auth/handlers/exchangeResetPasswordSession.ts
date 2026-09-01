import { supabase } from "@/supabase/client";

export type ResetPasswordExchangeResult = { status: "ready" } | { status: "error"; error: unknown };

export async function exchangeResetPasswordSession(code: string): Promise<ResetPasswordExchangeResult> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    return { status: "error", error: sessionError };
  }

  if (sessionData.session) {
    return { status: "ready" };
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return { status: "error", error: error ?? new Error("Missing session.") };
  }

  // The @supabase/ssr browser client persists the exchanged session to cookies
  // that the server reads directly; no manual server sync is needed.
  return { status: "ready" };
}

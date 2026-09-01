import { supabase } from "@/supabase/client";

export type UpdatePasswordResult = { ok: true } | { ok: false; error: unknown };

export async function updatePassword(password: string): Promise<UpdatePasswordResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
}

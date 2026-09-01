import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import type { Database } from "@/shared/types/supabase";

export async function fetchPlanTitle(
  planId: string,
  client?: SupabaseClient<Database>
): Promise<string | null> {
  const supabase = client ?? createSupabaseServerClient();
  const { data, error } = await supabase.from("plans").select("title").eq("id", planId).single();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchPlanTitle",
      identifiers: { planId },
      error,
    });
  }
  return data?.title ?? null;
}

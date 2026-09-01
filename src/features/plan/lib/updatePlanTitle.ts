"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export async function updatePlanTitle(planId: string, newTitle: string) {
  const supabase: SupabaseClient = createSupabaseServerClient();
  const { error } = await supabase.rpc("update_plan_title", {
    _plan_id: planId,
    _new_title: newTitle,
  });
  if (error) {
    throw formatSupabaseError({
      operation: "updatePlanTitle",
      identifiers: { planId },
      error,
    });
  }
}

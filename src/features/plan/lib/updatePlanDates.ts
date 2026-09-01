"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export async function updatePlanDates(planId: string, from: Date, to: Date) {
  const supabase: SupabaseClient = createSupabaseServerClient();
  const { error } = await supabase.rpc("update_plan_dates", {
    _plan_id: planId,
    _start_date: format(from, "yyyy-MM-dd"),
    _end_date: format(to, "yyyy-MM-dd"),
  });
  if (error) {
    throw formatSupabaseError({
      operation: "updatePlanDates",
      identifiers: { planId },
      error,
    });
  }
}

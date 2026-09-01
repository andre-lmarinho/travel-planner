"use server";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

// Publish/unpublish a plan. Authorized by the "Members can update editable plan fields" RLS
// policy plus the column-scoped update grant on plans.is_public.
export async function setPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("plans").update({ is_public: isPublic }).eq("id", planId);
  if (error) {
    throw formatSupabaseError({
      operation: "setPlanVisibility",
      identifiers: { planId, isPublic: String(isPublic) },
      error,
    });
  }
}

import "server-only";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export type PublicPlanSummary = {
  id: string;
  title: string;
  coverImage: string | null;
  publicSlug: string;
};

// Every plan marked public feeds the "Be inspired by fellow travelers" grids. Anon-readable via
// the "Public plans are readable" RLS policy. Curation/ordering is a later concern.
//
// This is non-critical discovery data shown on the (public) landing page: a failure must degrade
// to "no recommendations", never take down the page it renders in. So it swallows errors and
// returns an empty list instead of throwing.
export async function getPublicPlans(): Promise<PublicPlanSummary[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("plans")
      .select("id, title, cover_image, public_slug")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw formatSupabaseError({ operation: "getPublicPlans", error });
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? "Untitled trip",
      coverImage: row.cover_image,
      publicSlug: row.public_slug,
    }));
  } catch (error) {
    console.warn("getPublicPlans failed; showing no recommendations", error);
    return [];
  }
}

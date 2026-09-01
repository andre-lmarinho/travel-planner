import "server-only";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export type UserDestination = {
  name: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
};

// Each plan carries its primary destination inline. Returns one entry per plan
// that has a destination (deduped by name) — feeds both the map pins (the rows
// that also have coordinates) and the "cities · countries" dashboard stat.
export async function getUserDestinations(userId: string): Promise<UserDestination[]> {
  const supabase = createSupabaseServerClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("plan_members")
    .select("plan_id")
    .eq("user_id", userId);

  if (membershipsError) {
    throw formatSupabaseError({
      operation: "getUserDestinations memberships",
      identifiers: { userId },
      error: membershipsError,
    });
  }

  const memberPlanIds = memberships?.map((membership) => membership.plan_id) ?? [];
  const query = supabase.from("plans").select("destination_name, destination_country, latitude, longitude");
  const scopedQuery = memberPlanIds.length
    ? query.or(`user_id.eq.${userId},id.in.(${memberPlanIds.join(",")})`)
    : query.eq("user_id", userId);
  const { data, error } = await scopedQuery.not("destination_name", "is", null);

  if (error) {
    throw formatSupabaseError({ operation: "getUserDestinations", identifiers: { userId }, error });
  }

  const byName = new Map<string, UserDestination>();
  for (const row of data ?? []) {
    const name = row.destination_name?.trim();
    if (!name || byName.has(name)) continue;
    byName.set(name, {
      name,
      country: row.destination_country,
      lat: row.latitude,
      lng: row.longitude,
    });
  }

  return Array.from(byName.values());
}

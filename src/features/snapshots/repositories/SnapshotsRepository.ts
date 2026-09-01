import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import type { Database } from "@/shared/types/supabase";

type SnapshotsRepositoryOptions = {
  client?: SupabaseClient<Database>;
};

export type SnapshotRow = Database["public"]["Tables"]["plan_snapshots"]["Row"];

function getClient(client?: SupabaseClient<Database>): SupabaseClient<Database> {
  return client ?? createSupabaseServerClient();
}

export async function fetchSnapshot(
  planId: string,
  { client }: SnapshotsRepositoryOptions = {}
): Promise<SnapshotRow | null> {
  const supabase = getClient(client);
  const { data, error } = await supabase
    .from("plan_snapshots")
    .select("plan_id, version, state, updated_at")
    .eq("plan_id", planId)
    .maybeSingle();

  if (error) {
    throw formatSupabaseError({
      operation: "fetchSnapshot",
      identifiers: { planId },
      error,
    });
  }

  return data ?? null;
}

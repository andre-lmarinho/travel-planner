import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import type { Database } from "@/shared/types/supabase";

export type SnapshotRow = Database["public"]["Tables"]["plan_snapshots"]["Row"];

export class SnapshotsRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async fetchSnapshot(planId: string): Promise<SnapshotRow | null> {
    const { data, error } = await this.client
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
}

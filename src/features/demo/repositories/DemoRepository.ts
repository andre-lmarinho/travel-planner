import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatSupabaseError } from "@/lib/errors";
import type { Database } from "@/shared/types/supabase";

export class DemoRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async resetIfStale(): Promise<void> {
    const { error } = await this.client.rpc("maybe_reset_demo");

    if (error) {
      throw formatSupabaseError({ operation: "resetIfStale", error });
    }
  }
}

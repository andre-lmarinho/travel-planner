import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env/clientEnv";
import type { Database } from "@/supabase/types";

let serviceRoleClient: SupabaseClient<Database> | null = null;

export function createSupabaseServiceRoleClient(): SupabaseClient<Database> {
  const existingClient = serviceRoleClient;
  if (existingClient) {
    return existingClient;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("createSupabaseServiceRoleClient failed: missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const client = createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  serviceRoleClient = client;
  return client;
}

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env/clientEnv";
import type { Database } from "@/supabase/types";

const isE2E = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1";

type SupabaseMockModule = typeof import("../../tests/e2e/mocks/supabase");

function getE2ESupabaseClient(): SupabaseClient<Database> {
  const { getSupabaseMock } = require("../../tests/e2e/mocks/supabase") as SupabaseMockModule;
  return getSupabaseMock();
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  return isE2E
    ? getE2ESupabaseClient()
    : createBrowserClient<Database>(
        clientEnv.NEXT_PUBLIC_SUPABASE_URL,
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
}

// Maintain a shared instance for modules that do not need per-request isolation
export const supabase: SupabaseClient<Database> = createSupabaseBrowserClient();

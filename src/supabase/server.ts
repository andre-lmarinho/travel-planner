import "server-only";

import type { SetAllCookies } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { clientEnv } from "@/lib/env/clientEnv";
import type { Database } from "./types";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieBatch = Parameters<SetAllCookies>[0];

const isE2E = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1";

type SupabaseMockModule = typeof import("../../tests/e2e/mocks/supabase");

function getE2ESupabaseClient(): SupabaseClient<Database> {
  const { getSupabaseMock } = require("../../tests/e2e/mocks/supabase") as SupabaseMockModule;
  return getSupabaseMock();
}

export function createSupabaseServerClient(): SupabaseClient<Database> {
  if (isE2E) {
    return getE2ESupabaseClient();
  }

  const cookieStorePromise = cookies();

  const client = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async getAll() {
          const cookieStore: CookieStore = await cookieStorePromise;
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet: CookieBatch) {
          const cookieStore: CookieStore = await cookieStorePromise;
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Ignore cookie set failures (e.g. read-only responses during SSR).
            }
          }
        },
      },
    }
  );

  return client;
}

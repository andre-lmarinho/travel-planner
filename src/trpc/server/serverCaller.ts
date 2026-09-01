import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupabaseUser } from "@/features/auth/lib/session";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

import { buildAuthContext, createTRPCInnerContext } from "./createContext";
import { appRouter } from "./routers/_app";
import { createCallerFactory } from "./trpc";

const callerFactory = createCallerFactory(appRouter);

function buildServerContext(
  user: SupabaseUser | null,
  supabase: SupabaseClient<Database> = createSupabaseServerClient()
) {
  const auth = buildAuthContext(user);

  return createTRPCInnerContext({
    auth,
    requestMeta: {
      ip: null,
      requestId: auth ? "server-caller-authed" : "server-caller-public",
      userAgent: null,
    },
    supabase,
  });
}

export function getPublicServerCaller(supabase?: SupabaseClient<Database>) {
  return callerFactory(buildServerContext(null, supabase));
}

export function getAuthedServerCaller(user: SupabaseUser, supabase?: SupabaseClient<Database>) {
  return callerFactory(buildServerContext(user, supabase));
}

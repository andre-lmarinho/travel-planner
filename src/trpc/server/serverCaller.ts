import "server-only";

import type { SupabaseUser } from "@/shared/lib/auth/session";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { buildAuthContext, createTRPCInnerContext } from "./createContext";
import { appRouter } from "./routers/_app";
import { createCallerFactory } from "./trpc";

const callerFactory = createCallerFactory(appRouter);

function buildServerContext(user: SupabaseUser | null) {
  const auth = buildAuthContext(user);

  return createTRPCInnerContext({
    auth,
    requestMeta: {
      ip: null,
      requestId: auth ? "server-caller-authed" : "server-caller-public",
      userAgent: null,
    },
    supabase: createSupabaseServerClient(),
  });
}

export function getPublicServerCaller() {
  return callerFactory(buildServerContext(null));
}

export function getAuthedServerCaller(user: SupabaseUser) {
  return callerFactory(buildServerContext(user));
}

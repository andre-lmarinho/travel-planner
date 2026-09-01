import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getCurrentUser, type SupabaseUser } from "@/features/auth/lib/session";
import { createRequestCtx } from "@/lib/errors/requestCtx";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import type { Database } from "@/shared/types/supabase";

export type AuthContext = {
  email: string | null;
  user: SupabaseUser;
  userId: string;
};

export type TRPCRequestMeta = {
  ip: string | null;
  requestId: string;
  userAgent: string | null;
};

export type CreateTRPCInnerContextInput = {
  auth: AuthContext | null;
  requestMeta: TRPCRequestMeta;
  supabase: SupabaseClient<Database>;
};

export function buildAuthContext(user: SupabaseUser | null): AuthContext | null {
  if (!user) return null;

  return {
    email: user.email ?? null,
    user,
    userId: user.id,
  };
}

export function createTRPCInnerContext(input: CreateTRPCInnerContextInput) {
  return input;
}

export function createRequestMeta(request: Request): TRPCRequestMeta {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

  return {
    ip: ip || null,
    requestId: createRequestCtx(request.headers).requestId,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function createTRPCContext({ req }: FetchCreateContextFnOptions) {
  const supabase = createSupabaseServerClient();

  try {
    const user = await getCurrentUser(supabase);

    return createTRPCInnerContext({
      auth: buildAuthContext(user),
      requestMeta: createRequestMeta(req),
      supabase,
    });
  } catch (error) {
    const pathname = new URL(req.url).pathname;
    throw new Error(`createTRPCContext failed: method=${req.method} path=${pathname}`, {
      cause: error,
    });
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCInnerContext>>;
export type AuthedTRPCContext = TRPCContext & { auth: AuthContext };

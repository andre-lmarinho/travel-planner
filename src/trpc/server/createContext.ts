import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getViewer, type Viewer } from "@/features/auth/lib/session";
import { createRequestCtx } from "@/lib/errors/requestCtx";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Database } from "@/supabase/types";

export type TRPCRequestMeta = {
  ip: string | null;
  requestId: string;
  userAgent: string | null;
};

export type CreateTRPCInnerContextInput = {
  requestMeta: TRPCRequestMeta;
  supabase: SupabaseClient<Database>;
  viewer: Viewer | null;
};

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
    const viewer = await getViewer(supabase);

    return createTRPCInnerContext({
      requestMeta: createRequestMeta(req),
      supabase,
      viewer,
    });
  } catch (error) {
    const pathname = new URL(req.url).pathname;
    throw new Error(`createTRPCContext failed: method=${req.method} path=${pathname}`, {
      cause: error,
    });
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCInnerContext>>;
export type AuthedTRPCContext = TRPCContext & { viewer: Viewer };

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/trpc/server/createContext";
import { onErrorHandler } from "@/trpc/server/onError";
import { appRouter } from "@/trpc/server/routers/_app";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handler(request: Request) {
  return fetchRequestHandler({
    createContext: createTRPCContext,
    endpoint: "/api/trpc",
    onError: onErrorHandler,
    req: request,
    router: appRouter,
  });
}

export { handler as GET, handler as POST };

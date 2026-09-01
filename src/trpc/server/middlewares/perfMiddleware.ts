import type { tRPCContext } from "../trpc";

type MiddlewareFactory = typeof tRPCContext.middleware;

const SLOW_PROCEDURE_MS = 1000;

export function createPerfMiddleware(middleware: MiddlewareFactory) {
  return middleware(async ({ ctx, path, type, next }) => {
    const start = performance.now();
    const result = await next();
    const durationMs = Math.round(performance.now() - start);

    if (result.ok && durationMs >= SLOW_PROCEDURE_MS) {
      console.warn("trpc.procedure.slow", {
        durationMs,
        path,
        requestId: ctx.requestMeta.requestId,
        type,
      });
    }

    return result;
  });
}

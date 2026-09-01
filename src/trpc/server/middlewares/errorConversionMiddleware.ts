import { mapApplicationError } from "../lib/mapApplicationError";
import type { tRPCContext } from "../trpc";

type MiddlewareFactory = typeof tRPCContext.middleware;

export function createErrorConversionMiddleware(middleware: MiddlewareFactory) {
  return middleware(async ({ next }) => {
    try {
      const result = await next();
      if (!result.ok) {
        const mappedError = mapApplicationError(result.error);
        if (mappedError) throw mappedError;
      }

      return result;
    } catch (error) {
      const mappedError = mapApplicationError(error);
      if (mappedError) throw mappedError;

      throw error;
    }
  });
}

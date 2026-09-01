import { createErrorConversionMiddleware } from "../middlewares/errorConversionMiddleware";
import { createPerfMiddleware } from "../middlewares/perfMiddleware";
import { middleware, tRPCContext } from "../trpc";

export const publicProcedure = tRPCContext.procedure
  .use(createPerfMiddleware(middleware))
  .use(createErrorConversionMiddleware(middleware));

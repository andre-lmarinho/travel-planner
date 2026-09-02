import { TRPCError } from "@trpc/server";

import { publicProcedure } from "./publicProcedure";

export const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.viewer) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      viewer: ctx.viewer,
    },
  });
});

import { TRPCError } from "@trpc/server";

import { publicProcedure } from "./publicProcedure";

export const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth,
    },
  });
});

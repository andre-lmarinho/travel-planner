import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import type { createTRPCInnerContext } from "./createContext";
import { errorFormatter } from "./errorFormatter";

export const tRPCContext = initTRPC.context<typeof createTRPCInnerContext>().create({
  errorFormatter,
  transformer: superjson,
});

export const router = tRPCContext.router;
export const middleware = tRPCContext.middleware;
export const createCallerFactory = tRPCContext.createCallerFactory;

import { router } from "../trpc";
import { budgetRouter } from "./budget/_router";
import { publicRouter } from "./public/_router";
import { viewerRouter } from "./viewer/_router";

export const appRouter = router({
  budget: budgetRouter,
  public: publicRouter,
  viewer: viewerRouter,
});

export type AppRouter = typeof appRouter;

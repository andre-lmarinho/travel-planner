import { router } from "../trpc";
import { publicRouter } from "./public/_router";
import { viewerRouter } from "./viewer/_router";

export const appRouter = router({
  public: publicRouter,
  viewer: viewerRouter,
});

export type AppRouter = typeof appRouter;

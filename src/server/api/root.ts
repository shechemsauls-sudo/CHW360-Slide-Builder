import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { slideRouter } from "./routers/slide";

export const appRouter = createTRPCRouter({
  slide: slideRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);

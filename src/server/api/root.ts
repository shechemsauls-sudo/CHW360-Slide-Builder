import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { slideRouter } from "./routers/slide";
import { contactRouter } from "./routers/contact";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = createTRPCRouter({
  slide: slideRouter,
  contact: contactRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);

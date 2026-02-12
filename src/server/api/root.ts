import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { slideRouter } from "./routers/slide";
import { contactRouter } from "./routers/contact";
import { analyticsRouter } from "./routers/analytics";
import { usersRouter } from "./routers/users";

export const appRouter = createTRPCRouter({
  slide: slideRouter,
  contact: contactRouter,
  analytics: analyticsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);

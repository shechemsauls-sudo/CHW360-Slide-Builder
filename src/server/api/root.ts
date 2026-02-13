import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { deckRouter } from "./routers/deck";
import { contactRouter } from "./routers/contact";
import { analyticsRouter } from "./routers/analytics";
import { usersRouter } from "./routers/users";
import { crmRouter } from "./routers/crm";

export const appRouter = createTRPCRouter({
  deck: deckRouter,
  contact: contactRouter,
  analytics: analyticsRouter,
  users: usersRouter,
  crm: crmRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);

import { z } from "zod";
import { sql, count, eq, and, gte } from "drizzle-orm";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { pageViews } from "~/server/db/schema";

export const analyticsRouter = createTRPCRouter({
  trackEvent: publicProcedure
    .input(
      z.object({
        page: z.string().max(100),
        event: z.string().max(100),
        referrer: z.string().max(500).optional(),
        userAgent: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(pageViews).values({
        page: input.page,
        event: input.event,
        referrer: input.referrer,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),

  overview: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalViews] = await ctx.db
      .select({ count: count() })
      .from(pageViews)
      .where(eq(pageViews.event, "view"));

    const [todayViews] = await ctx.db
      .select({ count: count() })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.event, "view"),
          gte(pageViews.createdAt, todayStart)
        )
      );

    // Views per day (last 30 days)
    const viewsPerDay = await ctx.db
      .select({
        date: sql<string>`date(${pageViews.createdAt})`.as("date"),
        count: count(),
      })
      .from(pageViews)
      .where(
        and(
          eq(pageViews.event, "view"),
          gte(pageViews.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${pageViews.createdAt})`)
      .orderBy(sql`date(${pageViews.createdAt})`);

    return {
      totalViews: totalViews?.count ?? 0,
      todayViews: todayViews?.count ?? 0,
      viewsPerDay,
    };
  }),

  formStats: adminProcedure.query(async ({ ctx }) => {
    const [formViews] = await ctx.db
      .select({ count: count() })
      .from(pageViews)
      .where(eq(pageViews.event, "form_view"));

    const [formInteractions] = await ctx.db
      .select({ count: count() })
      .from(pageViews)
      .where(eq(pageViews.event, "form_interaction"));

    const [formSubmits] = await ctx.db
      .select({ count: count() })
      .from(pageViews)
      .where(eq(pageViews.event, "form_submit"));

    const views = formViews?.count ?? 0;
    const submits = formSubmits?.count ?? 0;

    return {
      formViews: views,
      formInteractions: formInteractions?.count ?? 0,
      formSubmits: submits,
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : "0",
    };
  }),
});

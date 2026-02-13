import { z } from "zod";
import { sql, count, eq, and, gte, desc } from "drizzle-orm";
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

  overview: adminProcedure
    .input(
      z.object({
        page: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const baseConditions = [eq(pageViews.event, "view")];
      if (input?.page) baseConditions.push(eq(pageViews.page, input.page));

      const [totalViews] = await ctx.db
        .select({ count: count() })
        .from(pageViews)
        .where(and(...baseConditions));

      const [todayViews] = await ctx.db
        .select({ count: count() })
        .from(pageViews)
        .where(and(...baseConditions, gte(pageViews.createdAt, todayStart)));

      const viewsPerDay = await ctx.db
        .select({
          date: sql<string>`date(${pageViews.createdAt})`.as("date"),
          count: count(),
        })
        .from(pageViews)
        .where(and(...baseConditions, gte(pageViews.createdAt, thirtyDaysAgo)))
        .groupBy(sql`date(${pageViews.createdAt})`)
        .orderBy(sql`date(${pageViews.createdAt})`);

      return {
        totalViews: totalViews?.count ?? 0,
        todayViews: todayViews?.count ?? 0,
        viewsPerDay,
      };
    }),

  formStats: adminProcedure
    .input(
      z.object({
        page: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const pageFilter = input?.page ? [eq(pageViews.page, input.page)] : [];

      const [formViews] = await ctx.db
        .select({ count: count() })
        .from(pageViews)
        .where(and(eq(pageViews.event, "form_view"), ...pageFilter));

      const [formInteractions] = await ctx.db
        .select({ count: count() })
        .from(pageViews)
        .where(and(eq(pageViews.event, "form_interaction"), ...pageFilter));

      const [formSubmits] = await ctx.db
        .select({ count: count() })
        .from(pageViews)
        .where(and(eq(pageViews.event, "form_submit"), ...pageFilter));

      const views = formViews?.count ?? 0;
      const submits = formSubmits?.count ?? 0;

      return {
        formViews: views,
        formInteractions: formInteractions?.count ?? 0,
        formSubmits: submits,
        conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : "0",
      };
    }),

  pages: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        page: pageViews.page,
        count: count(),
      })
      .from(pageViews)
      .where(eq(pageViews.event, "view"))
      .groupBy(pageViews.page)
      .orderBy(desc(count()));

    return rows;
  }),
});

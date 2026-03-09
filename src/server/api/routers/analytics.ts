import { z } from "zod";
import { sql, count, eq, and, gte, desc } from "drizzle-orm";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { pageViews } from "~/server/db/schema";

// Simple in-memory rate limiter for analytics events
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max events per IP+page per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000).unref();

function isRateLimited(ip: string, page: string): boolean {
  const key = `${ip}:${page}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

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
      // Rate limit: silently drop excessive events from same IP+page
      const ip =
        ctx.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (isRateLimited(ip, input.page)) {
        return { success: true };
      }

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
        days: z.number().min(1).max(365).default(30),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

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

      const rawViews = await ctx.db
        .select({
          date: sql<string>`date(${pageViews.createdAt})`.as("date"),
          count: count(),
        })
        .from(pageViews)
        .where(and(...baseConditions, gte(pageViews.createdAt, startDate)))
        .groupBy(sql`date(${pageViews.createdAt})`)
        .orderBy(sql`date(${pageViews.createdAt})`);

      // Fill in missing days with zero counts
      const viewsMap = new Map(rawViews.map((r) => [r.date, r.count]));
      const viewsPerDay: { date: string; count: number }[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        viewsPerDay.push({ date: key, count: viewsMap.get(key) ?? 0 });
      }

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

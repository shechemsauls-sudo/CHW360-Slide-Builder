import { z } from "zod";
import { desc, eq, count } from "drizzle-orm";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { contactSubmissions } from "~/server/db/schema";
import { sendContactNotification } from "~/lib/resend";

export const contactRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        organization: z.string().max(200).optional(),
        message: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [submission] = await ctx.db
        .insert(contactSubmissions)
        .values({
          name: input.name,
          email: input.email,
          organization: input.organization,
          message: input.message,
        })
        .returning();

      // Fire email notification (don't block response on failure)
      if (process.env.RESEND_API_KEY) {
        sendContactNotification(input).catch(console.error);
      }

      return { success: true, id: submission?.id };
    }),

  list: protectedProcedure
    .input(
      z.object({
        filter: z.enum(["all", "read", "unread"]).default("all"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.filter === "read") conditions.push(eq(contactSubmissions.isRead, true));
      if (input.filter === "unread") conditions.push(eq(contactSubmissions.isRead, false));

      const where = conditions.length > 0 ? conditions[0] : undefined;

      const [items, [total]] = await Promise.all([
        ctx.db
          .select()
          .from(contactSubmissions)
          .where(where)
          .orderBy(desc(contactSubmissions.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({ count: count() })
          .from(contactSubmissions)
          .where(where),
      ]);

      return { items, total: total?.count ?? 0 };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid(), isRead: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(contactSubmissions)
        .set({ isRead: input.isRead })
        .where(eq(contactSubmissions.id, input.id));
      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [totalResult] = await ctx.db
      .select({ count: count() })
      .from(contactSubmissions);

    const [unreadResult] = await ctx.db
      .select({ count: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.isRead, false));

    return {
      total: totalResult?.count ?? 0,
      unread: unreadResult?.count ?? 0,
    };
  }),

  recent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt))
        .limit(input.limit);
    }),
});

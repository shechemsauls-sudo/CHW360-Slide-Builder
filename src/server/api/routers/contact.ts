import { z } from "zod";
import { desc, eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { contactSubmissions, crmContacts, profiles } from "~/server/db/schema";
import { sendContactNotification } from "~/lib/resend";

export const contactRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        organization: z.string().max(200).optional(),
        message: z.string().min(1).max(5000),
        source: z.string().max(200).optional(),
        lang: z.enum(["en", "es"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const submissionSource = input.source ?? "Contact Form · Landing Page";

      // Upsert CRM contact (dedup by email)
      const [existing] = await ctx.db
        .select({ id: crmContacts.id })
        .from(crmContacts)
        .where(eq(crmContacts.email, input.email))
        .limit(1);

      let crmContactId: string;

      if (existing) {
        await ctx.db
          .update(crmContacts)
          .set({
            name: input.name,
            organization: input.organization ?? undefined,
            lastContactAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(crmContacts.id, existing.id));
        crmContactId = existing.id;
      } else {
        const [newContact] = await ctx.db
          .insert(crmContacts)
          .values({
            email: input.email,
            name: input.name,
            organization: input.organization,
            source: submissionSource,
            firstContactAt: new Date(),
            lastContactAt: new Date(),
          })
          .returning({ id: crmContacts.id });
        if (!newContact) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create CRM contact record.",
          });
        }
        crmContactId = newContact.id;
      }

      const [submission] = await ctx.db
        .insert(contactSubmissions)
        .values({
          name: input.name,
          email: input.email,
          organization: input.organization,
          message: input.message,
          source: submissionSource,
          crmContactId,
        })
        .returning();

      // Send email notification (awaited so Vercel doesn't kill the process)
      try {
        const admins = await ctx.db
          .select({ email: profiles.email })
          .from(profiles)
          .where(eq(profiles.role, "admin"));
        const adminEmails = admins.map((a) => a.email);
        await sendContactNotification(input, adminEmails);
      } catch (err) {
        console.error("Failed to send contact notification:", err);
      }

      return { success: true, id: submission?.id };
    }),

  list: adminProcedure
    .input(
      z.object({
        filter: z.enum(["all", "read", "unread"]).default("all"),
        source: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.filter === "read") conditions.push(eq(contactSubmissions.isRead, true));
      if (input.filter === "unread") conditions.push(eq(contactSubmissions.isRead, false));
      if (input.source) conditions.push(eq(contactSubmissions.source, input.source));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

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

  markRead: adminProcedure
    .input(z.object({ id: z.string().uuid(), isRead: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(contactSubmissions)
        .set({ isRead: input.isRead })
        .where(eq(contactSubmissions.id, input.id));
      return { success: true };
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
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

  recent: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt))
        .limit(input.limit);
    }),

  sources: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        source: contactSubmissions.source,
        count: count(),
      })
      .from(contactSubmissions)
      .groupBy(contactSubmissions.source)
      .orderBy(desc(count()));

    return rows;
  }),
});

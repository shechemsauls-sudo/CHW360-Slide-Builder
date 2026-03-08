import { z } from "zod";
import { desc, eq, ilike, or, count, sql, getTableName } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { crmContacts, contactSubmissions } from "~/server/db/schema";
import { sendCustomEmail } from "~/lib/resend";

export const crmRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            ilike(crmContacts.name, term),
            ilike(crmContacts.email, term),
          )!
        );
      }

      if (input.source) {
        conditions.push(eq(crmContacts.source, input.source));
      }

      const where =
        conditions.length === 1
          ? conditions[0]
          : conditions.length > 1
            ? sql`${conditions[0]} AND ${conditions[1]}`
            : undefined;

      const [items, [total]] = await Promise.all([
        ctx.db
          .select({
            id: crmContacts.id,
            email: crmContacts.email,
            name: crmContacts.name,
            phone: crmContacts.phone,
            organization: crmContacts.organization,
            source: crmContacts.source,
            notes: crmContacts.notes,
            firstContactAt: crmContacts.firstContactAt,
            lastContactAt: crmContacts.lastContactAt,
            submissionCount: sql<number>`(
              SELECT COUNT(*) FROM ${sql.identifier(getTableName(contactSubmissions))}
              WHERE crm_contact_id = ${crmContacts.id}
            )`.as("submission_count"),
          })
          .from(crmContacts)
          .where(where)
          .orderBy(desc(crmContacts.lastContactAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({ count: count() })
          .from(crmContacts)
          .where(where),
      ]);

      return { items, total: total?.count ?? 0 };
    }),

  getContact: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [contact] = await ctx.db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, input.id))
        .limit(1);

      if (!contact) return null;

      const submissions = await ctx.db
        .select()
        .from(contactSubmissions)
        .where(eq(contactSubmissions.crmContactId, input.id))
        .orderBy(desc(contactSubmissions.createdAt));

      return { ...contact, submissions };
    }),

  sources: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        source: crmContacts.source,
        count: count(),
      })
      .from(crmContacts)
      .groupBy(crmContacts.source)
      .orderBy(desc(count()));

    return rows;
  }),

  updateNotes: adminProcedure
    .input(z.object({ id: z.string().uuid(), notes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(crmContacts)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(crmContacts.id, input.id));
      return { success: true };
    }),

  sendEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1).max(500),
        htmlBody: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendCustomEmail(input.to, input.subject, input.htmlBody);
      } catch (err) {
        console.error("Failed to send CRM email:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email. Please try again.",
        });
      }
      return { success: true };
    }),
});

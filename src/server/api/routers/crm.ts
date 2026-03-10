import { z } from "zod";
import { asc, desc, eq, ilike, or, count, sql, getTableName, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { crmContacts, contactSubmissions, crmNotes } from "~/server/db/schema";
import { sendCustomEmail } from "~/lib/resend";

// --- HTML sanitizer for CRM notes ---
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "s", "h2",
  "ul", "ol", "li", "blockquote", "code",
]);

const DANGEROUS_TAG_RE =
  /<\/?\s*(script|iframe|object|embed|form|style|link|meta|base)\b[^>]*>/gi;
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi;

/** Strip dangerous tags, event handlers, and disallowed tags from HTML */
function sanitizeHtml(html: string): string {
  let clean = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  clean = clean.replace(DANGEROUS_TAG_RE, "");
  clean = clean.replace(EVENT_HANDLER_RE, "");

  // Remove tags not in the allow-list (keep their inner content)
  clean = clean.replace(TAG_RE, (match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : "";
  });

  return clean;
}

export const crmRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        hasOrg: z.boolean().optional(),
        sortBy: z.enum(["lastContact", "name", "firstContact", "submissions"]).default("lastContact"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
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

      if (input.hasOrg === true) {
        conditions.push(sql`${crmContacts.organization} IS NOT NULL AND ${crmContacts.organization} != ''`);
      } else if (input.hasOrg === false) {
        conditions.push(sql`(${crmContacts.organization} IS NULL OR ${crmContacts.organization} = '')`);
      }

      const where =
        conditions.length === 1
          ? conditions[0]
          : conditions.length > 1
            ? sql`${sql.join(conditions, sql` AND `)}`
            : undefined;

      const dir = input.sortDir === "asc" ? asc : desc;
      const submissionCountSql = sql<number>`(
        SELECT COUNT(*) FROM ${sql.identifier(getTableName(contactSubmissions))}
        WHERE crm_contact_id = ${crmContacts.id}
      )`;

      const sortColumn =
        input.sortBy === "name" ? crmContacts.name
        : input.sortBy === "firstContact" ? crmContacts.firstContactAt
        : input.sortBy === "submissions" ? submissionCountSql
        : crmContacts.lastContactAt;

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
            submissionCount: submissionCountSql.as("submission_count"),
          })
          .from(crmContacts)
          .where(where)
          .orderBy(dir(sortColumn))
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

      const [submissions, notes] = await Promise.all([
        ctx.db
          .select()
          .from(contactSubmissions)
          .where(eq(contactSubmissions.crmContactId, input.id))
          .orderBy(desc(contactSubmissions.createdAt))
          .limit(50),
        ctx.db
          .select()
          .from(crmNotes)
          .where(eq(crmNotes.contactId, input.id))
          .orderBy(desc(crmNotes.createdAt))
          .limit(50),
      ]);

      return { ...contact, submissions, notes };
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

  addNote: adminProcedure
    .input(z.object({ contactId: z.string().uuid(), content: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const safeContent = sanitizeHtml(input.content);
      const [note] = await ctx.db
        .insert(crmNotes)
        .values({ contactId: input.contactId, content: safeContent })
        .returning();
      return note;
    }),

  deleteNote: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(crmNotes).where(eq(crmNotes.id, input.id));
      return { success: true };
    }),

  sendEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1).max(500).refine(
          (s) => !/[\r\n\x00-\x1f]/.test(s),
          { message: "Subject must not contain newlines or control characters" },
        ),
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

  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // Notes cascade-delete, submissions set crmContactId=null via DB FK constraints
      await ctx.db.delete(crmContacts).where(inArray(crmContacts.id, input.ids));
      return { success: true, count: input.ids.length };
    }),

  exportCsv: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        name: crmContacts.name,
        email: crmContacts.email,
        phone: crmContacts.phone,
        organization: crmContacts.organization,
        source: crmContacts.source,
        firstContactAt: crmContacts.firstContactAt,
        lastContactAt: crmContacts.lastContactAt,
      })
      .from(crmContacts)
      .orderBy(desc(crmContacts.lastContactAt));
    return rows;
  }),
});

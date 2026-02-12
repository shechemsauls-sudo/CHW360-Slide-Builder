import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { slides, profiles } from "~/server/db/schema";
import type { db as dbInstance } from "~/server/db";

async function getProfileId(db: typeof dbInstance, authUserId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.authId, authUserId),
    columns: { id: true },
  });
  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
  }
  return profile.id;
}

export const slideRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.slides.findMany({
      orderBy: (slides, { desc }) => [desc(slides.createdAt)],
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.slides.findFirst({
        where: eq(slides.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const [slide] = await ctx.db
        .insert(slides)
        .values({
          profileId,
          title: input.title,
          content: input.content,
        })
        .returning();
      return slide;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const { id, ...data } = input;
      const [slide] = await ctx.db
        .update(slides)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(slides.id, id), eq(slides.profileId, profileId)))
        .returning();
      if (!slide) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found or not owned by you" });
      }
      return slide;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const result = await ctx.db
        .delete(slides)
        .where(and(eq(slides.id, input.id), eq(slides.profileId, profileId)))
        .returning({ id: slides.id });
      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found or not owned by you" });
      }
      return { success: true };
    }),
});

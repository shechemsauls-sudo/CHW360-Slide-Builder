import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { slides } from "~/server/db/schema";

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
      const [slide] = await ctx.db
        .insert(slides)
        .values({
          profileId: ctx.user.id,
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
      const { id, ...data } = input;
      const [slide] = await ctx.db
        .update(slides)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(slides.id, id))
        .returning();
      return slide;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(slides).where(eq(slides.id, input.id));
      return { success: true };
    }),
});

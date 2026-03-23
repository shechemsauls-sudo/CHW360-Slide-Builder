import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { profiles } from "~/server/db/schema";

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
      })
      .from(profiles)
      .where(eq(profiles.authId, ctx.user.id))
      .limit(1);

    return profile ?? null;
  }),

  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(profiles)
        .set({
          displayName: input.displayName,
          updatedAt: new Date(),
        })
        .where(eq(profiles.authId, ctx.user.id))
        .returning({ id: profiles.id, displayName: profiles.displayName });

      return updated;
    }),
});

import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { profiles } from "~/server/db/schema";
import { supabaseAdmin } from "~/lib/supabase/admin";
import { sendClaimEmail } from "~/lib/resend";

export const usersRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt));
  }),

  invite: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["user", "admin"]).default("user"),
        sendEmail: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if profile already exists for this email
      const [existing] = await ctx.db
        .select()
        .from(profiles)
        .where(eq(profiles.email, input.email))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Create auth user via service role
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
      });

      if (authError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: authError.message,
        });
      }

      // Create profile row
      const [profile] = await ctx.db
        .insert(profiles)
        .values({
          authId: authUser.user.id,
          email: input.email,
          role: input.role,
        })
        .returning();

      // Optionally send claim email with magic link
      if (input.sendEmail) {
        try {
          const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email: input.email,
            });

          if (!linkError && linkData?.properties?.action_link) {
            await sendClaimEmail(input.email, linkData.properties.action_link);
          }
        } catch {
          // Email send failure shouldn't fail the invite
          console.error("Failed to send claim email");
        }
      }

      return { success: true, profile };
    }),

  sendClaimEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: input.email,
        });

      if (linkError || !linkData?.properties?.action_link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: linkError?.message ?? "Failed to generate magic link",
        });
      }

      await sendClaimEmail(input.email, linkData.properties.action_link);
      return { success: true };
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        profileId: z.string().uuid(),
        role: z.enum(["user", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(profiles)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(profiles.id, input.profileId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      return { success: true, profile: updated };
    }),
});

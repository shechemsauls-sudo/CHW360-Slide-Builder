import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { profiles } from "~/server/db/schema";
import { supabaseAdmin } from "~/lib/supabase/admin";
import { sendClaimEmail } from "~/lib/resend";

function buildClaimLink(hashedToken: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  // Route directly to our callback with token_hash — bypasses Supabase's verify
  // endpoint so PKCE code_verifier isn't needed (admin-generated links have none)
  const url = new URL(`${baseUrl}/callback`);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", "/set-password");
  return url.toString();
}

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

          if (!linkError && linkData?.properties?.hashed_token) {
            await sendClaimEmail(input.email, buildClaimLink(linkData.properties.hashed_token));
          } else {
            console.error("Failed to generate magic link:", linkError?.message ?? "No hashed_token returned");
          }
        } catch (err) {
          // Email send failure shouldn't fail the invite
          console.error("Failed to send claim email:", err);
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

      if (linkError || !linkData?.properties?.hashed_token) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: linkError?.message ?? "Failed to generate magic link",
        });
      }

      await sendClaimEmail(input.email, buildClaimLink(linkData.properties.hashed_token));
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

  delete: adminProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Look up the profile
      const [profile] = await ctx.db
        .select()
        .from(profiles)
        .where(eq(profiles.id, input.profileId))
        .limit(1);

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }

      // Prevent self-deletion
      if (profile.authId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own account",
        });
      }

      // Delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        profile.authId,
      );

      if (authError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: authError.message,
        });
      }

      // Delete profile (cascades to decks, provider_preferences)
      await ctx.db.delete(profiles).where(eq(profiles.id, input.profileId));

      return { success: true };
    }),
});

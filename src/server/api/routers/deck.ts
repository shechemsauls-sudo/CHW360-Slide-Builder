import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { decks, profiles, providerPreferences } from "~/server/db/schema";
import { getLLMProvider, getAvailableLLMProviders } from "~/lib/ai/llm";
import { getImageProvider, getAvailableImageProviders } from "~/lib/ai/image";
import { detectFidelity } from "~/lib/ai/fidelity";
import { parseContent, detectFormat } from "~/lib/parsers";
import { VISUAL_BLOCK_TYPES } from "~/lib/ai/types";
import type { SlideData, VisualBlockType } from "~/lib/ai/types";
import type { db as dbInstance } from "~/server/db";
import {
  uploadSlideImage,
  deleteDeckImages,
} from "~/lib/storage/upload-image";

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

const slideDataSchema = z.object({
  id: z.string(),
  order: z.number(),
  type: z.enum([
    "title", "section", "content", "bullets", "comparison",
    "image", "activity", "quote", "closing",
  ]),
  title: z.string(),
  body: z.string(),
  speakerNotes: z.string(),
  imageUrl: z.string().nullable(),
  imagePrompt: z.string().nullable(),
  layout: z.enum(["full", "split-left", "split-right", "centered", "two-column"]),
});

export const deckRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const profileId = await getProfileId(ctx.db, ctx.user.id);
    return ctx.db
      .select({
        id: decks.id,
        title: decks.title,
        description: decks.description,
        themeId: decks.themeId,
        status: decks.status,
        slideCount: decks.slideCount,
        llmProvider: decks.llmProvider,
        createdAt: decks.createdAt,
        updatedAt: decks.updatedAt,
      })
      .from(decks)
      .where(eq(decks.profileId, profileId))
      .orderBy(desc(decks.updatedAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.id), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }
      return deck;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        themeId: z.string().default("chw-teal"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const [deck] = await ctx.db
        .insert(decks)
        .values({
          profileId,
          title: input.title,
          description: input.description,
          themeId: input.themeId,
        })
        .returning();
      return deck;
    }),

  generate: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        content: z.string().min(1),
        sourceFormat: z.enum(["markdown", "plaintext", "pdf", "docx"]).default("plaintext"),
        llmProvider: z.enum(["openai", "anthropic"]).default("openai"),
        imageProvider: z.enum(["dalle3", "gpt-image-1", "disabled"]).default("disabled"),
        themeId: z.string().default("chw-teal"),
        slideCount: z.number().min(5).max(120).optional(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);

      // Create deck in "generating" status
      const [deck] = await ctx.db
        .insert(decks)
        .values({
          profileId,
          title: input.title,
          description: input.description,
          sourceContent: input.content,
          sourceFormat: input.sourceFormat,
          themeId: input.themeId,
          llmProvider: input.llmProvider,
          imageProvider: input.imageProvider,
          status: "generating",
        })
        .returning();

      if (!deck) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Content is always text by this point — PDF/DOCX are pre-parsed by parseFile.
        // Only markdown needs further processing (strip HTML tags).
        const parsedContent =
          input.sourceFormat === "markdown"
            ? await parseContent(input.content, "markdown")
            : input.content;

        // Generate slides via LLM
        const provider = getLLMProvider(input.llmProvider);
        const result = await provider.generateSlides({
          content: parsedContent,
          title: input.title,
          description: input.description,
          slideCount: input.slideCount,
          fidelity: input.fidelity,
          selectedBlocks: input.selectedBlocks as VisualBlockType[] | undefined,
        });

        // Update deck with generated slides
        const [updated] = await ctx.db
          .update(decks)
          .set({
            slides: result.slides,
            slideCount: result.slides.length,
            status: "ready",
            generationLog: {
              model: result.model,
              tokensUsed: result.tokensUsed,
              generatedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(decks.id, deck.id))
          .returning();

        return updated;
      } catch (error) {
        // Mark deck as error
        await ctx.db
          .update(decks)
          .set({
            status: "error",
            generationLog: {
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(decks.id, deck.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Generation failed",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        themeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const { id, ...data } = input;
      const [deck] = await ctx.db
        .update(decks)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(decks.id, id), eq(decks.profileId, profileId)))
        .returning();
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }
      return deck;
    }),

  updateSlide: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slide: slideDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }

      const currentSlides = (deck.slides ?? []) as SlideData[];
      const slideIndex = currentSlides.findIndex((s) => s.id === input.slide.id);
      if (slideIndex === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      currentSlides[slideIndex] = input.slide;

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: currentSlides, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  generateSlideImage: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
        imagePrompt: z.string().optional(),
        imageProvider: z.enum(["dalle3", "gpt-image-1"]).default("dalle3"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }

      const currentSlides = (deck.slides ?? []) as SlideData[];
      const slideIndex = currentSlides.findIndex((s) => s.id === input.slideId);
      if (slideIndex === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      const slide = currentSlides[slideIndex]!;
      const prompt = input.imagePrompt ?? slide.imagePrompt;
      if (!prompt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No image prompt available" });
      }

      // Generate image
      const provider = getImageProvider(input.imageProvider);
      const buffer = await provider.generateImage(prompt);

      // Upload to storage
      const contentType = input.imageProvider === "gpt-image-1" ? "image/webp" : "image/png";
      const imageUrl = await uploadSlideImage(input.deckId, input.slideId, buffer, contentType);

      // Update slide with image URL and prompt
      currentSlides[slideIndex] = {
        ...slide,
        imageUrl,
        imagePrompt: prompt,
      };

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: currentSlides, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  generateImages: protectedProcedure
    .input(z.object({ deckId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }

      const slides = (deck.slides ?? []) as SlideData[];
      const slideIds = slides
        .filter((s) => s.imagePrompt && !s.imageUrl)
        .map((s) => s.id);

      return { slideIds };
    }),

  regenerateSlide: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
        feedback: z.string().min(1),
        llmProvider: z.enum(["openai", "anthropic"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }

      const currentSlides = (deck.slides ?? []) as SlideData[];
      const slideIndex = currentSlides.findIndex((s) => s.id === input.slideId);
      if (slideIndex === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      const slide = currentSlides[slideIndex]!;
      const prevSlide = slideIndex > 0 ? currentSlides[slideIndex - 1] : undefined;
      const nextSlide = slideIndex < currentSlides.length - 1 ? currentSlides[slideIndex + 1] : undefined;

      const llmId = input.llmProvider ?? deck.llmProvider ?? "openai";
      const provider = getLLMProvider(llmId);
      const regenerated = await provider.regenerateSlide({
        slide,
        feedback: input.feedback,
        context: {
          prevSlide,
          nextSlide,
          deckTitle: deck.title,
        },
      });

      // Preserve existing imageUrl from the original slide
      currentSlides[slideIndex] = {
        ...regenerated,
        id: slide.id,
        order: slide.order,
        imageUrl: slide.imageUrl,
      };

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: currentSlides, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  regenerate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        llmProvider: z.enum(["openai", "anthropic"]).optional(),
        slideCount: z.number().min(5).max(120).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.id), eq(decks.profileId, profileId)),
      });
      if (!deck) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }
      if (!deck.sourceContent) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No source content to regenerate from" });
      }

      // Mark as generating
      await ctx.db
        .update(decks)
        .set({ status: "generating", updatedAt: new Date() })
        .where(eq(decks.id, deck.id));

      try {
        const parsedContent =
          deck.sourceFormat === "markdown"
            ? await parseContent(deck.sourceContent, "markdown")
            : deck.sourceContent;

        const llmId = input.llmProvider ?? deck.llmProvider ?? "openai";
        const provider = getLLMProvider(llmId);
        const result = await provider.generateSlides({
          content: parsedContent,
          title: deck.title,
          description: deck.description ?? undefined,
          slideCount: input.slideCount ?? deck.slideCount ?? 20,
          fidelity: input.fidelity,
          selectedBlocks: input.selectedBlocks as VisualBlockType[] | undefined,
        });

        const [updated] = await ctx.db
          .update(decks)
          .set({
            slides: result.slides,
            slideCount: result.slides.length,
            llmProvider: llmId,
            status: "ready",
            generationLog: {
              model: result.model,
              tokensUsed: result.tokensUsed,
              generatedAt: new Date().toISOString(),
              fidelity: input.fidelity ?? "balanced",
            },
            updatedAt: new Date(),
          })
          .where(eq(decks.id, deck.id))
          .returning();

        return updated;
      } catch (error) {
        await ctx.db
          .update(decks)
          .set({
            status: "error",
            generationLog: {
              error: error instanceof Error ? error.message : "Unknown error",
              failedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(decks.id, deck.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Regeneration failed",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const result = await ctx.db
        .delete(decks)
        .where(and(eq(decks.id, input.id), eq(decks.profileId, profileId)))
        .returning({ id: decks.id });
      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });
      }

      // Clean up storage images
      await deleteDeckImages(input.id).catch(() => {
        // Non-fatal — deck is already deleted from DB
      });

      return { success: true };
    }),

  parseFile: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const format = detectFormat(input.filename);
      if (format !== "pdf" && format !== "docx") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only PDF and DOCX files are supported for upload",
        });
      }
      const text = await parseContent(input.base64, format);
      return { text, format };
    }),

  detectFidelity: protectedProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(({ input }) => {
      return detectFidelity(input.content);
    }),

  providers: protectedProcedure.query(() => {
    return {
      llm: getAvailableLLMProviders(),
      image: getAvailableImageProviders(),
    };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const profileId = await getProfileId(ctx.db, ctx.user.id);
    const prefs = await ctx.db.query.providerPreferences.findFirst({
      where: eq(providerPreferences.profileId, profileId),
    });
    return prefs ?? { llmProvider: "openai", imageProvider: "dalle3", fidelity: "balanced" };
  }),

  setPreferences: protectedProcedure
    .input(
      z.object({
        llmProvider: z.string(),
        imageProvider: z.string(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);

      // Upsert preferences
      const existing = await ctx.db.query.providerPreferences.findFirst({
        where: eq(providerPreferences.profileId, profileId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(providerPreferences)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(providerPreferences.profileId, profileId))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(providerPreferences)
        .values({ profileId, ...input })
        .returning();
      return created;
    }),
});

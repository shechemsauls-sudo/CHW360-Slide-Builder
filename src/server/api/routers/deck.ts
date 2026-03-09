import { z } from "zod";
import { eq, and, desc, asc, ilike, inArray, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { decks, deckGroups, profiles, providerPreferences } from "~/server/db/schema";
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
import { sendDeckReadyEmail } from "~/lib/resend";
import { IMAGE_STYLE_DIRECTIVE, enhanceImagePrompt } from "~/lib/ai/image/style-prompt";
import { searchYouTube } from "~/lib/youtube";

/** Post-process: tag any References slides the LLM missed tagging, strip imagePrompt */
function tagReferenceSlides(slides: SlideData[]): SlideData[] {
  return slides.map((slide) => {
    const isRef =
      slide.type === "references" ||
      (slide.title.toLowerCase().includes("reference") && slide.type !== "title");
    if (!isRef) return slide;
    return { ...slide, type: "references", imagePrompt: null, imageUrl: null, layout: "full" };
  });
}

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
    "image", "activity", "quote", "closing", "references",
  ]),
  title: z.string(),
  body: z.string(),
  speakerNotes: z.string(),
  imageUrl: z.string().nullable(),
  imagePrompt: z.string().nullable(),
  imageFocalPoint: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  layout: z.enum(["full", "split-left", "split-right", "centered", "two-column", "image-full", "image-top"]),
});

export const deckRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "generating", "ready", "error"]).optional(),
        groupId: z.string().uuid().nullable().optional(),
        sortBy: z.enum(["title", "createdAt", "updatedAt", "slideCount", "status"]).default("updatedAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(100).default(25),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const { search, status, groupId, sortBy = "updatedAt", sortDir = "desc", page = 1, pageSize = 25 } = input ?? {};

      // Build conditions
      const conditions = [eq(decks.profileId, profileId)];
      if (search) conditions.push(ilike(decks.title, `%${search}%`));
      if (status) conditions.push(eq(decks.status, status));
      if (groupId !== undefined) {
        if (groupId === null) {
          conditions.push(sql`${decks.groupId} IS NULL`);
        } else {
          conditions.push(eq(decks.groupId, groupId));
        }
      }

      const where = and(...conditions);

      // Sort
      const sortColumn = {
        title: decks.title,
        createdAt: decks.createdAt,
        updatedAt: decks.updatedAt,
        slideCount: decks.slideCount,
        status: decks.status,
      }[sortBy] ?? decks.updatedAt;
      const orderFn = sortDir === "asc" ? asc : desc;

      // Count
      const [countResult] = await ctx.db
        .select({ total: count() })
        .from(decks)
        .where(where);

      // Fetch page
      const items = await ctx.db
        .select({
          id: decks.id,
          title: decks.title,
          description: decks.description,
          themeId: decks.themeId,
          status: decks.status,
          slideCount: decks.slideCount,
          llmProvider: decks.llmProvider,
          groupId: decks.groupId,
          createdAt: decks.createdAt,
          updatedAt: decks.updatedAt,
        })
        .from(decks)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return {
        items,
        total: countResult?.total ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((countResult?.total ?? 0) / pageSize),
      };
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
        llmProvider: z.enum(["openai", "anthropic", "xai"]).default("anthropic"),
        imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "disabled"]).default("gpt-image-1"),
        themeId: z.string().default("chw-teal"),
        slideCount: z.number().min(5).max(120).optional(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
        customInstructions: z.string().max(500).optional(),
        tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
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
          customInstructions: input.customInstructions,
          tone: input.tone,
        });

        // Post-process: tag References slides, strip their images
        const processedSlides = tagReferenceSlides(result.slides);
        const contentSlideCount = processedSlides.filter((s) => s.type !== "references").length;

        // Update deck with generated slides
        const [updated] = await ctx.db
          .update(decks)
          .set({
            slides: processedSlides,
            slideCount: contentSlideCount,
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

        // Email notification (non-blocking)
        const userEmail = ctx.user.email;
        if (userEmail) {
          sendDeckReadyEmail(userEmail, input.title, deck.id, "ready").catch(() => {});
        }

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

        // Email notification (non-blocking)
        const userEmail = ctx.user.email;
        if (userEmail) {
          sendDeckReadyEmail(userEmail, input.title, deck.id, "error", error instanceof Error ? error.message : undefined).catch(() => {});
        }

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

  deleteSlide: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
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
      const filtered = currentSlides.filter((s) => s.id !== input.slideId);
      if (filtered.length === currentSlides.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      // Re-number order fields
      const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: reordered, slideCount: reordered.length, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  duplicateSlide: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
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

      const original = currentSlides[slideIndex]!;
      const duplicate: SlideData = {
        ...original,
        id: crypto.randomUUID(),
        imageUrl: null, // Don't copy generated images
      };

      // Insert after original
      const newSlides = [
        ...currentSlides.slice(0, slideIndex + 1),
        duplicate,
        ...currentSlides.slice(slideIndex + 1),
      ].map((s, i) => ({ ...s, order: i + 1 }));

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: newSlides, slideCount: newSlides.length, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  reorderSlides: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideIds: z.array(z.string()),
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
      const slideMap = new Map(currentSlides.map((s) => [s.id, s]));

      // Build reordered array from provided ID order
      const reordered: SlideData[] = [];
      for (const id of input.slideIds) {
        const slide = slideMap.get(id);
        if (!slide) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Slide ${id} not found` });
        }
        reordered.push({ ...slide, order: reordered.length + 1 });
      }

      if (reordered.length !== currentSlides.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Slide ID count mismatch" });
      }

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: reordered, updatedAt: new Date() })
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
        imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo"]).default("gpt-image-1"),
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

      // Generate image with brand style prefix
      const provider = getImageProvider(input.imageProvider);
      const buffer = await provider.generateImage(enhanceImagePrompt(prompt));

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

  generateImagePrompt: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
        llmProvider: z.enum(["openai", "anthropic", "xai"]).optional(),
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
      const llmId = input.llmProvider ?? deck.llmProvider ?? "openai";
      const provider = getLLMProvider(llmId);

      // Use a lightweight prompt to generate an image description from slide content
      const prompt = `Generate a concise image prompt (1-2 sentences) for an AI image generator.

REQUIRED STYLE: ${IMAGE_STYLE_DIRECTIVE}

The image should be warm, brightly lit, and optimistic. Never dark or dramatic. No text in the image.

Slide title: ${slide.title}
Slide content: ${slide.body.slice(0, 500)}

Respond with ONLY the image prompt, no explanation.`;

      const result = await provider.chat(prompt);
      const imagePrompt = result.trim();

      currentSlides[slideIndex] = { ...slide, imagePrompt };

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: currentSlides, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  regenerateSlide: protectedProcedure
    .input(
      z.object({
        deckId: z.string().uuid(),
        slideId: z.string(),
        feedback: z.string().min(1),
        llmProvider: z.enum(["openai", "anthropic", "xai"]).optional(),
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
        llmProvider: z.enum(["openai", "anthropic", "xai"]).optional(),
        imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "disabled"]).optional(),
        slideCount: z.number().min(5).max(120).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
        customInstructions: z.string().max(500).optional(),
        tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
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
          customInstructions: input.customInstructions,
          tone: input.tone,
        });

        // Post-process: tag References slides
        const processedSlides = tagReferenceSlides(result.slides);
        const contentSlideCount = processedSlides.filter((s) => s.type !== "references").length;

        const [updated] = await ctx.db
          .update(decks)
          .set({
            slides: processedSlides,
            slideCount: contentSlideCount,
            llmProvider: llmId,
            imageProvider: input.imageProvider ?? deck.imageProvider ?? "gpt-image-1",
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

        // Email notification (non-blocking)
        const userEmail = ctx.user.email;
        if (userEmail) {
          sendDeckReadyEmail(userEmail, deck.title, deck.id, "ready").catch(() => {});
        }

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

        // Email notification (non-blocking)
        const userEmail = ctx.user.email;
        if (userEmail) {
          sendDeckReadyEmail(userEmail, deck.title, deck.id, "error", error instanceof Error ? error.message : undefined).catch(() => {});
        }

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
    return prefs ?? { llmProvider: "anthropic", imageProvider: "gpt-image-1", fidelity: "balanced", customInstructions: "", tone: "professional" };
  }),

  setPreferences: protectedProcedure
    .input(
      z.object({
        llmProvider: z.string(),
        imageProvider: z.string(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        customInstructions: z.string().max(500).optional(),
        tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
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

  // --- Deck Groups ---

  listGroups: protectedProcedure.query(async ({ ctx }) => {
    const profileId = await getProfileId(ctx.db, ctx.user.id);

    const groups = await ctx.db
      .select({
        id: deckGroups.id,
        name: deckGroups.name,
        themeId: deckGroups.themeId,
        sortOrder: deckGroups.sortOrder,
        deckCount: count(decks.id),
        createdAt: deckGroups.createdAt,
      })
      .from(deckGroups)
      .leftJoin(decks, eq(decks.groupId, deckGroups.id))
      .where(eq(deckGroups.profileId, profileId))
      .groupBy(deckGroups.id)
      .orderBy(asc(deckGroups.sortOrder), asc(deckGroups.name));

    return groups;
  }),

  createGroup: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      themeId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const [group] = await ctx.db
        .insert(deckGroups)
        .values({ profileId, name: input.name, themeId: input.themeId })
        .returning();
      return group;
    }),

  updateGroup: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      themeId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const { id, ...data } = input;
      const [group] = await ctx.db
        .update(deckGroups)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(deckGroups.id, id), eq(deckGroups.profileId, profileId)))
        .returning();
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      return group;
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const result = await ctx.db
        .delete(deckGroups)
        .where(and(eq(deckGroups.id, input.id), eq(deckGroups.profileId, profileId)))
        .returning({ id: deckGroups.id });
      if (result.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      return { success: true };
    }),

  assignDecksToGroup: protectedProcedure
    .input(z.object({
      deckIds: z.array(z.string().uuid()).min(1),
      groupId: z.string().uuid().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      // Verify group ownership if assigning to a group
      if (input.groupId) {
        const group = await ctx.db.query.deckGroups.findFirst({
          where: and(eq(deckGroups.id, input.groupId), eq(deckGroups.profileId, profileId)),
        });
        if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }
      await ctx.db
        .update(decks)
        .set({ groupId: input.groupId, updatedAt: new Date() })
        .where(and(
          inArray(decks.id, input.deckIds),
          eq(decks.profileId, profileId),
        ));
      return { success: true };
    }),

  applyGroupTheme: protectedProcedure
    .input(z.object({ groupId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const group = await ctx.db.query.deckGroups.findFirst({
        where: and(eq(deckGroups.id, input.groupId), eq(deckGroups.profileId, profileId)),
      });
      if (!group) throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      if (!group.themeId) throw new TRPCError({ code: "BAD_REQUEST", message: "Group has no theme set" });

      const result = await ctx.db
        .update(decks)
        .set({ themeId: group.themeId, updatedAt: new Date() })
        .where(and(eq(decks.groupId, input.groupId), eq(decks.profileId, profileId)))
        .returning({ id: decks.id });

      return { updated: result.length };
    }),

  // --- Sprint 6: YouTube, Bulk, Review ---

  generateVideoRecs: protectedProcedure
    .input(z.object({
      deckId: z.string().uuid(),
      llmProvider: z.enum(["openai", "anthropic", "xai"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });

      // Use LLM to generate search queries from deck content
      const slides = (deck.slides ?? []) as SlideData[];
      const slideContent = slides
        .slice(0, 10)
        .map((s) => `${s.title}: ${s.body.slice(0, 100)}`)
        .join("\n");

      const llmId = input.llmProvider ?? deck.llmProvider ?? "openai";
      const provider = getLLMProvider(llmId);

      const queryPrompt = `Based on this training deck titled "${deck.title}", generate exactly 5 YouTube search queries to find relevant educational/training videos. Each query should target a different key topic from the deck.

Deck content:
${slideContent}

Respond with exactly 5 search queries, one per line. No numbering, no bullets, just the queries.`;

      const queryResult = await provider.chat(queryPrompt);
      const queries = queryResult
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 3)
        .slice(0, 5);

      if (queries.length === 0) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate search queries" });
      }

      // Search YouTube for each query (3 results each, dedup by videoId)
      const seenIds = new Set<string>();
      const allRecs: Array<{
        videoId: string;
        title: string;
        channelName: string;
        thumbnail: string;
        publishedAt: string;
        query: string;
      }> = [];

      for (const query of queries) {
        const results = await searchYouTube(query, 3);
        for (const r of results) {
          if (!seenIds.has(r.videoId)) {
            seenIds.add(r.videoId);
            allRecs.push({ ...r, query });
          }
        }
      }

      // Take top 8 unique results
      const videoRecs = allRecs.slice(0, 8);

      // Store in deck
      const [updated] = await ctx.db
        .update(decks)
        .set({ videoRecs, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      return updated;
    }),

  reviewDeck: protectedProcedure
    .input(z.object({
      deckId: z.string().uuid(),
      llmProvider: z.enum(["openai", "anthropic", "xai"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });

      const slides = (deck.slides ?? []) as SlideData[];
      if (slides.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deck has no slides to review" });
      }

      const llmId = input.llmProvider ?? deck.llmProvider ?? "openai";
      const provider = getLLMProvider(llmId);

      // Build compact slide summary for review
      const slideSummary = slides
        .map((s) => `[Slide ${s.order} | ${s.type} | "${s.title}"]\n${s.body.slice(0, 300)}`)
        .join("\n\n");

      const reviewPrompt = `You are a presentation quality reviewer. Review this ${slides.length}-slide training deck titled "${deck.title}".

Analyze for:
1. Content accuracy and completeness
2. Flow and logical progression between slides
3. Consistent tone and reading level
4. Missing topics that should be covered
5. Slides that are too dense or too sparse
6. Any factual claims without citations

${slideSummary}

Respond with a JSON array of issues found. Each issue:
{"slideOrder": <number or null for deck-wide>, "severity": "high"|"medium"|"low", "category": "accuracy"|"flow"|"tone"|"coverage"|"density"|"citation", "issue": "<brief description>", "suggestion": "<how to fix>"}

Return ONLY valid JSON array. If no issues, return [].`;

      const result = await provider.chat(reviewPrompt);

      // Parse JSON from response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return { issues: [], slideCount: slides.length };

      try {
        const issues = JSON.parse(jsonMatch[0]) as Array<{
          slideOrder: number | null;
          severity: "high" | "medium" | "low";
          category: string;
          issue: string;
          suggestion: string;
        }>;
        return { issues, slideCount: slides.length };
      } catch {
        return { issues: [], slideCount: slides.length };
      }
    }),

  bulkGenerate: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        sourceFormat: z.enum(["markdown", "plaintext", "pdf", "docx"]).default("plaintext"),
      })).min(1).max(10),
      llmProvider: z.enum(["openai", "anthropic", "xai"]).default("anthropic"),
      imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "disabled"]).default("disabled"),
      themeId: z.string().default("chw-teal"),
      slideCount: z.number().min(5).max(120).optional(),
      fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
      tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
      customInstructions: z.string().max(500).optional(),
      groupId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);

      // Create all decks in "generating" status
      const deckIds: string[] = [];
      for (const item of input.items) {
        const [deck] = await ctx.db
          .insert(decks)
          .values({
            profileId,
            title: item.title,
            sourceContent: item.content,
            sourceFormat: item.sourceFormat,
            themeId: input.themeId,
            llmProvider: input.llmProvider,
            imageProvider: input.imageProvider,
            groupId: input.groupId,
            status: "generating",
          })
          .returning();
        if (deck) deckIds.push(deck.id);
      }

      // Generate sequentially to avoid rate limits
      const provider = getLLMProvider(input.llmProvider);

      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i]!;
        const deckId = deckIds[i]!;

        try {
          const parsedContent =
            item.sourceFormat === "markdown"
              ? await parseContent(item.content, "markdown")
              : item.content;

          const result = await provider.generateSlides({
            content: parsedContent,
            title: item.title,
            slideCount: input.slideCount,
            fidelity: input.fidelity,
            customInstructions: input.customInstructions,
            tone: input.tone,
          });

          const processedSlides = tagReferenceSlides(result.slides);
          const contentSlideCount = processedSlides.filter((s) => s.type !== "references").length;

          await ctx.db
            .update(decks)
            .set({
              slides: processedSlides,
              slideCount: contentSlideCount,
              status: "ready",
              generationLog: {
                model: result.model,
                tokensUsed: result.tokensUsed,
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(decks.id, deckId));
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
            .where(eq(decks.id, deckId));
        }
      }

      // Email notification
      const userEmail = ctx.user.email;
      if (userEmail) {
        sendDeckReadyEmail(userEmail, `Bulk: ${input.items.length} decks`, deckIds[0]!, "ready").catch(() => {});
      }

      return { deckIds, count: deckIds.length };
    }),
});

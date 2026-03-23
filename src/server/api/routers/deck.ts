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
import type { SlideData, VisualBlockType, Violation, DeckStats } from "~/lib/ai/types";
import type { db as dbInstance } from "~/server/db";
import {
  uploadSlideImage,
  deleteSlideImage,
  deleteDeckImages,
} from "~/lib/storage/upload-image";
import { sendDeckReadyEmail } from "~/lib/resend";
import {
  IMAGE_STYLE_DIRECTIVE,
  enhanceImagePrompt,
  parseImageProviderPref,
  getMultiEngineConfig,
  getCustomMixConfig,
} from "~/lib/ai/image/style-prompt";
import {
  buildPass1Prompt,
  buildQAFixPrompt,
  buildReferencesPrompt,
} from "~/lib/ai/llm/prompts";
import { searchYouTube } from "~/lib/youtube";

/** Post-process: tag References slides, strip their images, and ensure they're always last */
function tagReferenceSlides(slides: SlideData[]): SlideData[] {
  // Tag any slides the LLM missed marking as references
  const tagged = slides.map((slide) => {
    const isRef =
      slide.type === "references" ||
      (/\breferences?\b|\bbibliography\b|\bcitations?\b|\bworks\s+cited\b/i.test(slide.title) && slide.type !== "title");
    if (!isRef) return slide;
    return { ...slide, type: "references", imagePrompt: null, imageUrl: null, layout: "full" } as SlideData;
  });

  // Move all references slides to the very end (after closing)
  const nonRef = tagged.filter((s) => s.type !== "references");
  const refs = tagged.filter((s) => s.type === "references");
  const reordered = [...nonRef, ...refs];

  // Re-number order sequentially
  return reordered.map((s, i) => ({ ...s, order: i + 1 }));
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

/** Background helper: generate images for all slides that have prompts but no images */
async function generateImagesForDeck(
  db: typeof dbInstance,
  deckId: string,
  slides: SlideData[],
  imageProvider: string,
) {
  const needsImages = slides.filter((s) => s.imagePrompt && !s.imageUrl);
  if (needsImages.length === 0) return;

  const { mode, engineIds } = parseImageProviderPref(imageProvider);
  const availableProviders = getAvailableImageProviders();
  const configuredIds = availableProviders.filter((p) => p.configured).map((p) => p.id);

  console.log(`[deck ${deckId}] Starting image gen for ${needsImages.length} slides (mode: ${mode}, engines: ${configuredIds.join(",")})`);

  let generated = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  for (let i = 0; i < needsImages.length; i++) {
    const slide = needsImages[i]!;
    try {
      const config = mode === "multi"
        ? getMultiEngineConfig(i, configuredIds)
        : getCustomMixConfig(i, engineIds);

      const prompt = enhanceImagePrompt(slide.imagePrompt!, i);
      const imgProvider = getImageProvider(config.providerId);
      const buffer = await imgProvider.generateImage(prompt);

      // Determine content type based on provider
      const contentType = config.providerId === "gpt-image-1" ? "image/webp" as const : "image/png" as const;
      const storedUrl = await uploadSlideImage(deckId, slide.id, buffer, contentType);

      // Update slide in deck
      const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
        columns: { slides: true },
      });
      if (deck?.slides) {
        const allSlides = deck.slides as SlideData[];
        const updatedSlides = allSlides.map((s) =>
          s.id === slide.id ? { ...s, imageUrl: storedUrl } : s
        );
        await db.update(decks).set({ slides: updatedSlides, updatedAt: new Date() }).where(eq(decks.id, deckId));
      }
      generated++;
      consecutiveFailures = 0;

      // Brief delay between requests to avoid rate limits (500ms)
      if (i < needsImages.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (error) {
      failed++;
      consecutiveFailures++;
      console.error(`[deck ${deckId}] Image gen failed for slide ${slide.id} (${i + 1}/${needsImages.length}):`, error instanceof Error ? error.message : error);

      // If 3+ consecutive failures, add a longer backoff (likely rate-limited)
      if (consecutiveFailures >= 3) {
        console.warn(`[deck ${deckId}] ${consecutiveFailures} consecutive failures — backing off 5s`);
        await new Promise((r) => setTimeout(r, 5000));
      }

      // If 5+ consecutive failures, bail out (provider is probably down)
      if (consecutiveFailures >= 5) {
        console.error(`[deck ${deckId}] Stopping image gen after ${consecutiveFailures} consecutive failures`);
        break;
      }
    }
  }
  console.log(`[deck ${deckId}] Image gen complete: ${generated} generated, ${failed} failed, ${needsImages.length - generated - failed} skipped`);
}

/** Helper: retry a single LLM pass once on failure */
async function retryOnce<T>(fn: () => Promise<T>, label: string, deckId: string): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    console.warn(`[deck ${deckId}] ${label} failed, retrying...`, firstErr instanceof Error ? firstErr.message : firstErr);
    await new Promise((r) => setTimeout(r, 2000));
    return await fn();
  }
}

// ── Server-Side QA Audit ──────────────────────────────────

const BOOKEND_TYPES = new Set(["title", "section", "closing"]);
const CONTENT_TYPES = new Set(["content", "bullets", "comparison", "activity", "quote", "image"]);
const IMAGE_ELIGIBLE_LAYOUTS = new Set(["split-left", "split-right", "image-full", "image-top"]);
const IMAGE_REQUIRED_LAYOUTS = new Set(["image-full", "image-top"]);
const NO_IMAGE_LAYOUTS = new Set(["full", "two-column"]);
const CITATION_PATTERN = /\((?:[A-Z][A-Za-z'-]+(?:\s(?:&|and|et al\.?)\s[A-Z][A-Za-z'-]+)*|[A-Z]{2,}),\s*\d{4}[a-z]?\)/;

/** Extract the dominant block type from a slide body (first :::block-type found) */
function getDominantBlock(body: string): string | null {
  const match = body.match(/^\s*:::([\w-]+)/m);
  return match?.[1] ?? null;
}

/** Count all unique block types used in a slide body */
function getBlockTypes(body: string): string[] {
  const types: string[] = [];
  for (const match of body.matchAll(/^\s*:::([\w-]+)/gm)) {
    if (match[1] && match[1] !== "") types.push(match[1]);
  }
  // Filter out closing ::: markers
  return types.filter((t) => t !== "");
}

/** Pure TypeScript audit — no LLM calls. Returns violations and deck-wide stats. */
function auditDeckQuality(slides: SlideData[]): { violations: Violation[]; stats: DeckStats } {
  const violations: Violation[] = [];

  // Compute stats
  const blockTypeFrequency: Record<string, number> = {};
  let slidesWithImages = 0;
  let slidesWithSpeakerNotes = 0;
  let slidesWithCitations = 0;
  let hasReferencesSlide = false;
  let contentSlideCount = 0;

  for (const slide of slides) {
    if (slide.type === "references") {
      hasReferencesSlide = true;
      continue;
    }
    if (CONTENT_TYPES.has(slide.type)) contentSlideCount++;
    if (slide.imagePrompt) slidesWithImages++;
    if (slide.speakerNotes?.trim()) slidesWithSpeakerNotes++;
    if (CITATION_PATTERN.test(slide.body)) slidesWithCitations++;

    for (const blockType of getBlockTypes(slide.body)) {
      blockTypeFrequency[blockType] = (blockTypeFrequency[blockType] ?? 0) + 1;
    }
  }

  const uniqueBlockTypes = Object.keys(blockTypeFrequency).length;
  const imageCoveragePercent = contentSlideCount > 0
    ? (slidesWithImages / contentSlideCount) * 100
    : 0;

  const stats: DeckStats = {
    totalSlides: slides.length,
    contentSlides: contentSlideCount,
    uniqueBlockTypes,
    blockTypeFrequency,
    imageCoveragePercent,
    slidesWithImages,
    slidesWithSpeakerNotes,
    slidesWithCitations,
    hasReferencesSlide,
  };

  // Check 1: Block variety
  if (uniqueBlockTypes < 10 && contentSlideCount >= 10) {
    // Find overused block types — strict limit of 3 for common types, 4 for others
    const STRICT_LIMIT_TYPES = new Set(["numbered-steps", "checklist", "info-box", "callout-banner"]);
    const overused = Object.entries(blockTypeFrequency)
      .filter(([type, cnt]) => cnt >= (STRICT_LIMIT_TYPES.has(type) ? 3 : 4))
      .sort(([, a], [, b]) => b - a);
    if (overused.length > 0) {
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]!;
        const dominant = getDominantBlock(slide.body);
        if (dominant && overused.some(([type]) => type === dominant)) {
          violations.push({
            type: "low-block-variety",
            slideIndex: i,
            slideId: slide.id,
            message: `Swap :::${dominant} to an underused block type. Deck only has ${uniqueBlockTypes} unique types (need 10+). Overused: ${overused.map(([t, c]) => `${t}(${c})`).join(", ")}`,
          });
        }
      }
    }
  }

  // Check 2: Consecutive same block type
  for (let i = 1; i < slides.length; i++) {
    const prev = getDominantBlock(slides[i - 1]!.body);
    const curr = getDominantBlock(slides[i]!.body);
    if (prev && curr && prev === curr) {
      violations.push({
        type: "consecutive-same-block",
        slideIndex: i,
        slideId: slides[i]!.id,
        message: `This slide and the previous both use :::${curr}. Swap this one to a different block type.`,
      });
    }
  }

  // Check 3: Bookend protocol (title/section/closing must be image-full with imagePrompt)
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    if (BOOKEND_TYPES.has(slide.type)) {
      if (slide.layout !== "image-full" || !slide.imagePrompt) {
        violations.push({
          type: "bookend-missing-image-full",
          slideIndex: i,
          slideId: slide.id,
          message: `${slide.type} slide must use layout "image-full" with an imagePrompt. Currently: layout="${slide.layout}", imagePrompt=${slide.imagePrompt ? "set" : "null"}. Change layout to "image-full" and add a cinematic imagePrompt.`,
        });
      }
    }
  }

  // Check 4: Image rule violations
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    if (NO_IMAGE_LAYOUTS.has(slide.layout) && slide.imagePrompt) {
      violations.push({
        type: "image-on-non-eligible",
        slideIndex: i,
        slideId: slide.id,
        message: `Layout "${slide.layout}" does not support images. Set imagePrompt to null, or change layout to split-right/image-top.`,
      });
    }
    if (IMAGE_REQUIRED_LAYOUTS.has(slide.layout) && !slide.imagePrompt) {
      violations.push({
        type: "missing-image-on-eligible",
        slideIndex: i,
        slideId: slide.id,
        message: `Layout "${slide.layout}" requires an imagePrompt but has none. Add a photorealistic imagePrompt.`,
      });
    }
  }

  // Check 5: Image coverage
  if (contentSlideCount >= 10) {
    if (imageCoveragePercent < 30) {
      // Find content slides without images that could benefit
      const candidates = slides
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => CONTENT_TYPES.has(s.type) && !s.imagePrompt && s.layout === "full")
        .slice(0, 5); // Suggest up to 5
      for (const { s, i } of candidates) {
        violations.push({
          type: "image-coverage-low",
          slideIndex: i,
          slideId: s.id,
          message: `Image coverage is ${imageCoveragePercent.toFixed(0)}% (target 35-45%). Change this slide's layout to "split-right" and add an imagePrompt.`,
        });
      }
    }
  }

  // Check 6: Missing speaker notes
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    if (slide.type !== "references" && !slide.speakerNotes?.trim()) {
      violations.push({
        type: "missing-speaker-notes",
        slideIndex: i,
        slideId: slide.id,
        message: `Missing speaker notes. Add structured notes with **Talking Points** (2-5 bullet points).`,
      });
    }
  }

  // Check 7: Missing citations on content slides (skip activity, pre-test, review, etc.)
  const CITATION_SKIP_TYPES = new Set(["activity", "quote"]);
  const CITATION_SKIP_TITLE = /pre.?test|post.?test|placeholder|role.?play|practice|review|scenario|reflection|discussion|qr\s*code|resource/i;
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]!;
    if (
      CONTENT_TYPES.has(slide.type) &&
      !CITATION_SKIP_TYPES.has(slide.type) &&
      !CITATION_SKIP_TITLE.test(slide.title) &&
      !CITATION_PATTERN.test(slide.body)
    ) {
      violations.push({
        type: "missing-citations",
        slideIndex: i,
        slideId: slide.id,
        message: `No in-text citation found. Add 1-2 (Author, Year) citations where claims need evidence. Place citations in markdown text, not inside :::block content.`,
      });
    }
  }

  // Check 8: Missing References slide
  if (!hasReferencesSlide) {
    violations.push({
      type: "missing-references",
      slideIndex: -1,
      slideId: "none",
      message: "No References slide found. Will generate one separately.",
    });
  }

  return { violations, stats };
}

/** Group violations by slideIndex */
function groupViolationsBySlide(violations: Violation[]): Record<number, Violation[]> {
  const map: Record<number, Violation[]> = {};
  for (const v of violations) {
    if (v.slideIndex < 0) continue; // Skip deck-level violations like missing-references
    (map[v.slideIndex] ??= []).push(v);
  }
  return map;
}

/** Split slide indices into chunks of N */
function chunkIndices(indices: number[], chunkSize: number): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < indices.length; i += chunkSize) {
    chunks.push(indices.slice(i, i + chunkSize));
  }
  return chunks;
}

/** Background helper: run full deck generation (2-pass: generate + QA audit) without blocking the request */
async function generateDeckInBackground(
  db: typeof dbInstance,
  deckId: string,
  opts: {
    content: string;
    sourceFormat: string;
    title: string;
    description?: string;
    slideCount?: number;
    llmProvider: string;
    imageProvider: string;
    fidelity?: string;
    selectedBlocks?: VisualBlockType[];
    customInstructions?: string;
    tone?: string;
    userEmail?: string | null;
  }
) {
  try {
    const parsedContent =
      opts.sourceFormat === "markdown"
        ? await parseContent(opts.content, "markdown")
        : opts.content;

    const provider = getLLMProvider(opts.llmProvider);
    const generateInput = {
      content: parsedContent,
      title: opts.title,
      description: opts.description,
      slideCount: opts.slideCount,
      fidelity: opts.fidelity as "verbatim" | "balanced" | "creative" | undefined,
      selectedBlocks: opts.selectedBlocks,
      customInstructions: opts.customInstructions,
      tone: opts.tone as "professional" | "conversational" | "academic" | "training" | undefined,
    };

    let totalTokens = 0;

    // ── Pass 1: Full Generation (single comprehensive LLM call) ──
    console.log(`[deck ${deckId}] Pass 1: Full generation`);
    const pass1Prompt = buildPass1Prompt(generateInput);
    const pass1Result = await retryOnce(() => provider.generateRaw(pass1Prompt), "Pass 1", deckId);
    totalTokens += pass1Result.tokensUsed;
    let slides = pass1Result.slides;
    console.log(`[deck ${deckId}] Pass 1 complete: ${slides.length} slides, ${pass1Result.tokensUsed} tokens`);

    // ── Pass 2: Server-Side Audit + Targeted LLM Fixes ──
    console.log(`[deck ${deckId}] Pass 2: QA audit`);
    const { violations, stats } = auditDeckQuality(slides);
    const slideViolations = violations.filter((v) => v.slideIndex >= 0);
    console.log(`[deck ${deckId}] Audit: ${violations.length} violations across ${new Set(slideViolations.map((v) => v.slideIndex)).size} slides (${stats.uniqueBlockTypes} block types, ${stats.imageCoveragePercent.toFixed(0)}% image coverage)`);

    let qaFixCount = 0;
    if (slideViolations.length > 0) {
      const grouped = groupViolationsBySlide(slideViolations);
      const allIndices = Object.keys(grouped).map(Number).sort((a, b) => a - b);
      const chunks = chunkIndices(allIndices, 3);

      console.log(`[deck ${deckId}] Sending ${chunks.length} QA fix chunk(s) (${allIndices.length} slides)`);

      const fixResults = await Promise.allSettled(
        chunks.map(async (chunkIdx) => {
          const chunkSlides = chunkIdx.map((i) => slides[i]!);
          const chunkViolations = chunkIdx.flatMap((i) => grouped[i] ?? []);
          const fixPrompt = buildQAFixPrompt(chunkSlides, chunkViolations, stats);
          return provider.generateRaw(fixPrompt);
        })
      );

      for (const result of fixResults) {
        if (result.status === "fulfilled") {
          totalTokens += result.value.tokensUsed;
          for (const fixedSlide of result.value.slides) {
            const idx = slides.findIndex((s) => s.id === fixedSlide.id);
            if (idx !== -1) {
              slides[idx] = fixedSlide;
              qaFixCount++;
            }
          }
        } else {
          console.warn(`[deck ${deckId}] QA fix chunk failed:`, result.reason instanceof Error ? result.reason.message : result.reason);
        }
      }
      console.log(`[deck ${deckId}] QA fixes applied: ${qaFixCount} slides updated`);
    }

    // Generate References slides if missing
    if (!stats.hasReferencesSlide) {
      console.log(`[deck ${deckId}] Generating References slides`);
      try {
        const refsPrompt = buildReferencesPrompt(slides);
        const refsResult = await provider.generateRaw(refsPrompt);
        totalTokens += refsResult.tokensUsed;
        const refSlides = refsResult.slides.filter((s) => s.type === "references");
        if (refSlides.length > 0) {
          slides = [...slides, ...refSlides];
          console.log(`[deck ${deckId}] Added ${refSlides.length} References slide(s)`);
        }
      } catch (err) {
        console.warn(`[deck ${deckId}] References generation failed, skipping:`, err instanceof Error ? err.message : err);
      }
    }

    const processedSlides = tagReferenceSlides(slides);
    const contentSlideCount = processedSlides.filter((s) => s.type !== "references").length;

    await db
      .update(decks)
      .set({
        slides: processedSlides,
        slideCount: contentSlideCount,
        status: "ready",
        generationLog: {
          model: pass1Result.model,
          tokensUsed: totalTokens,
          pass1Slides: pass1Result.slides.length,
          violationsFound: violations.length,
          violationsFixed: qaFixCount,
          generatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(decks.id, deckId));

    // Send completion email BEFORE image gen (image gen can take minutes and may exceed serverless timeout)
    if (opts.userEmail) {
      sendDeckReadyEmail(opts.userEmail, opts.title, deckId, "ready").catch((err) => {
        console.error(`[deck ${deckId}] Failed to send ready email:`, err instanceof Error ? err.message : err);
      });
    }

    // Auto-generate images for slides with prompts
    if (opts.imageProvider !== "disabled") {
      await generateImagesForDeck(db, deckId, processedSlides, opts.imageProvider);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[deck ${deckId}] Generation failed: ${errorMsg}`, errorStack ?? "");

    try {
      await db
        .update(decks)
        .set({
          status: "error",
          generationLog: {
            error: errorMsg,
            failedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(decks.id, deckId));
    } catch (dbErr) {
      console.error(`[deck ${deckId}] Failed to write error status to DB:`, dbErr instanceof Error ? dbErr.message : dbErr);
    }

    if (opts.userEmail) {
      sendDeckReadyEmail(opts.userEmail, opts.title, deckId, "error", errorMsg).catch((err) => {
        console.error(`[deck ${deckId}] Failed to send error email:`, err instanceof Error ? err.message : err);
      });
    }
  }
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
        themeId: z.string().default("chw-cream"),
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
        imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "multi", "disabled"]).default("multi"),
        themeId: z.string().default("chw-cream"),
        slideCount: z.number().min(5).max(200).optional(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
        customInstructions: z.string().max(1000).optional(),
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

      // Background generation — waitUntil keeps the serverless function alive
      ctx.waitUntil(generateDeckInBackground(ctx.db, deck.id, {
        content: input.content,
        sourceFormat: input.sourceFormat,
        title: input.title,
        description: input.description,
        slideCount: input.slideCount,
        llmProvider: input.llmProvider,
        imageProvider: input.imageProvider,
        fidelity: input.fidelity,
        selectedBlocks: input.selectedBlocks as VisualBlockType[] | undefined,
        customInstructions: input.customInstructions,
        tone: input.tone,
        userEmail: ctx.user.email,
      }));

      return deck;
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
      const deletedSlide = currentSlides.find((s) => s.id === input.slideId);
      const filtered = currentSlides.filter((s) => s.id !== input.slideId);
      if (!deletedSlide) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      // Re-number order fields
      const reordered = filtered.map((s, i) => ({ ...s, order: i + 1 }));

      const [updated] = await ctx.db
        .update(decks)
        .set({ slides: reordered, slideCount: reordered.length, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId))
        .returning();

      // Clean up storage image (fire-and-forget)
      if (deletedSlide.imageUrl) {
        deleteSlideImage(input.deckId, input.slideId).catch(() => {});
      }

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

      // Mark slide as generating and return immediately
      currentSlides[slideIndex] = {
        ...slide,
        imagePrompt: prompt,
        imageGenerating: true,
      };
      await ctx.db
        .update(decks)
        .set({ slides: currentSlides, updatedAt: new Date() })
        .where(eq(decks.id, input.deckId));

      // Fire-and-forget: generate image in background
      void (async () => {
        try {
          const provider = getImageProvider(input.imageProvider);
          const buffer = await provider.generateImage(enhanceImagePrompt(prompt));

          const contentType = input.imageProvider === "gpt-image-1" ? "image/webp" : "image/png";
          const imageUrl = await uploadSlideImage(input.deckId, input.slideId, buffer, contentType);

          // Re-read deck to avoid stale data
          const freshDeck = await ctx.db.query.decks.findFirst({
            where: eq(decks.id, input.deckId),
            columns: { slides: true },
          });
          if (freshDeck?.slides) {
            const freshSlides = freshDeck.slides as SlideData[];
            const updatedSlides = freshSlides.map((s) =>
              s.id === input.slideId ? { ...s, imageUrl, imagePrompt: prompt, imageGenerating: undefined } : s
            );
            await ctx.db.update(decks).set({ slides: updatedSlides, updatedAt: new Date() }).where(eq(decks.id, input.deckId));
          }
        } catch (error) {
          console.error(`[slide image gen] Failed for slide ${input.slideId}:`, error);
          // Clear generating flag on failure
          const freshDeck = await ctx.db.query.decks.findFirst({
            where: eq(decks.id, input.deckId),
            columns: { slides: true },
          });
          if (freshDeck?.slides) {
            const freshSlides = freshDeck.slides as SlideData[];
            const updatedSlides = freshSlides.map((s) =>
              s.id === input.slideId ? { ...s, imageGenerating: undefined, imageError: error instanceof Error ? error.message : "Image generation failed" } : s
            );
            await ctx.db.update(decks).set({ slides: updatedSlides, updatedAt: new Date() }).where(eq(decks.id, input.deckId));
          }
        }
      })();

      return deck;
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
      const llmId = input.llmProvider ?? deck.llmProvider ?? "anthropic";
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

      const llmId = input.llmProvider ?? deck.llmProvider ?? "anthropic";
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

      // Preserve existing image data from the original slide
      currentSlides[slideIndex] = {
        ...regenerated,
        id: slide.id,
        order: slide.order,
        imageUrl: slide.imageUrl,
        ...(slide.imageFocalPoint ? { imageFocalPoint: slide.imageFocalPoint } : {}),
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
        imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "multi", "disabled"]).optional(),
        slideCount: z.number().min(5).max(200).optional(),
        selectedBlocks: z.array(z.enum(VISUAL_BLOCK_TYPES)).optional(),
        customInstructions: z.string().max(1000).optional(),
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

      const llmId = input.llmProvider ?? deck.llmProvider ?? "anthropic";
      const imageProviderId = input.imageProvider ?? deck.imageProvider ?? "multi";

      // Mark as generating and update provider choices
      await ctx.db
        .update(decks)
        .set({ status: "generating", llmProvider: llmId, imageProvider: imageProviderId, updatedAt: new Date() })
        .where(eq(decks.id, deck.id));

      // Background generation — waitUntil keeps the serverless function alive
      ctx.waitUntil(generateDeckInBackground(ctx.db, deck.id, {
        content: deck.sourceContent,
        sourceFormat: deck.sourceFormat ?? "plaintext",
        title: deck.title,
        description: deck.description ?? undefined,
        slideCount: input.slideCount ?? deck.slideCount ?? 70,
        llmProvider: llmId,
        imageProvider: imageProviderId,
        fidelity: input.fidelity,
        selectedBlocks: input.selectedBlocks as VisualBlockType[] | undefined,
        customInstructions: input.customInstructions,
        tone: input.tone,
        userEmail: ctx.user.email,
      }));

      // Return the deck immediately (status: generating)
      const [updated] = await ctx.db
        .select()
        .from(decks)
        .where(eq(decks.id, deck.id));

      return updated;
    }),

  batchGenerateImages: protectedProcedure
    .input(z.object({
      deckId: z.string().uuid(),
      imageProvider: z.string().default("multi"),
    }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const deck = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.deckId), eq(decks.profileId, profileId)),
      });
      if (!deck) throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });

      const slides = (deck.slides ?? []) as SlideData[];
      const needsImages = slides.filter((s) => s.imagePrompt && !s.imageUrl);
      if (needsImages.length === 0) return { started: 0 };

      // Fire-and-forget: generate images in background
      void generateImagesForDeck(ctx.db, input.deckId, slides, input.imageProvider);

      return { started: needsImages.length };
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

  duplicateDeck: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const original = await ctx.db.query.decks.findFirst({
        where: and(eq(decks.id, input.id), eq(decks.profileId, profileId)),
      });
      if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Deck not found" });

      const [copy] = await ctx.db
        .insert(decks)
        .values({
          profileId,
          title: `${original.title} (Copy)`,
          description: original.description,
          sourceContent: original.sourceContent,
          sourceFormat: original.sourceFormat,
          themeId: original.themeId,
          llmProvider: original.llmProvider,
          imageProvider: original.imageProvider,
          groupId: original.groupId,
          slides: original.slides,
          slideCount: original.slideCount,
          status: "ready",
          generationLog: {
            duplicatedFrom: original.id,
            duplicatedAt: new Date().toISOString(),
          },
        })
        .returning();

      return copy;
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
    return prefs ?? { llmProvider: "anthropic", imageProvider: "multi", fidelity: "balanced", customInstructions: "", tone: "training" };
  }),

  setPreferences: protectedProcedure
    .input(
      z.object({
        llmProvider: z.string(),
        imageProvider: z.string(),
        fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
        customInstructions: z.string().max(1000).optional(),
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

      const llmId = input.llmProvider ?? deck.llmProvider ?? "anthropic";
      const provider = getLLMProvider(llmId);

      const queryPrompt = `You are helping find YouTube training videos for Community Health Workers (CHWs). Based on this training deck titled "${deck.title}", generate exactly 5 YouTube search queries.

Requirements for each query:
- Target CHW, community health, public health, or health education content
- Include terms like "community health worker", "CHW training", "public health", or "health education" where relevant
- Each query should cover a different key topic from the deck
- Prefer queries that would return professional training content, not general consumer health info
- Keep queries concise (5-10 words) for best YouTube results

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

      const llmId = input.llmProvider ?? deck.llmProvider ?? "anthropic";
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
      imageProvider: z.enum(["dalle3", "gpt-image-1", "stability", "replicate", "leonardo", "multi", "disabled"]).default("multi"),
      themeId: z.string().default("chw-cream"),
      slideCount: z.number().min(5).max(200).optional(),
      fidelity: z.enum(["verbatim", "balanced", "creative"]).optional(),
      tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
      customInstructions: z.string().max(1000).optional(),
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
            groupId: input.groupId ?? null,
            status: "generating",
          })
          .returning();
        if (deck) deckIds.push(deck.id);
      }

      // Generate all decks in parallel — waitUntil keeps the function alive for each
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i]!;
        const deckId = deckIds[i]!;
        ctx.waitUntil(generateDeckInBackground(ctx.db, deckId, {
          content: item.content,
          sourceFormat: item.sourceFormat,
          title: item.title,
          slideCount: input.slideCount,
          llmProvider: input.llmProvider,
          imageProvider: input.imageProvider,
          fidelity: input.fidelity,
          customInstructions: input.customInstructions,
          tone: input.tone,
          userEmail: ctx.user.email,
        }));
      }

      return { deckIds, count: deckIds.length };
    }),

  recoverStalledDecks: protectedProcedure
    .mutation(async ({ ctx }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

      const stalled = await ctx.db
        .update(decks)
        .set({
          status: "error",
          generationLog: {
            error: "Generation timed out. Please try again.",
            failedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(and(
          eq(decks.profileId, profileId),
          eq(decks.status, "generating"),
          sql`${decks.updatedAt} < ${thirtyMinAgo.toISOString()}::timestamptz`,
        ))
        .returning({ id: decks.id });

      return { recovered: stalled.length };
    }),

  bulkDeleteDecks: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const profileId = await getProfileId(ctx.db, ctx.user.id);

      // Clean up storage images for each deck
      for (const id of input.ids) {
        deleteDeckImages(id).catch(() => {});
      }

      const deleted = await ctx.db
        .delete(decks)
        .where(and(
          inArray(decks.id, input.ids),
          eq(decks.profileId, profileId),
        ))
        .returning({ id: decks.id });

      return { count: deleted.length };
    }),
});

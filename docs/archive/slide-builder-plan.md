# Slide Builder Production Plan

Comprehensive plan to bring the CHW360 slide builder to production quality. Based on deep audit of rendering, image generation, provider configuration, prompt pipeline, presenter mode, and deck management.

---

## Architecture Overview

### Current Generation Flow
```
Content Input (markdown/plaintext/PDF/DOCX)
  → Format Detection & Parsing (detectFormat → parseContent)
  → Build Generate Prompt (buildGeneratePrompt — 450+ lines)
  → LLM Call (gpt-4o or claude-sonnet-4-5-20250929)
  → JSON Response Parsing (with truncation repair)
  → Zod Validation → Store in DB (slides JSONB, status: "ready")
  → [Optional] User triggers image generation per-slide or batch
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/ai/llm/prompts.ts` | 450+ line generation prompt with block docs, layouts, fidelity, tone |
| `src/lib/ai/llm/openai.ts` | GPT-4o implementation (max_tokens=16,384, JSON mode) |
| `src/lib/ai/llm/anthropic.ts` | Claude Sonnet implementation (max_tokens=32,000, streaming) |
| `src/lib/ai/llm/index.ts` | LLM provider registry (only openai + anthropic registered) |
| `src/lib/ai/image/dalle3.ts` | DALL-E 3 (1792×1024, standard quality) |
| `src/lib/ai/image/gpt-image-1.ts` | GPT Image 1 (1536×1024, high quality) |
| `src/lib/ai/image/index.ts` | Image provider registry (only dalle3 + gpt-image-1 registered) |
| `src/lib/ai/providers-config.ts` | Provider metadata, UI labels, configured flags |
| `src/lib/ai/fidelity.ts` | Auto-detect content structure (verbatim/balanced/creative) |
| `src/lib/ai/types.ts` | SlideData type definition |
| `src/lib/parsers/index.ts` | Format detection & parsing dispatch |
| `src/server/api/routers/deck.ts` | generate, regenerate, generateSlideImage, generateImagePrompt mutations |
| `src/components/slides/slide-renderer.tsx` | Main renderer: layouts, blocks, ContentFitter, density scaling |
| `src/components/slides/markdown-renderer.tsx` | Custom lightweight markdown → HTML (bold, italic, lists, headings) |
| `src/components/slides/block-renderer.tsx` | 21 visual block types (info-box, key-stat, flow-diagram, etc.) |
| `src/components/slides/deck-settings-panel.tsx` | Editing-time settings (theme, provider, fidelity, tone) |
| `src/components/slides/provider-selector.tsx` | Provider card selector UI |
| `src/components/slides/deck-card.tsx` | Deck list card component |
| `src/app/admin/slides/page.tsx` | Deck list page |
| `src/app/admin/slides/new/page.tsx` | Creation wizard |
| `src/app/admin/slides/[deckId]/page.tsx` | Deck viewer/editor |
| `src/app/admin/slides/[deckId]/present/page.tsx` | Presenter mode (fullscreen, keyboard nav, speaker notes) |
| `src/app/admin/slides/[deckId]/audience/page.tsx` | Audience view (localStorage sync) |
| `docs/generation-prompts.md` | Client's image style prompt + citation prompt (NOT yet integrated) |

---

## Sprint 1: Foundation Fixes

**Goal:** Fix the rendering bugs that affect every slide. Everything else builds on this.

### 1.1 — Fix Bold Markdown in Visual Blocks

**Problem:** 13 of 21 visual block types render plain text, silently dropping `**bold**`, `*italic*`, and other markdown.

**Blocks that DO support markdown** (use MarkdownRenderer):
- `info-box`, `numbered-steps`, `card-grid`, `chevron-flow`, `accent-list`

**Blocks that DON'T** (render raw text — bold is lost):
- `flow-diagram` (line ~131 in block-renderer.tsx)
- `comparison-table` (line ~351)
- `cycle` / `CycleDiagram` (line ~289)
- `timeline` (lines ~537, ~541)
- `quote-block` (line ~420)
- `highlight-box` (line ~579)
- `checklist` (line ~488)
- `icon-grid` (line ~390)
- `key-stat` (display-only number, no markdown expected — skip)
- `progress-bars` (numeric display — skip)
- `metric-row` (numeric display — skip)

**Fix:** In `block-renderer.tsx`, replace `{item}` / `{content}` plain text renders with `<MarkdownRenderer md={item} />` for all text-bearing blocks. The numeric/display blocks (key-stat, progress-bars, metric-row) can stay as plain text.

**Files:** `src/components/slides/block-renderer.tsx`, import MarkdownRenderer

**Also fix in markdown-renderer.tsx:**
- The bold regex `.+?` is non-greedy — works for single-line bold but fails if bold spans a line break. This is acceptable for slide content (single-line bold is the norm). No change needed unless testing reveals issues.

### 1.2 — Fix Title Slide Consistency

**Problem:** Title slides render differently depending on layout:

| Slide Type | Standard Layouts | image-full Layout |
|------------|-----------------|-------------------|
| title | SlideTitle component, theme color, text-5xl | Hardcoded white, text-4xl, textShadow |
| section | SlideTitle component, theme color, text-4xl | Hardcoded white, textShadow |
| closing | SlideTitle component, theme color, text-2xl | Hardcoded white, text-4xl |

**Root cause:** `image-full` layout in `slide-renderer.tsx` renders titles in a frosted glass card with hardcoded `text-white` and `textShadow` instead of using the `SlideTitle` component or theme colors.

**Fix:** In the image-full layout rendering section of `slide-renderer.tsx`:
- Use theme-aware text color (white is fine for image-full since it's over a dark image, but use `text-white` consistently)
- Match font sizes: title=5xl, section=4xl, closing=2xl (currently closing is inconsistent)
- Add `textWrap: "balance"` to match SlideTitle behavior
- Keep textShadow (needed for readability over images)

**Files:** `src/components/slides/slide-renderer.tsx` — image-full layout section

### 1.3 — Fix Content Overflow on Dense Slides

**Problem:** ContentFitter has a minimum shrink of `0.55` (45% max compression). If content needs more than 1.82× shrinkage, it overflows and clips. Also, ResizeObserver may measure before async content (charts, fonts) finishes rendering.

**Fix:**
- Lower minimum shrink to `0.45` (allows 55% compression) — `src/components/slides/slide-renderer.tsx` ContentFitter
- Add a second delayed measurement at 500ms (in addition to the current 300ms) for async content
- Add `overflow-hidden` as a hard safety net on the outer container
- For split layouts: reduce padding from `p-10` to `p-8` when density is high to give more room

**Files:** `src/components/slides/slide-renderer.tsx` — ContentFitter component, layout padding

### 1.4 — Create Centralized Image Style Directive

**Purpose:** Shared constant used by Sprint 2 (image generation) and Sprint 3 (LLM prompt).

**Create new file:** `src/lib/ai/image/style-prompt.ts`
```typescript
export const IMAGE_STYLE_DIRECTIVE = `Warm natural lighting, clean minimal design, smooth edges, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, school gym, school cafeteria, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.`;

export function enhanceImagePrompt(basePrompt: string): string {
  return `${IMAGE_STYLE_DIRECTIVE} ${basePrompt}`;
}
```

**Source:** `docs/generation-prompts.md` lines 9-19 (client-provided)

---

## Sprint 2: Image Quality

**Goal:** All generated images match the client's warm, bright, Texas-themed, community-focused aesthetic. Depends on Sprint 1.4 (style-prompt.ts).

### 2.1 — Inject Style Directive into LLM Image Prompt Generation

**File:** `src/lib/ai/llm/prompts.ts` — `buildGeneratePrompt()` function

**Current (lines ~385-393):** Generic guidelines telling LLM how to write imagePrompt values:
```
## Image Prompt Guidelines
- Specify subject clearly
- Include style: "photorealistic", "warm documentary", etc.
- Include mood/lighting: "warm golden hour", "bright and optimistic"
```

**Change:** Replace/supplement with client-specific directive:
```
## Image Prompt Guidelines — Brand Style
CRITICAL: All imagePrompt values MUST embody this visual style:
${IMAGE_STYLE_DIRECTIVE}

Additional rules:
- Always specify "warm natural lighting" and "brightly lit"
- Always include diversity in people (Hispanic, Black, Asian, Middle Eastern, all ages)
- Settings should feel like Texas community spaces
- Images must feel calm, supportive, and optimistic — never dark, dramatic, or clinical
- 1-2 sentence prompts only. No text in images.
```

### 2.2 — Inject Style Directive into Per-Slide Image Prompt Generation

**File:** `src/server/api/routers/deck.ts` — `generateImagePrompt` mutation (lines ~488-493)

**Current:** Bare prompt asking for image description with no style context.

**Change:** Add style requirements to the prompt:
```typescript
const prompt = `Generate a concise image prompt (1-2 sentences) for an AI image generator.

REQUIRED STYLE: ${IMAGE_STYLE_DIRECTIVE}

The image should be warm, brightly lit, and optimistic. Never dark or dramatic.

Slide title: ${slide.title}
Slide content: ${slide.body.slice(0, 500)}

Respond with ONLY the image prompt.`;
```

### 2.3 — Wrap All Image Generation Calls with Style Prefix

**File:** `src/server/api/routers/deck.ts` — `generateSlideImage` mutation (line ~419)

**Current:** `const buffer = await provider.generateImage(prompt);` — prompt sent verbatim.

**Change:**
```typescript
import { enhanceImagePrompt } from "~/lib/ai/image/style-prompt";
const buffer = await provider.generateImage(enhanceImagePrompt(prompt));
```

This ensures even manually written or regenerated prompts get the style prefix.

### 2.4 — Verify Image Provider Settings

**File:** `src/lib/ai/image/dalle3.ts`, `src/lib/ai/image/gpt-image-1.ts`

Check and adjust:
- DALL-E 3: Ensure `quality: "standard"` (not "hd" which can produce darker images)
- GPT Image 1: Verify size and quality settings produce bright output
- Neither provider adds any style prefix currently — Sprint 2.3 handles this

---

## Sprint 3: Citation Integration

**Goal:** Slides include APA 7th edition citations. References slide(s) appended outside the user's slide count target. Depends on Sprint 1.1 (markdown fix — citations use bold/italic).

### 3.1 — Integrate Citation Prompt into Generation

**File:** `src/lib/ai/llm/prompts.ts` — `buildGeneratePrompt()` function

**Add new section** to the generation prompt (from `docs/generation-prompts.md`):
```
## Citation Requirements
Add evidence-based citations (2020–2025) using APA 7th edition format:
- Density: 1–2 in-text citations per content slide where specific claims need evidence
- Format: In-text (Author, Year) with full references on dedicated References slide(s)
- Sources: Peer-reviewed journals, major health orgs (APA, SAMHSA, NIMH, NAMI, CDC, WHO), systematic reviews/meta-analyses
- Skip citations on: title/welcome slides, thank you/closing, test/assessment placeholders, practice scenarios, local resource slides, reflection/discussion prompts
- Weave citations naturally — don't disrupt flow, tone, or accessibility level

IMPORTANT: The References slide(s) at the end are EXTRA — they do NOT count toward the target slide count of ${slideCount}. If the user requests 20 slides, generate 20 content slides PLUS References slide(s) after.
```

### 3.2 — Post-Process: Tag References Slides

**File:** `src/server/api/routers/deck.ts` — after LLM returns slides

After parsing and validation, scan for References slides and tag them:
```typescript
const slides = parsedSlides.map(slide => {
  if (slide.title.toLowerCase().includes("reference") && slide.type !== "title") {
    return { ...slide, type: "references" as const };
  }
  return slide;
});
```

Update the Zod schema in `src/lib/ai/types.ts` to add `"references"` to the slide type enum.

### 3.3 — Exclude References from Slide Count Display

**File:** `src/server/api/routers/deck.ts` — when storing `slideCount`

```typescript
const contentSlides = slides.filter(s => s.type !== "references");
await db.update(decks).set({ slideCount: contentSlides.length, slides });
```

**File:** `src/app/admin/slides/[deckId]/page.tsx` — slide count display

Show "20 slides + 2 references" instead of "22 slides" in the UI.

### 3.4 — Render References Slides

References slides should render with `type: "references"` using a compact layout:
- Smaller font size (text-xs or text-sm)
- No image prompt (strip via cleanImagePrompts)
- Full layout, single column
- APA formatting preserved via MarkdownRenderer (italic journal names, etc.)

**File:** `src/components/slides/slide-renderer.tsx` — add References type handling

---

## Sprint 4: Provider & Settings Cleanup

**Goal:** Only working providers shown. Settings consistent between creation and editing. Can run in parallel with Sprints 2-3.

### 4.1 — Remove Unimplemented Providers from UI

**File:** `src/lib/ai/providers-config.ts`

Remove from `LLM_PROVIDERS`:
- Google Gemini (no implementation in `llm/index.ts`)
- DeepSeek (no implementation)

Remove from `IMAGE_PROVIDERS`:
- Stability AI (no implementation in `image/index.ts`)
- Replicate (no implementation)

Keep only providers that have actual implementations registered.

### 4.2 — Filter Creation Wizard to Configured Providers Only

**File:** `src/app/admin/slides/new/page.tsx`

Currently shows ALL providers including unconfigured ones. Change to filter like the DeckSettingsPanel does:
```typescript
const configuredLlmProviders = LLM_PROVIDERS.filter(p => p.configured);
const configuredImageProviders = IMAGE_PROVIDERS.filter(p => p.configured);
```

### 4.3 — Add Provider Preferences to Settings Page

**File:** `src/app/admin/settings/page.tsx`

Add a "Generation Preferences" section with:
- Default LLM Provider (card selector, like creation wizard)
- Default Image Provider (card selector)
- Default Fidelity (verbatim/balanced/creative)
- Default Tone (professional/conversational/academic/training)
- Custom Instructions (textarea, 500 char limit)
- Save button → calls `deck.setPreferences` mutation

This lets users set defaults without opening a deck.

### 4.4 — Align Editing Settings with Creation

**File:** `src/components/slides/deck-settings-panel.tsx`

Currently editing cannot change LLM provider for regeneration — it uses saved preferences or the deck's original provider. Add:
- LLM provider selector (same as creation)
- Image provider selector (same as creation)
- These override the saved preference for THIS regeneration only

**File:** `src/server/api/routers/deck.ts` — `regenerate` mutation

Accept optional `llmProvider` and `imageProvider` overrides:
```typescript
llmProvider: z.enum(["openai", "anthropic"]).optional(),
imageProvider: z.enum(["dalle3", "gpt-image-1", "disabled"]).optional(),
```

### 4.5 — Wire xAI/Grok as LLM Provider

**Files:**
- Create `src/lib/ai/llm/xai.ts` — xAI/Grok implementation
  - Model: `grok-2` or appropriate model
  - API key: `XAI_API_KEY` (already in env)
  - xAI uses OpenAI-compatible API format
- Register in `src/lib/ai/llm/index.ts`
- Add to `src/lib/ai/providers-config.ts` with metadata
- Add `XAI_API_KEY` to `src/env.js` validation

### 4.6 — Future: Wire Additional Image Providers

When ready, implement:
- `src/lib/ai/image/stability.ts` — Stability AI (API key: `STABILITY_API_KEY`)
- `src/lib/ai/image/replicate.ts` — Replicate (API token: `REPLICATE_API_TOKEN`)
- `src/lib/ai/image/leonardo.ts` — Leonardo (API key: `LEONARDO_API_KEY`)

Each needs:
- Implementation file with `generateImage(prompt): Promise<Buffer>` method
- Registration in `image/index.ts`
- Entry in `providers-config.ts`
- Env var in `src/env.js`

**Not in scope for this sprint** — do after core providers are solid.

---

## Sprint 5: Deck List Overhaul

**Goal:** Deck management feels like a real product. Sorting, filtering, grouping, group theme editing.

### 5.1 — Schema: Add Deck Groups

**File:** `src/server/db/schema.ts`

```typescript
export const deckGroups = createTable("deck_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  themeId: text("theme_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Add `groupId` to `decks` table:
```typescript
groupId: uuid("group_id").references(() => deckGroups.id, { onDelete: "set null" }),
```

Add relations for deckGroups ↔ decks and deckGroups ↔ profiles.

Run migration via Supabase SQL editor or `db:push`.

### 5.2 — Router: Deck Group CRUD

**File:** `src/server/api/routers/deck.ts` (or new `deck-groups.ts` router)

Add mutations:
- `createGroup({ name, themeId? })` → insert into deck_groups
- `updateGroup({ id, name?, themeId? })` → update deck_groups
- `deleteGroup({ id })` → delete group, decks get groupId=null
- `assignDecksToGroup({ deckIds[], groupId })` → bulk update decks.groupId
- `applyGroupTheme({ groupId })` → update all decks in group with group's themeId

Add queries:
- `listGroups()` → all groups for current user with deck count
- Update `list` query to support `groupId` filter

### 5.3 — Rebuild Deck List Page

**File:** `src/app/admin/slides/page.tsx`

Replace card grid with sleeker row-based layout:

**Top bar:**
- Search input (by title/description)
- Status filter pills (All, Draft, Ready, Generating, Error)
- Group filter dropdown
- Sort selector (Title, Created, Updated, Slide Count, Status) with direction toggle
- Page size selector + pagination

**Group sections:**
- Decks grouped by their group (ungrouped decks in "Uncategorized" section)
- Each group has a header with name, deck count, theme badge, expand/collapse
- Group header has: rename, set theme (applies to all decks), delete group
- Drag-to-reorder decks within groups (nice-to-have)

**Deck rows:**
- Title (truncated), status badge, slide count, provider badge, theme badge, date
- Hover: delete, move to group, open
- Checkbox for multi-select (bulk move to group, bulk theme change, bulk delete)

**Empty state:** Icon + "Create your first deck" CTA

### 5.4 — Group Theme Editing

When user sets a theme on a group:
1. Confirmation dialog: "Apply [Theme] to all X decks in [Group]?"
2. Calls `applyGroupTheme` mutation
3. Updates all decks in group with new themeId
4. Toast: "Theme applied to X decks"

New decks created while a group is selected auto-inherit the group's theme.

---

## Sprint 6: YouTube & Advanced Features

**Goal:** Video recommendations, bulk generation, quality checks.

### 6.1 — YouTube Video Recommendations

**Schema:** `videoRecs` field already exists on `decks` table (JSONB, currently unused).

**Implementation:**
- Add `generateVideoRecs` mutation to deck router
- Use LLM to generate 3-5 relevant YouTube search queries per deck based on content
- Use YouTube Data API v3 (`YOUTUBE_API_KEY` available) to search and return video metadata
- Store results in `videoRecs` field: `[{ title, videoId, thumbnail, channelName }]`
- Add collapsible "Video Resources" panel in deck viewer
- Each video: thumbnail, title, channel, "Open in YouTube" link

### 6.2 — Bulk Upload

**Implementation:**
- Add "Bulk Upload" option to creation wizard
- Accept multiple files (drag & drop zone)
- Each file becomes a separate deck with auto-detected title
- Shared settings (provider, fidelity, tone, theme) applied to all
- Queue-based generation (one at a time to avoid API rate limits)
- Progress UI showing status of each deck in the batch

### 6.3 — Auto-Review / Coherence Check

**Implementation:**
- Add `reviewDeck` mutation
- Send generated slides back to LLM with review prompt
- Check for: content accuracy, flow between slides, consistent tone, missing topics
- Return structured feedback: `[{ slideId, issue, suggestion, severity }]`
- Display in deck viewer as inline annotations
- User can accept/dismiss each suggestion

---

## Dependency Graph

```
Sprint 1 (Foundation) ─── MUST BE FIRST
  │
  ├── Sprint 2 (Images) ← depends on 1.4 (style-prompt.ts)
  │
  ├── Sprint 3 (Citations) ← depends on 1.1 (markdown fix for citation rendering)
  │
  └── Sprint 4 (Providers) ← can parallel with 2 & 3

Sprint 5 (Deck List) ← fully independent, can start anytime

Sprint 6 (YouTube/Advanced) ← after 1-4 are solid
```

**Parallel opportunities:**
- Sprints 2 + 3 + 4 can all run after Sprint 1 completes
- Sprint 5 is fully independent of everything else
- Sprint 6 is last (depends on stable foundation)

---

## Presenter Mode Notes

Presenter mode is **production-ready** with minor polish items:

| Issue | Severity | Fix |
|-------|----------|-----|
| ESC closes presentation instead of help overlay when overlay is showing | Minor | Check overlay state in ESC handler, close overlay first |
| Help overlay missing `aria-modal="true"` | Minor | Add attribute |
| Notes panel cramped on small screens (<600px height) | Minor | Acceptable — desktop-primary feature |
| Audience sync has ~ms race during popup open | Negligible | No fix needed |

These are tracked in TODO.md but not blocking production.

---

## Current Provider Inventory

### Implemented & Working
| Provider | Type | Model | API Key |
|----------|------|-------|---------|
| OpenAI | LLM | gpt-4o | `OPENAI_API_KEY` |
| Anthropic | LLM | claude-sonnet-4-5-20250929 | `ANTHROPIC_API_KEY` |
| DALL-E 3 | Image | dall-e-3 | `OPENAI_API_KEY` |
| GPT Image 1 | Image | gpt-image-1 | `OPENAI_API_KEY` |

### API Keys Available (Not Yet Wired)
| Provider | Type | API Key Env Var | Sprint |
|----------|------|-----------------|--------|
| xAI/Grok | LLM | `XAI_API_KEY` | Sprint 4.5 |
| Stability AI | Image | `STABILITY_API_KEY` | Sprint 4.6 (future) |
| Replicate | Image | `REPLICATE_API_TOKEN` | Sprint 4.6 (future) |
| Leonardo | Image | `LEONARDO_API_KEY` | Sprint 4.6 (future) |
| YouTube | Video | `YOUTUBE_API_KEY` | Sprint 6.1 |

### Shown in UI But Broken (Remove in Sprint 4.1)
- Google Gemini (LLM) — no implementation
- DeepSeek (LLM) — no implementation
- Stability AI (Image) — no implementation
- Replicate (Image) — no implementation

---

## Slide Data Shape Reference

```typescript
interface SlideData {
  id: string;
  order: number;
  type: "title" | "section" | "content" | "bullets" | "comparison"
        | "image" | "activity" | "quote" | "closing" | "references";
  title: string;
  body: string;           // Markdown OR :::block directives
  speakerNotes: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  layout: "full" | "split-left" | "split-right" | "centered"
          | "two-column" | "image-full" | "image-top";
}
```

**Image-eligible layouts:** `split-left`, `split-right`, `image-full`, `image-top`
**Non-image layouts:** `full`, `centered`, `two-column`

---

## Visual Block Types (21)

### Support Markdown (have MarkdownRenderer)
`info-box`, `numbered-steps`, `card-grid`, `chevron-flow`, `accent-list`

### Need Markdown Added (Sprint 1.1)
`flow-diagram`, `comparison-table`, `cycle`, `timeline`, `quote-block`, `highlight-box`, `checklist`, `icon-grid`

### Numeric Display (no markdown needed)
`key-stat`, `progress-bars`, `metric-row`

### Chart Blocks (no markdown, data only)
`bar-chart`, `pie-chart`, `line-chart`, `area-chart`, `radar-chart`

---

*Created: 2026-03-08*
*Based on: Deep audit of rendering, image generation, provider config, prompt pipeline, presenter mode, deck management*

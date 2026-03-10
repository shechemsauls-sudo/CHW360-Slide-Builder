# Slide Generation Settings & Prompt Architecture

> Review document — all settings, prompt structures, and defaults for single deck generation.

---

## 1. User-Facing Settings (New Deck Page)

| Setting | Type | Options / Range | Default |
|---------|------|----------------|---------|
| **Title** | Text input | Required | — |
| **Description** | Text input | Optional | — |
| **Source Content** | Textarea or file upload (PDF/DOCX) | Required | — |
| **Source Fidelity** | 3-way toggle | Balanced / Verbatim / Creative | Balanced |
| **Max Slides** | Slider | 5–200 | 70 |
| **Writing Tone** | 4-way selector | Training / Academic / Professional / Conversational | Training |
| **Custom Instructions** | Textarea | Max 500 chars | Empty |
| **Theme** | Theme selector card | 6 themes (see below) | chw-cream |

### Advanced Settings (collapsed by default)

| Setting | Options | Default |
|---------|---------|---------|
| **AI Text Provider** | Anthropic (Claude), OpenAI, xAI | Anthropic |
| **Image Generation** | Auto Mix, specific providers..., No Images | Auto Mix |
| **Visual Blocks** | Toggle + block type selector | Enabled (disabled in Verbatim mode) |

---

## 2. Saved Preferences (Settings Page)

These persist per-user in `provider_preferences` table and serve as defaults for new decks:

| Setting | Default |
|---------|---------|
| LLM Provider | anthropic |
| Image Provider | multi (Auto Mix) |
| Fidelity | balanced |
| Tone | training |
| Custom Instructions | empty |

**Ordering principle:** Default/recommended option always appears first in every selector. "No Images" / disabled options always appear last.

---

## 3. Available Themes

| ID | Name |
|----|------|
| chw-cream | Cream (warm beige bg) |
| chw-white | White |
| chw-black | Black |
| chw-slate | Slate |
| chw-teal | Teal |
| chw-green | Vibrant Health (green) |

Each theme defines: accent color, background, text, textMuted, headingColor, and an optional palette array for multi-color block components.

---

## 4. Prompt Architecture — Full Prompt Text

> Everything below is the **actual prompt text** sent to the LLM, sourced from `src/lib/ai/llm/prompts.ts`. Sections are assembled by `buildGeneratePrompt()` in this order.

---

### 4a. System Prompt (opening)

```
You are an expert presentation designer specializing in community health worker (CHW)
training materials.

Create a professional slide deck from the provided content. The deck should be
educational, engaging, and actionable for community health workers.
```

---

### 4b. Fidelity Instructions (one of three injected based on user selection)

Listed in display order (default first):

**Balanced (default):**
```
## Source Fidelity: BALANCED

Preserve the source content's meaning, structure, and key phrases. You may improve
formatting, add transitions between slides, and clarify awkward phrasing, but do NOT
substantially rewrite the content.

- Preserve the source document's own language and terminology
- Keep the original structure and ordering of topics
- You may split long sections into multiple slides or add section dividers
- Do NOT drop sections — include ALL content from the source
- Speaker notes should expand on slide content with teaching context, not repeat the body
- Prefer the source's exact phrasing when it is clear and effective
- **Visual blocks ARE encouraged** — reformatting content into :::block directives
  (checklists, info-boxes, charts, flow-diagrams, timelines, card-grids, etc.) is a
  formatting enhancement, NOT a rewrite. Use them naturally wherever they make the
  content clearer or more engaging.
```

**Verbatim:**
```
## Source Fidelity: VERBATIM

**CRITICAL: Transcribe the source content exactly as written.** Do NOT paraphrase,
summarize, or reword ANY text from the source document.

- Every slide's body text MUST use the original wording from the source document
- If the source has explicit slides or numbered sections, create a 1:1 mapping:
  source section N → output slide N
- Do NOT merge, split, or reorder source sections
- Do NOT drop any content — include ALL text from the source
- The AI's role is ONLY to: assign slide types, assign layouts, write speaker notes,
  and suggest image prompts
- Speaker notes should add teaching context and elaboration — do NOT repeat the slide
  body in notes
- Markdown formatting (bold, lists, headings) should reflect the source's own formatting
```

**Creative:**
```
## Source Fidelity: CREATIVE

Use the source content as inspiration. Restructure, summarize, and enhance freely to
create the most engaging and educational presentation possible.

- You may reorganize, merge, and rewrite content for maximum presentation impact
- Add transitions, summaries, and engagement hooks
- Optimize for audience understanding over source faithfulness
- Speaker notes should provide teaching guidance and discussion prompts
```

---

### 4c. Tone Instructions (one of four injected based on user selection)

Listed in display order (default first):

**Training (default):**
```
## Tone: Training / Instructor-Focused
Pedagogical scaffolding with step-by-step instruction. Include comprehension checks,
knowledge reinforcement, and "try it now" prompts.
```

**Academic:**
```
## Tone: Academic
Formal with citations-style references where applicable. Preserve technical terminology
and use structured argumentation.
```

**Professional:**
```
## Tone: Professional
Formal, clear, and evidence-based. Use precise language appropriate for clinical or
policy audiences. Avoid colloquialisms.
```

**Conversational:**
```
## Tone: Conversational
Warm, direct, and approachable. Use "you" and "we" freely. Best for community health
settings where trust and relatability matter.
```

---

### 4d. Custom Instructions

If provided, injected as:
```
## Custom Instructions
{user's text, max 500 chars}
```

---

### 4e. Visual Block System

**Conditional:** Only included when fidelity ≠ verbatim. If user selected specific block types, only those are documented; otherwise all 18 are included.

The prompt injects a `## Visual Block Components` section containing:

#### Per-block documentation (each block gets syntax + example + hint)

Example of what's injected for each block:

```
**:::info-box Title**
Colored callout box with a left accent border. Use for tips, notes, warnings, or
key definitions.
  :::info-box Key Definition
  A Community Health Worker (CHW) is a frontline health agent...
  :::
```

**All 18 blocks documented in prompt:**

| Block | Syntax | When to use (hint injected into prompt) |
|-------|--------|----------------------------------------|
| `info-box` | `:::info-box Title` | Definitions or key terms |
| `key-stat` | `:::key-stat Number Label` | Statistics or metrics |
| `numbered-steps` | `:::numbered-steps` | Step-by-step instructions |
| `flow-diagram` | `:::flow-diagram` | Processes or workflows (3-5 items, `->` separated) |
| `cycle` | `:::cycle` | Recurring processes or feedback loops (3-6 items) |
| `comparison-table` | `:::comparison-table` | Side-by-side comparisons (`\|` separated columns) |
| `checklist` | `:::checklist` | Action items or requirements |
| `quote-block` | `:::quote-block Attribution` | Quotes or testimonials |
| `highlight-box` | `:::highlight-box` | Key takeaways or emphasis |
| `timeline` | `:::timeline` | Phases or milestones (`Label: Description` per line) |
| `icon-grid` | `:::icon-grid` | Categories, roles, or features |
| `card-grid` | `:::card-grid` | Overview categories, pillars (`Title \| Description` per line, 3-4 items) |
| `chevron-flow` | `:::chevron-flow` | Sequential processes, pipelines (`Title \| Description` per line) |
| `accent-list` | `:::accent-list` | Features or categorized items (`Title \| Description` per line) |
| `bar-chart` | `:::bar-chart Title \| Series1, Series2` | Categorical comparisons (`Label: value` per line) |
| `pie-chart` | `:::pie-chart Title` | Proportions / percentage breakdowns |
| `line-chart` | `:::line-chart Title \| Series1, Series2` | Trends over time |
| `area-chart` | `:::area-chart Title \| Series1, Series2` | Cumulative / volume trends |
| `radar-chart` | `:::radar-chart Title` | Multi-factor assessments |
| `progress-bars` | `:::progress-bars Title` | Completion rates / goal progress |
| `metric-row` | `:::metric-row Title` | KPI summaries / dashboard metrics (`Value \| Label` per line) |
| `pill-list` | `:::pill-list` | **NEW** — Short labels, tags, skills, attributes (wrapping pill layout) |
| `stat-bubbles` | `:::stat-bubbles` | **NEW** — Key metrics in circular badges (`Value \| Label` per line) |
| `tag-cloud` | `:::tag-cloud` | **NEW** — Keywords/themes as weighted tag pills (`Term \| weight` per line) |
| `rounded-cards` | `:::rounded-cards` | **NEW** — Soft cards with large radii + shadows (`Title \| Description` per line) |

**If user selected specific blocks**, this restriction is appended:
```
IMPORTANT: Use ONLY these {N} block types. Do NOT use any other block types.
```

#### Block Strategy (unified — replaces previous scattered guidance)

This single section replaces 4 previously scattered block instructions (Block Usage Guidelines, Chart Guidelines, Critical Mandate, and Closing Reminder). All block guidance lives here.

```
## Block Strategy

Use :::block directives to make content visual, scannable, and engaging.

### Selection Rule
For each content slide, ask: "What visual structure best represents this content?"
- Steps or procedures → numbered-steps or chevron-flow
- Key data points → key-stat, metric-row, or progress-bars
- Categories or pillars → card-grid, icon-grid, or accent-list
- Processes or workflows → flow-diagram, cycle, or chevron-flow
- Comparisons → comparison-table
- Action items → checklist
- Emphasis or takeaways → highlight-box or info-box
- Quotes or testimonials → quote-block
- Chronological phases → timeline
- Short labels, tags, or skills → pill-list or tag-cloud
- Key metrics as visual focal points → stat-bubbles
- Soft overview cards → rounded-cards
- Numerical trends → bar-chart, line-chart, pie-chart, area-chart, radar-chart

### Structural Rules (MUST follow)
1. **No consecutive repeats** — never use the same block type on back-to-back slides.
   If you used :::checklist on slide 5, slide 6 must use a different block type or
   plain markdown.
2. **Variety minimums** — you must use at least this many DIFFERENT block types:
   - Decks under 15 slides: at least 5 different block types
   - Decks 15–40 slides: at least 8 different block types
   - Decks over 40 slides: at least 10 different block types
3. **Coverage** — use blocks on roughly half of content/bullets/activity slides.
   The other half should be clean markdown. Not every slide needs a block.
4. **Density** — 1–2 blocks per slide maximum. You may mix a block with regular
   markdown on the same slide, but never stack 3+ blocks.
5. **Scope** — blocks work on "content", "bullets", and "activity" slide types only.
   Do NOT use blocks on "title", "closing", or "references" slides.

### Chart & Data Blocks
- Charts require real numbers from the source content — never fabricate statistics
- Use bar-chart for categorical comparisons, pie-chart for proportions, line/area-chart
  for trends, radar-chart for multi-factor assessments
- Use progress-bars for completion rates and metric-row for KPI summaries
- Keep chart data concise: 3–8 data points for readability
- One chart per slide maximum
```

> **FLAG: More block types needed.** Client wants wider variety — specifically more rounded/curvy visual options. Current 18 block types may not offer enough visual diversity. Consider adding new block types with softer, more organic shapes (rounded cards, pill-shaped elements, curved separators, bubble layouts, etc.). See section 9 for details.

---

### 4f. Citation Requirements (injected in prompt)

```
## Citation Requirements
Add evidence-based citations (2020–2025) using APA 7th edition format.

**Rules:**
- **Density:** 1–2 in-text citations per content slide, only where specific claims
  need evidence
- **Format:** In-text (Author, Year) + full references on a References slide
- **Sources (priority order):**
  1. Peer-reviewed journals relevant to the topic
  2. Major health organizations (APA, SAMHSA, NIMH, NAMI, CDC, WHO)
  3. Systematic reviews and meta-analyses
  4. Recent research (2020–2025 preferred)

**Skip these slide types:**
- Title / welcome slides
- Thank you / closing slides
- Test / assessment placeholders
- Practice scenario / role-play slides
- Local resource slides (community-specific content)
- Reflection / discussion prompt slides

**Integration style:**
- Weave citations naturally into existing text
- Add brief evidence statements after visual layouts when appropriate
- Don't disrupt flow, tone, or accessibility level
- Maintain original voice

**CRITICAL:** You MUST include at least one (Author, Year) citation on every content
slide that makes a factual or evidence-based claim. If a slide presents data, statistics,
health guidance, or best practices, it MUST have a citation. Do not skip citations on
content slides.
```

> **NOTE (observed in practice):** Citations are not appearing in generated output despite being in the prompt. The current instruction is too easily overshadowed by block/layout/image rules. The strengthened "CRITICAL" enforcement above should help. When applying to code, consider placing the citation requirement closer to the output format section where LLM attention is highest.

```
IMPORTANT: The References slide(s) at the end are EXTRA — they do NOT count toward the
target slide count of {slideCount}. If the user requests {slideCount} slides, generate
{slideCount} content slides PLUS References slide(s) after. References slides should have
type "references", layout "full", and no imagePrompt.
```

---

### 4g. Slide Count Logic (injected in prompt)

```
## Slide Count

**IMPORTANT: If the source content already contains slide markers** (e.g., "Slide 1:",
"Slide 2:", numbered slides, or clear slide-by-side structure), you MUST follow that
structure exactly — create one output slide per source slide. The user's slide count
preference ({slideCount}) is secondary to the document's own structure.

If the source content does NOT contain slide markers (it's just prose, notes, or
unstructured text), generate up to {slideCount} slides (this is a maximum — use fewer
if the content doesn't warrant that many).
```

---

### 4h. Requirements Section (injected in prompt)

```
## Requirements

- First slide must be type "title" with the deck title
- Last slide must be type "closing" with key takeaways
- Use a mix of slide types: section, content, bullets, comparison, activity, quote
- Include "imagePrompt" on {imageRange} slides using ONLY image-eligible layouts
  (split-left, split-right, image-full, image-top)
- Use image-full for at least 1-2 dramatic visual slides (title, section dividers,
  or closing)
- Use image-top for content slides that benefit from a visual anchor
- Set imagePrompt to null on full and two-column layouts
```

**`getImageRange()` function** — calculates the image count range dynamically:
```typescript
function getImageRange(slideCount: number): string {
  const min = Math.max(5, Math.round(slideCount * 0.35));
  const max = Math.min(Math.max(10, Math.round(slideCount * 0.45)), 40);
  return `${min}-${max}`;
}
```
For 70 slides (new default): range = "25-32" slides with images.

**Updated** — now uses 35-45% range (centered on ~40%).

---

### 4i. Image Prompt Guidelines — Brand Style (injected in prompt)

```
## Image Prompt Guidelines — Brand Style
CRITICAL: All imagePrompt values MUST embody this visual style:
{IMAGE_STYLE_DIRECTIVE — see section 5a}

Additional rules:
- Always specify "warm natural lighting" and "brightly lit"
- Always include diversity in people (Hispanic, Black, Asian, Middle Eastern, all ages)
- Settings should feel like Texas community spaces
- Images must feel calm, supportive, and optimistic — never dark, dramatic, or clinical
- 1-2 sentence prompts only. No text in images.
- **NEVER request clipart or stock watermarks**: Avoid "clipart", "stock photo", "watermark"
```

---

### 4j. Speaker Notes + Body Content Rules (injected in prompt)

```
- Write structured speaker notes for every slide using this markdown format:

**Talking Points**
- Conversational, direct address ("you", "we") talking points that explain WHY, not
  just WHAT
- 2-5 points per slide, written as a natural speaking track
- Should elaborate on slide content, not repeat it verbatim

**Presenter Tips**
- Delivery mechanics: timing, group activities, facilitation prompts, engagement questions
- Include on activity/discussion slides; optional on pure content slides

**Transition**
"A quoted bridge sentence leading into the next slide's topic."

Guidelines for speaker notes:
- Talking Points are REQUIRED on every slide
- Presenter Tips are encouraged on activity, section, and interactive slides
- Transition is optional — use on section boundaries and topic shifts
- Use a warm, pedagogical tone throughout
- Body content should use Markdown formatting (bold, lists, etc.)
- Keep slide titles concise (under 10 words)
- Keep bullet points to 4-6 per slide maximum
```

**Block reference** (also in this section of prompt):
```
- **CRITICAL: Follow the Block Strategy rules above.** Use blocks on roughly half of
  content/bullets/activity slides. Never repeat the same block type on consecutive slides.
  Meet the variety minimum for this deck size. The presentation must feel visually rich
  and professionally designed.
```

---

### 4k. Slide Types (injected in prompt)

```
## Slide Types
- **title**: Opening slide with deck title and subtitle in body
- **section**: Section divider introducing a new topic
- **content**: Paragraph-style educational content
- **bullets**: Key points as bullet list
- **comparison**: Two-column comparison (use "two-column" layout)
- **activity**: Interactive exercise or discussion prompt
- **quote**: Notable quote or statistic
- **closing**: Summary and key takeaways
- **references**: APA 7th edition reference list (appended after closing, EXTRA slides
  outside target count)
```

---

### 4l. Layouts (injected in prompt)

```
## Layouts
- **full**: Content fills the slide, left-aligned (NO imagePrompt)
- **split-left**: Image left, content right (supports imagePrompt)
- **split-right**: Content left, image right (supports imagePrompt)
- **two-column**: Side-by-side columns for comparisons (NO imagePrompt)
- **image-full**: Full-bleed background image with dark gradient overlay + white text
  overlay at bottom. Great for title, section, and closing slides.
  (supports imagePrompt — REQUIRED)
- **image-top**: Image spans full width at top (40% height), content below. Good for
  content slides that need a visual anchor. (supports imagePrompt — REQUIRED)

**CRITICAL IMAGE RULE**: Only these 4 layouts support images: split-left, split-right,
image-full, image-top. Set imagePrompt to null on all other layouts (full, two-column).
image-full and image-top MUST have an imagePrompt.
**TEXT ALIGNMENT**: All text must be left-aligned. Never center body text.
```

**Updated** — `centered` layout removed from prompt. Left-align rule added.

**Text alignment rule:** All layouts use left-aligned text. No centered body text.

---

### 4m. Deck Info + Source Content (injected in prompt)

```
## Deck Info
Title: {input.title}
Description: {input.description}    ← only if provided

## Source Content
{input.content}
```

---

### 4n. Output Format + Example (injected in prompt)

```
## Output Format
Return a JSON object with a "slides" array. Each slide has: id, order, type, title,
body, speakerNotes, imageUrl, imagePrompt, layout.
```

**Example slides included in prompt** (teaches correct block usage with `\n` for newlines):

```json
{
  "slides": [
    {
      "id": "slide-1",
      "order": 1,
      "type": "title",
      "title": "Training Program Overview",
      "body": "Building healthier communities through skilled CHW practice",
      "speakerNotes": "**Talking Points**\n- Welcome to the training...\n\n**Presenter Tips**\n- Ask participants to share one challenge...\n\n**Transition**\n\"Let's start by looking at what we'll cover today.\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "full"
    },
    {
      "id": "slide-2",
      "order": 2,
      "type": "bullets",
      "title": "Learning Objectives",
      "body": ":::checklist\nExplain why organizational skills are essential\nIdentify core tasks performed by CHWs\nRecognize how organization supports accountability\nDescribe strategies for organizing time and information\n:::",
      "speakerNotes": "**Talking Points**\n- By the end of this session...\n\n**Transition**\n\"Let's begin with understanding the core responsibilities...\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "full"
    },
    {
      "id": "slide-3",
      "order": 3,
      "type": "content",
      "title": "Key Responsibilities",
      "body": "CHWs manage multiple organizational tasks daily:\n\n:::numbered-steps\nSchedule and track appointments\nDocument client interactions\nCoordinate referrals with partners\nFollow up on pending cases\n:::",
      "speakerNotes": "**Talking Points**\n- Each of these four tasks happens every single day...\n\n**Presenter Tips**\n- Ask: \"Which of these four tasks do you find most challenging?\"",
      "imageUrl": null,
      "imagePrompt": "A CHW organizing files at a desk",
      "layout": "split-right"
    },
    {
      "id": "slide-4",
      "order": 4,
      "type": "content",
      "title": "Program Impact",
      "body": ":::metric-row\n2,450 | Households Visited\n95% | Follow-up Rate\n12 | Active CHWs\n:::\n\n:::info-box Key Insight\nOrganized CHWs achieve 40% higher follow-up rates than their peers.\n:::",
      "speakerNotes": "**Talking Points**\n- These numbers tell a powerful story...\n\n**Transition**\n\"Now let's look at the specific strategies that drive these results.\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "full"
    }
  ]
}
```


**Closing instructions** (end of prompt):
```
Follow this exact pattern. Use :::block-type on the FIRST line, content on subsequent
lines, and ::: alone to close. Separate with \n.

**REMINDER:** Follow the Block Strategy — no consecutive repeats, meet variety minimums,
match each block type to the content it represents.
```

---

### 4o. Regenerate Single Slide Prompt (`buildRegeneratePrompt`)

Separate prompt used when user edits a single slide via the feedback panel:

```
You are an expert presentation designer. Regenerate this single slide based on
user feedback.

{TONE_INSTRUCTIONS[tone]}
{Custom Instructions if provided}

## Current Slide
{JSON of current slide}

## Context
Deck Title: {deckTitle}
Previous Slide: "{prevSlide.title}"    ← or "This is the first slide."
Next Slide: "{nextSlide.title}"        ← or "This is the last slide."

## User Feedback
{user's feedback text}

## Instructions
Return a single slide JSON object with the same structure (id, order, type, title,
body, speakerNotes, imageUrl, imagePrompt, layout). Keep the same id and order. Apply
the user's feedback while maintaining consistency with surrounding slides.

Return ONLY the JSON object, no wrapper.
```

**Notable:** The regenerate prompt does NOT include fidelity instructions, block documentation, citation requirements, or image style guidelines. It only gets tone + custom instructions + context. This means regenerated slides may not follow block/citation/image conventions unless the user explicitly asks for them in their feedback.

---

### 4p. Image Prompt Generation (`generateImagePrompt` mutation in deck.ts)

When a user manually requests an image prompt for a slide that doesn't have one, the LLM is called with this prompt (defined inline in the deck router, not in prompts.ts):

```
Generate a concise image prompt (1-2 sentences) for an AI image generator.

REQUIRED STYLE: {IMAGE_STYLE_DIRECTIVE}

The image should be warm, brightly lit, and optimistic. Never dark or dramatic.
No text in the image.

Slide title: {slide.title}
Slide content: {slide.body, first 500 chars}

Respond with ONLY the image prompt, no explanation.
```

**Notable:** This prompt does NOT include the full brand rules from the main generation prompt (no diversity directive, no Texas-specific settings, no clipart/watermark restrictions). It relies on `IMAGE_STYLE_DIRECTIVE` alone.

---

### 4q. YouTube Video Recommendations (`generateVideoRecs` mutation in deck.ts)

Uses the LLM to generate targeted YouTube search queries based on deck content:

```
You are helping find YouTube training videos for Community Health Workers (CHWs).
Based on this training deck titled "{deck.title}", generate exactly 5 YouTube
search queries.

Requirements for each query:
- Target CHW, community health, public health, or health education content
- Include terms like "community health worker", "CHW training", "public health",
  or "health education" where relevant
- Each query should cover a different key topic from the deck
- Prefer queries that would return professional training content, not general
  consumer health info
- Keep queries concise (5-10 words) for best YouTube results

Deck content:
{first 10 slides, title + first 100 chars of body each}

Respond with exactly 5 search queries, one per line. No numbering, no bullets,
just the queries.
```

Results are then searched via YouTube Data API v3 with `videoCategory: "27"` (Education), `safeSearch: "strict"`, `videoDuration: "medium"`, and `relevanceLanguage: "en"`. Each query returns up to 3 results, deduplicated by videoId.

---

## 5. Image Generation Pipeline

### 5a. Style Directive (IMAGE_STYLE_DIRECTIVE)

Core directive applied to all images:
> Warm natural lighting, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, gyms, cafeterias, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.

### 5b. Shared Constraints (all styles)

> Bright, well-lit, high exposure, airy, luminous. Clean minimal design, smooth edges. Never dark, moody, or dramatic. No text or words in images.

### 5c. Image Style

**Realistic only** — all images are photorealistic. Abstract styles (geometric, organic) have been removed.

Photorealistic, brightly lit — combines shared constraints + style directive.

~~**Abstract Geometric**~~ — **REMOVED**
~~**Abstract Organic**~~ — **REMOVED**

### 5d. Multi-Engine Strategy (Auto Mix)

All images use **realistic** style. Engine selection picks the best photorealism engine available:
- Primary: replicate (FLUX) — strength rating 5
- Fallback: leonardo (4), then stability/gpt-image-1/dalle3 (3)

No style rotation — all realistic.

### 5e. Engine Strength Ratings

| Engine | Realistic | Abstract |
|--------|-----------|----------|
| replicate (FLUX) | 5 | 2 |
| leonardo | 4 | 3 |
| stability | 3 | 4 |
| gpt-image-1 | 3 | 5 |
| dalle3 | 3 | 4 |

### 5f. Prompt Enhancement

Before sending to image engine, `enhanceImagePrompt()` wraps the LLM-generated `imagePrompt` with the appropriate style prefix based on the cycle position.

---

## 6. Generation Flow — 3-Pass Architecture

### Overview

```
User fills form → tRPC `generate` mutation
  ↓
Creates deck (status: "generating")
  ↓
Returns deck ID immediately
  ↓
Background: generateDeckInBackground()
  ├── Parse content (markdown/PDF/DOCX)
  │
  ├── PASS 1: Content & Structure
  │     ├── Input: source content + fidelity + tone + slide count + custom instructions
  │     ├── LLM generates: type, title, body (plain markdown), layout
  │     └── Output: structured slides with content — no blocks, no images, no citations
  │
  ├── PASS 2: Visual & Media Enhancement
  │     ├── Input: Pass 1 slides + Block Strategy (22 types) + image style directive
  │     ├── LLM enhances: apply :::block directives, generate imagePrompts (~40%),
  │     │   assign image-eligible layouts, write speaker notes
  │     └── Output: visually rich slides ready for review
  │
  ├── PASS 3: Citation & Quality Enforcement
  │     ├── Input: Pass 2 slides (full deck) + citation requirements
  │     ├── LLM reviews: weave (Author, Year) citations, append References slide(s),
  │     │   verify block variety minimums, fix consecutive repeats, check image coverage
  │     └── Output: final polished slides
  │
  ├── Post-process: tagReferenceSlides()
  ├── Update deck with slides (status: "ready")
  ├── generateImagesForDeck() (fire-and-forget)
  │     ├── For each slide with imagePrompt:
  │     │     ├── Pick engine via getMultiEngineConfig() (realistic only)
  │     │     ├── enhanceImagePrompt() → wrap with realistic prefix
  │     │     ├── Call image provider
  │     │     └── Upload to storage, update slide
  │     └── Continue on individual failures
  └── Send completion email
```

### Pass 1: Content & Structure

**Goal:** Get the content right. Structure it well. Assign layouts.

**Prompt includes:**
- System context (CHW training expert)
- Fidelity instructions (verbatim/balanced/creative)
- Tone instructions (training/academic/professional/conversational)
- Custom instructions (if provided)
- Slide count logic (follow markers or generate up to max)
- Slide types & layout definitions
- Output format (JSON with type, title, body, layout)

**Prompt does NOT include:**
- Block documentation or Block Strategy (no :::directives yet)
- Image prompt guidelines or style directive (no imagePrompt yet)
- Citation requirements (no citations yet)
- Speaker notes format (no speakerNotes yet)

**Output:** Slides with plain markdown body text, correct types, logical layouts, no blocks, no images, no citations, no speaker notes.

**Why:** The LLM focuses entirely on content fidelity and structure. In Balanced/Verbatim mode, this is the most critical step — preserving the user's words. No competing instructions to dilute attention.

### Pass 2: Visual & Media Enhancement

**Goal:** Make it visually rich and presentation-ready.

**Prompt includes:**
- Pass 1 slides (full JSON)
- Block documentation (all 22 types with syntax + hints)
- Block Strategy (selection rule, structural rules, variety minimums, no consecutive repeats)
- Image prompt guidelines + IMAGE_STYLE_DIRECTIVE (brand style, ~40% coverage)
- Speaker notes format (talking points, presenter tips, transitions)
- Layout adjustment rules (may upgrade a `full` to `split-right` if adding an image)

**Prompt does NOT include:**
- Source content (already processed in Pass 1)
- Fidelity/tone instructions (content is already set)
- Citation requirements (next pass)

**Output:** Slides with :::block directives in body, imagePrompt on ~40% of slides, speaker notes on every slide, possibly adjusted layouts for image-eligible slides.

**Why:** The LLM can focus entirely on visual enhancement. It sees the complete slide set and can make variety decisions across the whole deck. Block Strategy rules (no consecutive repeats, variety minimums) are enforceable because the LLM has all slides in context.

### Pass 3: Citation & Quality Enforcement

**Goal:** Enforce cross-slide quality rules with full deck visibility.

**Prompt includes:**
- Pass 2 slides (full JSON — complete with blocks, images, notes)
- Citation requirements (APA 7th, sources priority, skip list, integration style)
- Quality checklist:
  - Every content slide with factual claims has (Author, Year)?
  - Block variety minimum met for this deck size?
  - No consecutive slides using same block type?
  - Image coverage ~40%?
  - All image-eligible layouts have imagePrompt?
  - All non-image layouts have imagePrompt: null?

**Output:** Final slides with citations woven in, References slide(s) appended, any quality violations fixed.

**Why:** This is a review pass, not a generation pass. The LLM has the complete deck and can count, verify, and fix. Citations are best added last because they need to see the final body text (after blocks have been applied). Quality enforcement requires the full picture.

### Cost & Performance

| Pass | LLM Work | Relative Cost |
|------|----------|---------------|
| Pass 1 | Generate content from source | ~1.0x (heaviest — original content generation) |
| Pass 2 | Enhance existing slides | ~0.7x (transformation, not generation) |
| Pass 3 | Review & weave citations | ~0.5x (lightest — surgical edits) |
| **Total** | | **~2.2x** current single-pass cost |

Generation time increases but runs in background — user experience unchanged. Each pass can retry independently on failure.

---

## 7. Caps & Limits (all locations)

### UI Caps (new deck page)

| Cap | Value | Status |
|-----|-------|--------|
| Slide count slider range | 5–200 | OK |
| Slide count default | **20** | **NEEDS UPDATE → 70** |
| Custom instructions | max 500 chars | OK |

### Server Validation (deck.ts — Zod schemas)

| Cap | Value | Status |
|-----|-------|--------|
| Slide count | min 5, max 200 | OK |
| Custom instructions | max 500 chars | OK |
| Title | max 255 chars | OK |
| Image focal point x/y | 0–100 | OK |
| Bulk upload files | max 10 | OK |
| Bulk delete decks | max 50 | OK |
| Page size | 5–100 (default 25) | OK |
| Group name | max 100 chars | OK |
| Regenerate slideCount fallback | **20** | **NEEDS UPDATE → 70** |

### Prompt Caps (prompts.ts)

| Cap | Value | Status |
|-----|-------|--------|
| slideCount fallback | 70 | OK (updated) |
| Image range function | 35-45%, floor 5, ceiling 40 | OK (updated) |
| Bullet points per slide | 4-6 max (soft, in prompt) | OK |
| Blocks per slide | 1-3 max (soft, in prompt) | OK |

### Content Truncation (deck.ts — slicing for LLM context)

| Context | Chars | Location |
|---------|-------|----------|
| Image prompt generation | slide.body sliced to 500 | deck.ts line 710 |
| Video recs | slide.body sliced to 100 | deck.ts line 1148 |
| AI review | slide.body sliced to 300 | deck.ts line 1235 |
| Video search queries | first 10 slides only | deck.ts line 1147 |
| YouTube results | max 5 queries, 3 results each, deduped, capped at 8 | deck.ts lines 1173, 1201 |

---

## 8. Resolved Items

1. ~~**Tone default mismatch**~~ — Unified to "training" everywhere (new deck page + saved preferences)
2. ~~**Fidelity default**~~ — Unified to "balanced" everywhere
3. ~~**Max slides default**~~ — Changed from 20 → 70
4. ~~**Option ordering**~~ — Default options appear first in all selectors; disabled/"No Images" appears last
5. ~~**Remove centered layout**~~ — Dropped from available layouts; LLM prompt updated to exclude it
6. ~~**Left-align all text**~~ — All layouts use left-aligned body text, no centered text anywhere
7. ~~**Image percentage**~~ — Changed from 25-35% → ~40% of content slides
8. ~~**All images realistic**~~ — Removed abstract geometric and abstract organic styles; all images are photorealistic only
9. ~~**No style rotation**~~ — Multi-engine strategy simplified to always pick best photorealism engine

## 9. Remaining Review Points

1. ~~**Block mandate strength**~~ — Resolved: unified Block Strategy with scaled variety minimums (4/6/8) and "roughly half" instead of hard 50%
2. ~~**Citation requirement**~~ — Resolved: refined with priority-ordered sources, explicit skip list, integration style guidance, and CRITICAL enforcement for content slides making factual claims. Also noted: citations not appearing in practice — prompt placement needs strengthening when applying to code
3. ~~**Fidelity + blocks interaction**~~ — Resolved: Balanced mode reformatting content into blocks is acceptable. Keep current behavior.
4. ~~**Style directive is Texas-specific**~~ — Intentional for current client (Shechem/CHW360). Keep as-is.
5. ~~**Speaker notes always generated**~~ — Resolved: always generate notes. Keep as-is.
6. ~~**Custom instructions max 500 chars**~~ — Resolved: expand to 1000 chars
7. ~~**No per-slide type/layout control**~~ — Resolved: not needed. Keep as-is.
8. ~~**NEW BLOCK TYPES**~~ — Resolved: 4 new block types confirmed, variety minimums bumped. See details below.

### New Block Types (confirmed to build)

| Block | Syntax | Visual Style | Use Case |
|-------|--------|-------------|----------|
| `pill-list` | `:::pill-list` | Rounded pill/capsule items in a wrapping layout | Tags, categories, skills, attributes — items that are short labels |
| `stat-bubbles` | `:::stat-bubbles` | Circular badges with large numbers inside | 2-4 key metrics displayed as prominent circles |
| `tag-cloud` | `:::tag-cloud` | Wrapped tag pills of varying sizes based on emphasis | Keywords, themes, topics — visual weight conveys importance |
| `rounded-cards` | `:::rounded-cards` | Cards with large border-radius, soft shadows, subtle gradients | Same use cases as card-grid but softer/more organic feel |

**Format for each:**
- `pill-list`: one item per line (label only, or `Label | Description`)
- `stat-bubbles`: `Value | Label` per line (like metric-row but circular)
- `tag-cloud`: one term per line, optionally `Term | weight` (1-3, controls size)
- `rounded-cards`: `Title | Description` per line (like card-grid)

**Additionally:** Audit existing blocks (icon-grid, card-grid, checklist) for rounder styling — increase border-radius across the board.

**Total block count after additions: 22**

### Updated Variety Minimums

With 22 block types available:

| Deck Size | Minimum Different Block Types | % of Available |
|-----------|-------------------------------|----------------|
| Under 15 slides | at least 5 | 23% |
| 15–40 slides | at least 8 | 36% |
| Over 40 slides | at least 10 | 45% |

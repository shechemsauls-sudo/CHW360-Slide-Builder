# Slide Generation Guidelines — Source of Truth

> Canonical reference for all generation settings, prompt architecture, block types, image pipeline, and quality rules. All code changes must conform to this document.

---

## 1. User-Facing Settings

### New Deck Page

| Setting | Type | Options / Range | Default |
|---------|------|----------------|---------|
| **Title** | Text input | Required | — |
| **Description** | Text input | Optional | — |
| **Source Content** | Textarea or file upload (PDF/DOCX) | Required | — |
| **Source Fidelity** | 3-way toggle | Balanced / Verbatim / Creative | Balanced |
| **Max Slides** | Slider | 5–200 | 70 |
| **Writing Tone** | 4-way selector | Training / Academic / Professional / Conversational | Training |
| **Custom Instructions** | Textarea | Max 1000 chars | Empty |
| **Theme** | Theme selector card | 6 themes | chw-cream |

### Advanced Settings (collapsed by default)

| Setting | Options | Default |
|---------|---------|---------|
| **AI Text Provider** | Anthropic (Claude), OpenAI, xAI | Anthropic |
| **Image Generation** | Auto Mix, specific providers..., No Images | Auto Mix |
| **Visual Blocks** | Toggle + block type selector | Enabled (disabled in Verbatim mode) |

### Saved Preferences (per-user, `provider_preferences` table)

| Setting | Default |
|---------|---------|
| LLM Provider | anthropic |
| Image Provider | multi (Auto Mix) |
| Fidelity | balanced |
| Tone | training |
| Custom Instructions | empty |

**Ordering rule:** Default/recommended option always first. "No Images" / disabled options always last.

---

## 2. Themes

| ID | Name |
|----|------|
| chw-cream | Cream (warm beige bg) — default |
| chw-white | White |
| chw-black | Black |
| chw-slate | Slate |
| chw-teal | Teal |
| chw-green | Vibrant Health (green) |

Each theme defines: accent, background, text, textMuted, headingColor, optional palette array, optional gradient.

---

## 3. Slide Types & Layouts

### Slide Types

| Type | Purpose |
|------|---------|
| `title` | Opening slide with deck title and subtitle |
| `section` | Section divider introducing a new topic |
| `content` | Paragraph-style educational content |
| `bullets` | Key points as bullet list |
| `comparison` | Two-column comparison (use `two-column` layout) |
| `activity` | Interactive exercise or discussion prompt |
| `quote` | Notable quote or statistic |
| `closing` | Summary and key takeaways |
| `references` | APA 7th edition reference list (appended after closing, EXTRA slides outside target count) |

### Layouts

| Layout | Image Support | Notes |
|--------|--------------|-------|
| `full` | No | Content fills slide, left-aligned |
| `split-left` | Yes | Image left, content right |
| `split-right` | Yes | Content left, image right |
| `two-column` | No | Side-by-side columns for comparisons |
| `image-full` | Required | Full-bleed background image with dark gradient overlay |
| `image-top` | Required | Image spans full width at top (40% height), content below |

### Structural Slide Protocol

Title, section, and closing slides are cinematic **bookends** that frame the deck. They MUST use `image-full` layout with an imagePrompt — no exceptions. This creates a unified visual rhythm across all decks.

| Slide Type | Required Layout | Image |
|-----------|----------------|-------|
| `title` | `image-full` | Required |
| `section` | `image-full` | Required |
| `closing` | `image-full` | Required |
| `references` | `full` | None |
| All others | Any layout | Varies |

**Rules:**
- Only `split-left`, `split-right`, `image-full`, `image-top` support images
- `image-full` and `image-top` MUST have an imagePrompt
- Set imagePrompt to null on `full` and `two-column`
- All text is **left-aligned** — never center body text
- `centered` is legacy — mapped to `full` at render time (backward compat only)

---

## 4. Visual Block System (25 types)

### Block Syntax

```
:::block-type Optional Argument
Content here (one item per line, format varies by type)
:::
```

### Complete Block Reference

#### Text Blocks (18 types)

| Block | Syntax | Format | Use Case |
|-------|--------|--------|----------|
| `info-box` | `:::info-box Title` | Prose content | Definitions, tips, warnings, key terms |
| `key-stat` | `:::key-stat Number Label` | Single stat | Statistics or metrics (big number display) |
| `numbered-steps` | `:::numbered-steps` | One step per line | Step-by-step instructions, procedures |
| `flow-diagram` | `:::flow-diagram` | Items separated by `->` | Processes, workflows (3-5 items) |
| `cycle` | `:::cycle` | Items separated by `->` | Recurring processes, feedback loops (3-6 items) |
| `comparison-table` | `:::comparison-table` | `Header1 \| Header2` then `Cell \| Cell` per line | Side-by-side comparisons |
| `checklist` | `:::checklist` | `[x] Done item` or `[ ] Todo item` per line | Action items, requirements, checklists |
| `quote-block` | `:::quote-block Attribution` | Quote text | Quotes, testimonials |
| `highlight-box` | `:::highlight-box` | Prose content | Key takeaways, emphasis callouts |
| `timeline` | `:::timeline` | `Label: Description` per line | Phases, milestones, chronological events |
| `icon-grid` | `:::icon-grid` | One item per line | Categories, roles, features (auto letter icons) |
| `card-grid` | `:::card-grid` | `Title \| Description` per line (3-4 items) | Overview categories, pillars |
| `chevron-flow` | `:::chevron-flow` | `Title \| Description` per line | Sequential processes, pipelines |
| `accent-list` | `:::accent-list` | `Title \| Description` per line | Features, categorized items (colored left border) |
| `pill-list` | `:::pill-list` | `Label` or `Label \| Description` per line | Tags, categories, skills, short labels |
| `stat-bubbles` | `:::stat-bubbles` | `Value \| Label` per line (2-4 items) | Key metrics as circular badges |
| `tag-cloud` | `:::tag-cloud` | `Term` or `Term \| weight` per line (weight 1-3) | Keywords, themes, weighted topics |
| `rounded-cards` | `:::rounded-cards` | `Title \| Description` per line | Soft cards with large radii and gradients |

#### Chart Blocks (5 types — Recharts)

| Block | Syntax | Format | Use Case |
|-------|--------|--------|----------|
| `bar-chart` | `:::bar-chart Title \| Series1, Series2` | `Label: value1, value2` per line | Categorical comparisons |
| `pie-chart` | `:::pie-chart Title` | `Label: value` per line | Proportions, percentage breakdowns |
| `line-chart` | `:::line-chart Title \| Series1, Series2` | `Label: value1, value2` per line | Trends over time |
| `area-chart` | `:::area-chart Title \| Series1, Series2` | `Label: value1, value2` per line | Cumulative/volume trends |
| `radar-chart` | `:::radar-chart Title` | `Label: value` per line | Multi-factor assessments |

#### Data Blocks (2 types — CSS-only)

| Block | Syntax | Format | Use Case |
|-------|--------|--------|----------|
| `progress-bars` | `:::progress-bars Title` | `Label: percentage` per line | Completion rates, goal progress |
| `metric-row` | `:::metric-row Title` | `Value \| Label` per line | KPI summaries, dashboard metrics |

### Block Strategy (enforced in prompt)

#### Selection Rule
For each content slide, match the content to the best visual structure:
- Steps/procedures → `numbered-steps` or `chevron-flow`
- Key data points → `key-stat`, `metric-row`, or `progress-bars`
- Categories/pillars → `card-grid`, `icon-grid`, or `accent-list`
- Processes/workflows → `flow-diagram`, `cycle`, or `chevron-flow`
- Comparisons → `comparison-table`
- Action items → `checklist`
- Emphasis/takeaways → `highlight-box` or `info-box`
- Quotes/testimonials → `quote-block`
- Chronological phases → `timeline`
- Short labels/tags/skills → `pill-list` or `tag-cloud`
- Key metrics as visual focal points → `stat-bubbles`
- Soft overview cards → `rounded-cards`
- Numerical trends → `bar-chart`, `line-chart`, `pie-chart`, `area-chart`, `radar-chart`

#### Structural Rules (MUST follow)
1. **No consecutive repeats** — never use the same block type on back-to-back slides
2. **Variety minimums:**
   - Under 15 slides: at least 5 different block types
   - 15–40 slides: at least 8 different block types
   - Over 40 slides: at least 10 different block types
3. **Coverage** — use blocks on roughly half of content/bullets/activity slides
4. **Density** — 1–2 blocks per slide max. May mix a block with regular markdown.
5. **Scope** — blocks on `content`, `bullets`, `activity` slides only. Never on `title`, `closing`, `references`.

#### Chart & Data Rules
- Charts require real numbers from source — never fabricate statistics
- 3–8 data points for readability
- One chart per slide maximum

---

## 5. 2-Pass Generation Architecture

### Overview

```
User submits → tRPC `generate` mutation
  → Creates deck (status: "generating"), returns ID immediately
  → Background: generateDeckInBackground()
      ├── Parse content (markdown/PDF/DOCX)
      ├── PASS 1: Full generation (single LLM call from source content)
      ├── PASS 2: Server-side audit → targeted LLM fixes (chunked)
      │     ├── auditDeckQuality() — pure TypeScript, no LLM
      │     ├── Group violated slides into chunks of 2-3
      │     ├── Send fix prompts in parallel (only violated slides)
      │     └── Generate References slides if missing
      ├── Post-process: tagReferenceSlides()
      ├── Update deck (status: "ready")
      ├── generateImagesForDeck() (background)
      └── Send completion email
```

### Pass 1: Full Generation

**Goal:** Generate the complete deck in a single LLM call from raw source content.

**Includes:** Everything — fidelity, tone, custom instructions, block docs (all 25 types), image guidelines, citation requirements, speaker notes format, structural slide protocol, layout rules.

**Output:** Complete slides with :::blocks, imagePrompts, citations, speaker notes, correct layouts.

**Why:** The LLM works from source content (not JSON), so it has full creative context. No JSON-in → JSON-out bottleneck that kills block variety.

### Pass 2: Server-Side Audit + Targeted Fixes

**Goal:** Catch and fix quality violations deterministically, then use small LLM calls only for slides that need correction.

#### Step 1: `auditDeckQuality()` (TypeScript, no LLM)

Computes deck-wide stats and returns specific violations:

| Check | Detection | Violation Type |
|-------|-----------|---------------|
| Block variety < 10 types | Count unique `:::block-type` | `low-block-variety` |
| Consecutive same block | Compare dominant block N vs N+1 | `consecutive-same-block` |
| Bookend protocol | title/section/closing not `image-full` | `bookend-missing-image-full` |
| Image on non-eligible layout | imagePrompt on full/two-column | `image-on-non-eligible` |
| Missing image on eligible | No imagePrompt on image-full/image-top | `missing-image-on-eligible` |
| Image coverage < 30% | Count imagePrompt / content slides | `image-coverage-low` |
| Missing speaker notes | Empty speakerNotes | `missing-speaker-notes` |
| Missing citations | No (Author, Year) on content slides | `missing-citations` |
| No References slide | No type "references" | `missing-references` |

#### Step 2: Chunked LLM Fixes (parallel)

- Group violations by slide index
- Chunk into groups of 2-3 slides
- Each chunk gets a `buildQAFixPrompt` with specific instructions + deck stats
- Chunks run in parallel via `Promise.allSettled`
- Failed chunks are non-fatal (original slides preserved)

#### Step 3: References Generation

If no References slide exists, `buildReferencesPrompt` extracts citation patterns and generates APA 7th references.

**If zero violations → Pass 2 is skipped entirely.**

### Cost
| Component | Work | Relative Cost |
|-----------|------|---------------|
| Pass 1 | Full generation | ~1.0x |
| Audit | TypeScript scan | ~0x (no LLM) |
| Fix chunks | 0-5 small LLM calls | ~0.1-0.3x |
| References | 1 small LLM call | ~0.05x |
| **Total** | | **~1.0-1.35x** (down from 2.2x) |

Each LLM call retries once on failure.

---

## 6. Fidelity Modes

Listed in display order (default first):

| Mode | Behavior | Blocks? |
|------|----------|---------|
| **Balanced** (default) | Preserve meaning, structure, key phrases. May improve formatting, add transitions. Include ALL content. | Yes — reformatting into blocks is enhancement, not rewriting |
| **Verbatim** | Transcribe exactly as written. 1:1 section mapping. AI only assigns types, layouts, notes, images. | No |
| **Creative** | Use source as inspiration. Restructure, summarize, enhance freely. | Yes |

---

## 7. Tone Options

Listed in display order (default first):

| Tone | Style |
|------|-------|
| **Training** (default) | Pedagogical scaffolding, step-by-step, comprehension checks, "try it now" prompts |
| **Academic** | Formal, citations-style references, technical terminology, structured argumentation |
| **Professional** | Formal, clear, evidence-based, precise language for clinical/policy audiences |
| **Conversational** | Warm, direct, "you"/"we" freely, trust and relatability |

---

## 8. Image Pipeline

### Style Directive (IMAGE_STYLE_DIRECTIVE)

> Warm natural lighting, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, gyms, cafeterias, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.

### Image Rules
- **Realistic only** — all images are photorealistic. No abstract styles.
- Always specify "warm natural lighting" and "brightly lit"
- Always include diversity in people
- Settings should feel like Texas community spaces
- Images must feel calm, supportive, optimistic — never dark, dramatic, or clinical
- 1-2 sentence prompts only. No text in images.
- Never request clipart or stock watermarks

### Image Coverage
- Target ~40% of content slides (range: 35-45%)
- `getImageRange(slideCount)`: min = max(5, round(count * 0.35)), max = min(max(10, round(count * 0.45)), 40)
- For 70 slides: 25-32 slides with images

### Multi-Engine Strategy
All images use realistic style. Engine selection picks best photorealism engine:
- Primary: Replicate (FLUX) — strength 5
- Fallback: Leonardo (4), then Stability/gpt-image-1/DALL-E 3 (3)

### Prompt Enhancement
`enhanceImagePrompt()` wraps the LLM-generated `imagePrompt` with the realistic prefix + shared constraints before sending to image engine.

---

## 9. Citation Requirements

### Rules
- **Density:** 1-2 in-text citations per content slide where claims need evidence
- **Format:** In-text (Author, Year) + full references on References slide(s)
- **Sources (priority order):**
  1. Peer-reviewed journals relevant to the topic
  2. Major health organizations (APA, SAMHSA, NIMH, NAMI, CDC, WHO)
  3. Systematic reviews and meta-analyses
  4. Recent research (2020–2025 preferred)

### Skip List (no citations on these)
- Title / welcome slides
- Thank you / closing slides
- Test / assessment placeholders
- Practice scenario / role-play slides
- Local resource slides
- Reflection / discussion prompt slides

### Integration
- Weave naturally into existing text
- Don't disrupt flow, tone, or accessibility level
- Maintain original voice
- CRITICAL: Every content slide making a factual/evidence-based claim MUST have a citation

### References Slides
- Type: `references`, layout: `full`, no imagePrompt
- Appended after closing — do NOT count toward target slide count

---

## 10. Speaker Notes Format

Every slide gets structured speaker notes:

```
**Talking Points**
- Conversational talking points explaining WHY, not just WHAT
- 2-5 points per slide, natural speaking track
- Elaborate on slide content, don't repeat it

**Presenter Tips**
- Delivery mechanics: timing, group activities, facilitation prompts
- Required on activity/section/interactive slides; optional on pure content

**Transition**
"A quoted bridge sentence leading into the next slide's topic."
```

---

## 11. Caps & Limits

### UI Caps
| Cap | Value |
|-----|-------|
| Slide count range | 5–200 |
| Slide count default | 70 |
| Custom instructions | max 1000 chars |
| Title | max 255 chars |

### Server Validation
| Cap | Value |
|-----|-------|
| Slide count | min 5, max 200 |
| Custom instructions | max 1000 chars |
| Title | max 255 chars |
| Image focal point x/y | 0–100 |
| Bulk upload files | max 10 |
| Bulk delete decks | max 50 |
| Page size | 5–100 (default 25) |
| Group name | max 100 chars |

### Prompt Caps
| Cap | Value |
|-----|-------|
| slideCount fallback | 70 |
| Image range | 35-45% |
| Bullets per slide | 4-6 max (soft) |
| Blocks per slide | 1-2 max (soft) |

### Content Truncation
| Context | Chars |
|---------|-------|
| Image prompt generation | slide.body → 500 |
| Video recs | slide.body → 100 |
| AI review | slide.body → 300 |
| Video search | first 10 slides only |

---

## 12. Regenerate Single Slide

The feedback-based single-slide regeneration uses a separate prompt:
- Includes: tone, custom instructions, current slide JSON, neighboring slide context, user feedback
- Excludes: fidelity, block docs, citations, image style
- This means regenerated slides may not follow block/citation/image conventions unless the user explicitly asks in their feedback

---

## 13. YouTube Video Recommendations

- LLM generates 5 CHW-targeted YouTube search queries from deck content
- Searched via YouTube Data API v3 (category: Education, safeSearch: strict, duration: medium)
- Each query returns up to 3 results, deduplicated, capped at 8 total

---

*Last updated: 2026-03-09*
*Source: Generation settings overhaul implementation*

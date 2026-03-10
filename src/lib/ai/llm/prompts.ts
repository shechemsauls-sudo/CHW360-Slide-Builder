import type { DeckStats, FidelityLevel, GenerateInput, RegenerateInput, SlideData, ToneOption, Violation, VisualBlockType } from "../types";
import { IMAGE_STYLE_DIRECTIVE } from "../image/style-prompt";

const FIDELITY_INSTRUCTIONS: Record<FidelityLevel, string> = {
  verbatim: `## Source Fidelity: VERBATIM

**CRITICAL: Transcribe the source content exactly as written.** Do NOT paraphrase, summarize, or reword ANY text from the source document.

- Every slide's body text MUST use the original wording from the source document
- If the source has explicit slides or numbered sections, create a 1:1 mapping: source section N → output slide N
- Do NOT merge, split, or reorder source sections
- Do NOT drop any content — include ALL text from the source
- The AI's role is ONLY to: assign slide types, assign layouts, write speaker notes, and suggest image prompts
- Speaker notes should add teaching context and elaboration — do NOT repeat the slide body in notes
- Markdown formatting (bold, lists, headings) should reflect the source's own formatting`,

  balanced: `## Source Fidelity: BALANCED

Preserve the source content's meaning, structure, and key phrases. You may improve formatting, add transitions between slides, and clarify awkward phrasing, but do NOT substantially rewrite the content.

- Preserve the source document's own language and terminology
- Keep the original structure and ordering of topics
- You may split long sections into multiple slides or add section dividers
- Do NOT drop sections — include ALL content from the source
- Speaker notes should expand on slide content with teaching context, not repeat the body
- Prefer the source's exact phrasing when it is clear and effective
- **Visual blocks ARE encouraged** — reformatting content into :::block directives (checklists, info-boxes, charts, flow-diagrams, timelines, card-grids, etc.) is a formatting enhancement, NOT a rewrite. Use them naturally wherever they make the content clearer or more engaging.`,

  creative: `## Source Fidelity: CREATIVE

Use the source content as inspiration. Restructure, summarize, and enhance freely to create the most engaging and educational presentation possible.

- You may reorganize, merge, and rewrite content for maximum presentation impact
- Add transitions, summaries, and engagement hooks
- Optimize for audience understanding over source faithfulness
- Speaker notes should provide teaching guidance and discussion prompts`,
};

const TONE_INSTRUCTIONS: Record<ToneOption, string> = {
  professional: `## Tone: Professional
Formal, clear, and evidence-based. Use precise language appropriate for clinical or policy audiences. Avoid colloquialisms.`,
  conversational: `## Tone: Conversational
Warm, direct, and approachable. Use "you" and "we" freely. Best for community health settings where trust and relatability matter.`,
  academic: `## Tone: Academic
Formal with citations-style references where applicable. Preserve technical terminology and use structured argumentation.`,
  training: `## Tone: Training / Instructor-Focused
Pedagogical scaffolding with step-by-step instruction. Include comprehension checks, knowledge reinforcement, and "try it now" prompts.`,
};

const BLOCK_DOCS: Record<VisualBlockType, { doc: string; hint: string }> = {
  "info-box": {
    doc: `**:::info-box Title**
Colored callout box with a left accent border. Use for tips, notes, warnings, or key definitions.
\`\`\`
:::info-box Key Definition
A Community Health Worker (CHW) is a frontline health agent...
:::
\`\`\``,
    hint: "Definitions or key terms → `:::info-box`",
  },
  "key-stat": {
    doc: `**:::key-stat Number Label**
Large statistic display. Use for impactful numbers.
\`\`\`
:::key-stat 95% Vaccination Rate
Among children under 5 in the program area
:::
\`\`\``,
    hint: "Statistics or metrics → `:::key-stat`",
  },
  "numbered-steps": {
    doc: `**:::numbered-steps**
Vertical numbered step list with connector dots. Use for processes and procedures.
\`\`\`
:::numbered-steps
Assess the patient's symptoms
Record vital signs
Refer to nearest health facility if needed
:::
\`\`\``,
    hint: "Step-by-step instructions → `:::numbered-steps`",
  },
  "flow-diagram": {
    doc: `**:::flow-diagram**
Horizontal flow with arrows. Use for workflows and processes (3-5 items).
\`\`\`
:::flow-diagram
Assessment -> Diagnosis -> Treatment -> Follow-up
:::
\`\`\``,
    hint: "Processes or workflows → `:::flow-diagram`",
  },
  "cycle": {
    doc: `**:::cycle**
Circular cycle diagram with arrows looping back from last to first. Use for recurring processes and feedback loops (3-6 items).
\`\`\`
:::cycle
Implement -> Use -> Evaluate -> Adjust
:::
\`\`\``,
    hint: "Recurring processes or feedback loops → `:::cycle`",
  },
  "comparison-table": {
    doc: `**:::comparison-table**
Side-by-side comparison. First row is headers, use | to separate columns.
\`\`\`
:::comparison-table
Prevention | Treatment
Vaccines, bed nets | Medication, IV fluids
Low cost | Higher cost
:::
\`\`\``,
    hint: "Side-by-side comparisons → `:::comparison-table`",
  },
  "checklist": {
    doc: `**:::checklist**
Visual checkbox list. Use for action items or requirements.
\`\`\`
:::checklist
Complete patient intake form
Verify immunization records
Schedule follow-up visit
:::
\`\`\``,
    hint: "Action items or requirements → `:::checklist`",
  },
  "quote-block": {
    doc: `**:::quote-block Attribution**
Styled pull quote. Use for impactful quotes or testimonials.
\`\`\`
:::quote-block WHO Guidelines
Every child deserves access to quality healthcare regardless of geography.
:::
\`\`\``,
    hint: "Quotes or testimonials → `:::quote-block`",
  },
  "highlight-box": {
    doc: `**:::highlight-box**
Full-width colored banner. Use for key takeaways or important messages.
\`\`\`
:::highlight-box
Remember: Always wash hands before and after patient contact!
:::
\`\`\``,
    hint: "Key takeaways or emphasis → `:::highlight-box`",
  },
  "timeline": {
    doc: `**:::timeline**
Horizontal timeline with labeled points. Use for phases or milestones. Format: Label: Description
\`\`\`
:::timeline
Week 1: Initial training
Week 2: Field practice
Week 3: Assessment
:::
\`\`\``,
    hint: "Phases or milestones → `:::timeline`",
  },
  "icon-grid": {
    doc: `**:::icon-grid**
Grid of items with icon circles. Use for categories, roles, or features.
\`\`\`
:::icon-grid
Prevention
Treatment
Education
Referral
:::
\`\`\``,
    hint: "Categories, roles, or features → `:::icon-grid`",
  },
  "card-grid": {
    doc: `**:::card-grid**
Multi-color card row for overviews and summaries. Each card gets a distinct color. Format: Title | Description per line. 3-4 items ideal.
\`\`\`
:::card-grid
Foundation Module | Building core organizational skills
Applied Skills | Real-world scenarios and workflows
Advanced Techniques | Complex coordination strategies
:::
\`\`\``,
    hint: "Overview categories, key pillars, or summary groups → `:::card-grid`",
  },
  "chevron-flow": {
    doc: `**:::chevron-flow**
Colored arrow/chevron flow for sequences and processes. Each step is a distinct colored arrow banner. Format: Title | Description per line.
\`\`\`
:::chevron-flow
Identify | Know what needs doing
Schedule | Decide when to do it
Execute | Follow through on plan
Review | Assess and adjust
:::
\`\`\``,
    hint: "Sequential processes, phases, or pipelines → `:::chevron-flow`",
  },
  "accent-list": {
    doc: `**:::accent-list**
Stacked list with a different colored left border per item. Great for features, components, or categorized items. Format: Title | Description per line.
\`\`\`
:::accent-list
Tracking Appointments | Knowing where to be and when
Managing Referrals | Following up on every connection
Being Prepared | Having what you need for meetings
:::
\`\`\``,
    hint: "Features, components, or categorized items with descriptions → `:::accent-list`",
  },
  "pill-list": {
    doc: `**:::pill-list**
Flex-wrap container with rounded-full pill items in theme palette colors. Use for tags, categories, or compact list items. Format: one item per line, or "Label | Description" per line.
\`\`\`
:::pill-list
Community Health
Mental Wellness
Nutrition
Physical Activity
:::
\`\`\``,
    hint: "Tags, categories, or compact list items → `:::pill-list`",
  },
  "stat-bubbles": {
    doc: `**:::stat-bubbles**
Circular badges with large value + label below. Use for 2-4 impactful metrics side-by-side. Format: Value | Label per line.
\`\`\`
:::stat-bubbles
95% | Follow-up Rate
2.4K | Households
12 | Active CHWs
:::
\`\`\``,
    hint: "Impactful metrics displayed as circular badges → `:::stat-bubbles`",
  },
  "tag-cloud": {
    doc: `**:::tag-cloud**
Flex-wrap tag pills with varying sizes based on weight. Use for topic emphasis or keyword clusters. Format: Term or Term | weight (1-3, where 3 is largest).
\`\`\`
:::tag-cloud
Prevention | 3
Education | 2
Referral | 1
Screening | 2
Follow-up | 3
:::
\`\`\``,
    hint: "Topic emphasis or keyword clusters → `:::tag-cloud`",
  },
  "rounded-cards": {
    doc: `**:::rounded-cards**
Soft rounded cards (rounded-3xl) with subtle gradients and shadows. Like card-grid but softer/rounder. Format: Title | Description per line.
\`\`\`
:::rounded-cards
Assessment | Evaluate patient needs thoroughly
Planning | Create actionable care plans
Delivery | Execute interventions effectively
:::
\`\`\``,
    hint: "Soft rounded cards for overview items → `:::rounded-cards`",
  },
  "bar-chart": {
    doc: `**:::bar-chart Title | Series1, Series2**
Bar chart comparing values across categories. Use \`|\` to separate title from optional series names. Each line: \`Label: value\` or \`Label: value1, value2\` for multi-series.
\`\`\`
:::bar-chart Coverage by Region | Target, Actual
North: 90, 85
South: 85, 78
East: 92, 91
West: 88, 72
:::
\`\`\``,
    hint: "Categorical comparisons with numbers → `:::bar-chart`",
  },
  "pie-chart": {
    doc: `**:::pie-chart Title**
Pie/donut chart showing proportions. Each line: \`Label: value\`.
\`\`\`
:::pie-chart Disease Distribution
Malaria: 45
Pneumonia: 25
Diarrhea: 20
Other: 10
:::
\`\`\``,
    hint: "Proportions or percentage breakdowns → `:::pie-chart`",
  },
  "line-chart": {
    doc: `**:::line-chart Title | Series1, Series2**
Line chart for trends over time. Each line: \`Label: value\` or multi-series with commas.
\`\`\`
:::line-chart Monthly Visits
Jan: 120
Feb: 145
Mar: 180
Apr: 210
:::
\`\`\``,
    hint: "Trends over time → `:::line-chart`",
  },
  "area-chart": {
    doc: `**:::area-chart Title | Series1, Series2**
Filled area chart for cumulative or volume trends. Same format as line-chart.
\`\`\`
:::area-chart Cumulative Vaccinations
Week 1: 50
Week 2: 130
Week 3: 240
Week 4: 380
:::
\`\`\``,
    hint: "Cumulative totals or volume trends → `:::area-chart`",
  },
  "radar-chart": {
    doc: `**:::radar-chart Title**
Radar/spider chart for multi-factor assessments. Each line: \`Factor: score\`.
\`\`\`
:::radar-chart Health Worker Skills
Communication: 85
Clinical Knowledge: 70
Community Trust: 90
Record Keeping: 65
Referral Accuracy: 80
:::
\`\`\``,
    hint: "Multi-factor assessments or skill profiles → `:::radar-chart`",
  },
  "progress-bars": {
    doc: `**:::progress-bars Title**
Visual progress bars showing completion percentages. Each line: \`Label: percentage\`.
\`\`\`
:::progress-bars Training Completion
Module 1: 100
Module 2: 85
Module 3: 60
Module 4: 25
:::
\`\`\``,
    hint: "Completion rates or goal progress → `:::progress-bars`",
  },
  "metric-row": {
    doc: `**:::metric-row Title**
Dashboard-style metric cards in a row. Each line: \`Value | Label\`.
\`\`\`
:::metric-row Program Impact
2,450 | Households Visited
95% | Immunization Rate
12 | Active CHWs
89% | Follow-up Rate
:::
\`\`\``,
    hint: "KPI summaries or dashboard metrics → `:::metric-row`",
  },
};

function buildBlockDocs(selectedBlocks?: VisualBlockType[]): string {
  const blocks = selectedBlocks?.length
    ? selectedBlocks
    : (Object.keys(BLOCK_DOCS) as VisualBlockType[]);

  const blockDocs = blocks.map((b) => BLOCK_DOCS[b].doc).join("\n\n");
  const hints = blocks.map((b) => `- ${BLOCK_DOCS[b].hint}`).join("\n");

  const restriction = selectedBlocks?.length
    ? `\n\n**IMPORTANT: Use ONLY these ${blocks.length} block types. Do NOT use any other block types.**`
    : "";

  return `## Visual Block Components

You can use special block directives in slide bodies to create rich visual elements. Use the :::block-type syntax:

### Available Blocks

${blockDocs}

### When to Use Each Block
Match content patterns to the right block type:
${hints}

### Block Usage Guidelines
- **Use visual blocks generously** — they make presentations feel professional and engaging
- **Vary your block types** — don't over-rely on checklists and info-boxes. Mix in flow-diagrams, timelines, card-grids, comparison-tables, metric-rows, icon-grids, accent-lists, key-stats, quote-blocks, pill-lists, stat-bubbles, tag-clouds, rounded-cards, and others where they fit
- Aim for 10+ different block types across the deck
- Use 1-3 blocks per slide maximum — don't overload a single slide
- Blocks work best on "content", "bullets", and "activity" slide types
- You can mix regular markdown with blocks in the same slide body
- Do NOT use blocks on "title" or "closing" slides
- Use \`:::pill-list\` for compact tag-like items or categories
- Use \`:::stat-bubbles\` for 2-4 large metrics in circular badges
- Use \`:::tag-cloud\` for weighted keyword clusters or topic emphasis
- Use \`:::rounded-cards\` for softer overview cards (alternative to card-grid)
- Use \`:::card-grid\` for slide overviews, pillar summaries, and category breakdowns (3-4 items)
- Use \`:::chevron-flow\` instead of \`:::flow-diagram\` when you have 3-5 process steps with descriptions
- Use \`:::accent-list\` for categorized items where each has a title and description
- Use \`:::timeline\` for any sequential phases, milestones, or week-by-week plans
- Use \`:::cycle\` for recurring processes, feedback loops, or continuous improvement flows
- Use \`:::comparison-table\` for any pros/cons, before/after, or side-by-side content
- Use \`:::icon-grid\` for roles, features, categories, or pillar concepts
- Use \`:::key-stat\` to highlight impactful single numbers or percentages
- Use \`:::highlight-box\` for "remember this" or takeaway emphasis
- Use \`:::quote-block\` for expert quotes, guidelines, or testimonials

### Chart & Data Block Guidelines
- **Chart blocks are best when source content contains numerical data** — do NOT fabricate numbers
- Use bar-chart for categorical comparisons, pie-chart for proportions, line/area-chart for trends, radar-chart for multi-factor assessments
- Use progress-bars for completion rates and metric-row for KPI summaries
- Keep chart data concise: 3-8 data points per chart for readability
- One chart per slide is ideal — combine with a text block if needed for context
- **Include at least 1-2 chart/data blocks per deck** even if you need to create reasonable illustrative data from the content${restriction}`;
}

/** Calculate a proportional image count range for the given slide count (~40%) */
function getImageRange(slideCount: number): string {
  const min = Math.max(5, Math.round(slideCount * 0.35));
  const max = Math.min(Math.max(10, Math.round(slideCount * 0.45)), 40);
  return `${min}-${max}`;
}

// ── Pass 1: Full Generation (single comprehensive call from source content) ──

export function buildPass1Prompt(input: GenerateInput): string {
  const slideCount = input.slideCount ?? 70;
  const fidelity = input.fidelity ?? "balanced";
  const includeBlocks = fidelity !== "verbatim";
  const tone = input.tone ?? "training";
  const customInstructions = input.customInstructions?.trim();

  return `You are an expert presentation designer specializing in community health worker (CHW) training materials.

Create a professional slide deck from the provided content. The deck should be educational, engaging, and actionable for community health workers.

${FIDELITY_INSTRUCTIONS[fidelity]}

${TONE_INSTRUCTIONS[tone]}
${customInstructions ? `\n## Custom Instructions\n${customInstructions}` : ""}
${includeBlocks ? "\n" + buildBlockDocs(input.selectedBlocks) : ""}

## Citation Requirements
Add evidence-based citations (2020–2025) using APA 7th edition format:
- Density: 1–2 in-text citations per content slide where specific claims need evidence
- Format: In-text (Author, Year) with full references on dedicated References slide(s) at the end
- Sources: Peer-reviewed journals, major health orgs (APA, SAMHSA, NIMH, NAMI, CDC, WHO), systematic reviews/meta-analyses
- **NEVER cite on these slide types**: title, closing, section, activity, references
- **NEVER cite on these content topics**: pre-test/post-test placeholders, practice scenarios, role-play exercises, QR code slides, local resource listings, reflection/discussion prompts, review/summary slides
- Citations belong ONLY on slides making factual health claims, statistics, or evidence-based recommendations
- Weave citations naturally — don't disrupt flow, tone, or accessibility level

IMPORTANT: The References slide(s) at the end are EXTRA — they do NOT count toward the target slide count of ${slideCount}. Generate ${slideCount} content slides PLUS References slide(s) after. References slides should have type "references", layout "full", and no imagePrompt.

## Slide Count

**IMPORTANT: If the source content already contains slide markers** (e.g., "Slide 1:", "Slide 2:", numbered slides, or clear slide-by-slide structure), you MUST follow that structure exactly — create one output slide per source slide.

If the source content does NOT contain slide markers, generate up to ${slideCount} slides (this is a maximum — use fewer if the content doesn't warrant that many).

## Requirements

- First slide must be type "title" with layout "image-full" and an imagePrompt
- Last content slide must be type "closing" with layout "image-full" and an imagePrompt
- All "section" slides must use layout "image-full" with an imagePrompt
- Use a mix of slide types: section, content, bullets, comparison, activity, quote
- Include "imagePrompt" on ${getImageRange(slideCount)} slides using ONLY image-eligible layouts (split-left, split-right, image-full, image-top)
- Use image-top for content slides that benefit from a visual anchor
- Set imagePrompt to null on full and two-column layouts

## Image Prompt Guidelines — Brand Style
CRITICAL: All imagePrompt values MUST be photorealistic and embody this visual style:
${IMAGE_STYLE_DIRECTIVE}

Additional rules:
- Always specify "warm natural lighting" and "brightly lit"
- Always include diversity in people (Hispanic, Black, Asian, Middle Eastern, all ages)
- Settings should feel like Texas community spaces
- Images must feel calm, supportive, and optimistic — never dark, dramatic, or clinical
- 1-2 sentence prompts only. No text in images.
- **NEVER request clipart, stock watermarks, or abstract styles**: Only photorealistic images.
- **NEVER split or collage images**: Each imagePrompt must describe a single cohesive scene. No diptychs, side-by-side, or split compositions.
- **NO religious imagery**: Do not include crosses, saints, halos, prayer scenes, religious statues, stained glass, or any religious iconography. Use secular community settings only.
- Write structured speaker notes for every slide using this markdown format:

**Talking Points**
- Conversational, direct address ("you", "we") talking points that explain WHY, not just WHAT
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
- **CRITICAL: You MUST use :::block directives on at LEAST 50% of content/bullets/activity slides.** Use a WIDE VARIETY of block types (10+ different types per deck). The presentation must feel visually rich and professionally designed.
- **BLOCK VARIETY RULES**: Do NOT over-rely on :::numbered-steps and :::checklist — use each NO MORE than 3 times per deck. Instead, spread usage across: accent-list, chevron-flow, card-grid, rounded-cards, pill-list, flow-diagram, timeline, icon-grid, comparison-table, stat-bubbles, tag-cloud, key-stat, highlight-box, quote-block, cycle, info-box. Every deck should use at least 10 different block types.
- **NO consecutive repeats**: Never use the same block type on two slides in a row.

## Slide Types
- **title**: Opening slide with deck title and subtitle in body
- **section**: Section divider introducing a new topic
- **content**: Paragraph-style educational content
- **bullets**: Key points as bullet list
- **comparison**: Two-column comparison (use "two-column" layout)
- **activity**: Interactive exercise or discussion prompt
- **quote**: Notable quote or statistic
- **closing**: Summary and key takeaways
- **references**: APA 7th edition reference list (appended after closing, EXTRA slides outside target count)

## Structural Slide Protocol — Title, Section & Closing
These "bookend" slides frame the deck and must feel cinematic and unified:
- **title** slide: MUST use layout "image-full" with an imagePrompt. This is the deck's first impression — full-bleed hero image with frosted-glass title overlay.
- **section** slides: MUST use layout "image-full" with an imagePrompt. Section dividers are visual breaths between content — they reset the viewer's attention with a dramatic image.
- **closing** slide: MUST use layout "image-full" with an imagePrompt. End with the same cinematic weight as the opening.
- **references** slides: MUST use layout "full" with imagePrompt null. Plain text, no images.
- All other slide types (content, bullets, comparison, activity, quote) use any layout freely.

This creates a consistent visual rhythm: cinematic bookends (title → section → section → closing) wrapping content slides.

## Layouts
- **full**: Content fills the slide, left-aligned (NO imagePrompt)
- **split-left**: Image left, content right (supports imagePrompt)
- **split-right**: Content left, image right (supports imagePrompt)
- **two-column**: Side-by-side columns for comparisons (NO imagePrompt)
- **image-full**: Full-bleed background image with overlay. REQUIRED for title, section, and closing slides. (supports imagePrompt — REQUIRED)
- **image-top**: Image spans full width at top, content below. (supports imagePrompt — REQUIRED)

**CRITICAL IMAGE RULE**: Only these 4 layouts support images: split-left, split-right, image-full, image-top. Set imagePrompt to null on all other layouts (full, two-column). image-full and image-top MUST have an imagePrompt.
**TEXT ALIGNMENT**: All text must be left-aligned. Never center body text.

## Deck Info
Title: ${input.title}
${input.description ? `Description: ${input.description}` : ""}

## Source Content
${input.content}

## Output Format
Return a JSON object with a "slides" array. Each slide has: id, order, type, title, body, speakerNotes, imageUrl, imagePrompt, layout.

**IMPORTANT: The body field MUST contain :::block directives on content slides.** Use \\n for newlines in JSON strings.

Follow this exact pattern. Use :::block-type on the FIRST line, content on subsequent lines, and ::: alone to close. Separate with \\n.`;
}

// ── Pass 2: Targeted QA Fix Prompts (small chunks of 2-3 slides) ──

/** Backward compat alias */
export const buildGeneratePrompt = buildPass1Prompt;

/**
 * Build a targeted QA fix prompt for a small chunk of slides.
 * Only includes the violated slides + specific fix instructions.
 */
export function buildQAFixPrompt(
  slides: SlideData[],
  violations: Violation[],
  stats: DeckStats,
): string {
  const needsBlockFix = violations.some((v) =>
    v.type === "low-block-variety" || v.type === "consecutive-same-block"
  );
  const needsImageFix = violations.some((v) =>
    v.type === "image-coverage-low" || v.type === "image-coverage-high" ||
    v.type === "bookend-missing-image-full" || v.type === "image-on-non-eligible" ||
    v.type === "missing-image-on-eligible"
  );

  const violationList = violations
    .map((v) => `- **Slide "${slides.find((s) => s.id === v.slideId)?.title ?? v.slideId}"** (id: ${v.slideId}): ${v.message}`)
    .join("\n");

  return `You are a presentation QA reviewer. Fix ONLY the specific issues listed below. Do NOT change anything else — preserve all existing content, blocks, speaker notes, and formatting.

## Slides to Fix
${JSON.stringify({ slides }, null, 2)}

## Deck-Wide Stats (for context)
- Unique block types used: ${stats.uniqueBlockTypes} (target: 10+)
- Block frequency: ${JSON.stringify(stats.blockTypeFrequency)}
- Image coverage: ${stats.imageCoveragePercent.toFixed(0)}% (target: 35-45%)
- Slides with citations: ${stats.slidesWithCitations}

## Violations to Fix
${violationList}

${needsBlockFix ? `## Block Reference (for swaps)
Underused block types you should swap TO: pill-list, stat-bubbles, tag-cloud, rounded-cards, chevron-flow, accent-list, cycle, card-grid, timeline, icon-grid, highlight-box, flow-diagram, comparison-table, key-stat, quote-block, numbered-steps, checklist, info-box.
Choose types NOT already overused in the deck (see frequency above).` : ""}
${needsImageFix ? `## Image Guidelines
${IMAGE_STYLE_DIRECTIVE}
- imagePrompt must be 1-2 sentences, photorealistic, warm natural lighting, diverse people, Texas community settings
- image-full/image-top layouts REQUIRE imagePrompt
- full/two-column layouts MUST have imagePrompt: null` : ""}

## Output Format
Return a JSON object with a "slides" array containing ONLY the fixed slides (same id, same structure). Do NOT include unchanged slides.

Return ONLY the JSON object.`;
}

/**
 * Build a prompt to generate References slides from citations found in the deck.
 */
export function buildReferencesPrompt(slides: SlideData[]): string {
  // Extract all citation patterns from slide bodies
  const citationPattern = /\(([A-Z][a-z]+(?:\s(?:&|and|et al\.?)\s[A-Z][a-z]+)*,\s*\d{4}[a-z]?)\)/g;
  const citations = new Set<string>();
  for (const slide of slides) {
    for (const match of slide.body.matchAll(citationPattern)) {
      citations.add(match[1]!);
    }
  }

  return `You are an academic reference formatter. Generate 1-2 References slides with full APA 7th edition entries.

## In-text citations found in the deck
${[...citations].map((c) => `- (${c})`).join("\n") || "- No specific citations found — generate 5-8 relevant references for community health worker training content"}

## Requirements
- Generate plausible, realistic APA 7th edition references for each in-text citation
- Sources should be from: CDC, WHO, SAMHSA, NIMH, NAMI, APA, peer-reviewed journals (2020-2025)
- One reference per line in the body
- If many references, split across 2 slides

## Output Format
Return a JSON object with a "slides" array. Each slide:
- id: "references-1" (or "references-2")
- order: 999 (will be reordered)
- type: "references"
- title: "References"
- body: Full APA references, one per line
- speakerNotes: "Full reference list available for distribution."
- imageUrl: null
- imagePrompt: null
- layout: "full"

Return ONLY the JSON object.`;
}

// ── Regenerate (single slide) ──

export function buildRegeneratePrompt(input: RegenerateInput): string {
  const tone = input.tone ?? "training";
  const customInstructions = input.customInstructions?.trim();

  return `You are an expert presentation designer. Regenerate this single slide based on user feedback.

${TONE_INSTRUCTIONS[tone]}
${customInstructions ? `\n## Custom Instructions\n${customInstructions}` : ""}

## Current Slide
${JSON.stringify(input.slide, null, 2)}

## Context
Deck Title: ${input.context.deckTitle}
${input.context.prevSlide ? `Previous Slide: "${input.context.prevSlide.title}"` : "This is the first slide."}
${input.context.nextSlide ? `Next Slide: "${input.context.nextSlide.title}"` : "This is the last slide."}

## User Feedback
${input.feedback}

## Instructions
Return a single slide JSON object with the same structure (id, order, type, title, body, speakerNotes, imageUrl, imagePrompt, layout). Keep the same id and order. Apply the user's feedback while maintaining consistency with surrounding slides.

Return ONLY the JSON object, no wrapper.`;
}

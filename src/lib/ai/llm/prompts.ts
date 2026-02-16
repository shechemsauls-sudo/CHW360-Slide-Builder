import type { FidelityLevel, GenerateInput, RegenerateInput, ToneOption, VisualBlockType } from "../types";

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
- **Visual blocks ARE encouraged** — reformatting content into :::block directives (checklists, info-boxes, charts, etc.) is a formatting enhancement, NOT a rewrite. Use them freely on 30-40% of content slides.`,

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
- **Use visual blocks on 30-40% of content slides** — they make presentations more engaging and scannable
- Use 1-3 blocks per slide maximum — don't overload
- Blocks work best on "content", "bullets", and "activity" slide types
- You can mix regular markdown with blocks in the same slide body
- Do NOT use blocks on "title" or "closing" slides
- Use \`:::card-grid\` for slide overviews, pillar summaries, and category breakdowns (3-4 items)
- Use \`:::chevron-flow\` instead of \`:::flow-diagram\` when you have 3-5 process steps with descriptions
- Use \`:::accent-list\` for categorized items where each has a title and description

### Chart & Data Block Guidelines
- **Chart blocks are best when source content contains numerical data** — do NOT fabricate numbers
- Use bar-chart for categorical comparisons, pie-chart for proportions, line/area-chart for trends, radar-chart for multi-factor assessments
- Use progress-bars for completion rates and metric-row for KPI summaries
- Keep chart data concise: 3-8 data points per chart for readability
- One chart per slide is ideal — combine with a text block if needed for context${restriction}`;
}

export function buildGeneratePrompt(input: GenerateInput): string {
  const slideCount = input.slideCount ?? 20;
  const fidelity = input.fidelity ?? "balanced";
  const includeBlocks = fidelity !== "verbatim";

  const tone = input.tone ?? "professional";
  const customInstructions = input.customInstructions?.trim();

  return `You are an expert presentation designer specializing in community health worker (CHW) training materials.

Create a professional slide deck from the provided content. The deck should be educational, engaging, and actionable for community health workers.

${FIDELITY_INSTRUCTIONS[fidelity]}

${TONE_INSTRUCTIONS[tone]}
${customInstructions ? `\n## Custom Instructions\n${customInstructions}` : ""}
${includeBlocks ? "\n" + buildBlockDocs(input.selectedBlocks) : ""}

## Slide Count

**IMPORTANT: If the source content already contains slide markers** (e.g., "Slide 1:", "Slide 2:", numbered slides, or clear slide-by-slide structure), you MUST follow that structure exactly — create one output slide per source slide. The user's slide count preference (${slideCount}) is secondary to the document's own structure.

If the source content does NOT contain slide markers (it's just prose, notes, or unstructured text), generate up to ${slideCount} slides (this is a maximum — use fewer if the content doesn't warrant that many).

## Requirements

- First slide must be type "title" with the deck title
- Last slide must be type "closing" with key takeaways
- Use a mix of slide types: section, content, bullets, comparison, activity, quote
- Include "imagePrompt" on 4-8 slides using ONLY image-eligible layouts (split-left, split-right, image-full, image-top)
- Use image-full for at least 1-2 dramatic visual slides (title, section dividers, or closing)
- Use image-top for content slides that benefit from a visual anchor
- Set imagePrompt to null on full, centered, and two-column layouts

## Image Prompt Guidelines
When writing imagePrompt values, follow these rules:
- **Specify subject clearly**: "A community health worker visiting a rural household" not just "healthcare"
- **Include style**: "photorealistic", "warm documentary style", "soft illustration", or "flat vector style"
- **Include mood/lighting**: "warm golden hour light", "bright and optimistic", "calm clinical setting"
- **Include color palette hints**: "earth tones", "teal and warm accents", "bright primary colors"
- **NEVER include text in images**: Do not ask for text, labels, or words rendered in the image
- **NEVER request clipart or stock watermarks**: Avoid "clipart", "stock photo", "watermark"
- **Keep prompts to 1-2 sentences**: Concise but descriptive
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
- **CRITICAL: You MUST use :::block directives on at least 30% of content/bullets/activity slides.** Do NOT create a deck of only plain text slides. Use checklists, info-boxes, numbered-steps, flow-diagrams, key-stats, charts, progress-bars, metric-rows, etc. to make slides visually rich. See the Visual Block Components section for syntax.

## Slide Types
- **title**: Opening slide with deck title and subtitle in body
- **section**: Section divider introducing a new topic
- **content**: Paragraph-style educational content
- **bullets**: Key points as bullet list
- **comparison**: Two-column comparison (use "two-column" layout)
- **activity**: Interactive exercise or discussion prompt
- **quote**: Notable quote or statistic
- **closing**: Summary and key takeaways

## Layouts
- **full**: Content fills the slide (NO imagePrompt)
- **centered**: Content centered, good for quotes and section dividers (NO imagePrompt)
- **split-left**: Image left, content right (supports imagePrompt)
- **split-right**: Content left, image right (supports imagePrompt)
- **two-column**: Side-by-side columns for comparisons (NO imagePrompt)
- **image-full**: Full-bleed background image with dark gradient overlay + white text overlay at bottom. Great for title, section, and closing slides. (supports imagePrompt — REQUIRED)
- **image-top**: Image spans full width at top (40% height), content below. Good for content slides that need a visual anchor. (supports imagePrompt — REQUIRED)

**CRITICAL IMAGE RULE**: Only these 4 layouts support images: split-left, split-right, image-full, image-top. Set imagePrompt to null on all other layouts (full, centered, two-column). image-full and image-top MUST have an imagePrompt.

## Deck Info
Title: ${input.title}
${input.description ? `Description: ${input.description}` : ""}

## Source Content
${input.content}

## Output Format
Return a JSON object with a "slides" array. Each slide has: id, order, type, title, body, speakerNotes, imageUrl, imagePrompt, layout.

**IMPORTANT: The body field MUST contain :::block directives on content slides.** Use \\n for newlines in JSON strings. Here are complete example slides showing correct block usage:

{
  "slides": [
    {
      "id": "slide-1",
      "order": 1,
      "type": "title",
      "title": "Training Program Overview",
      "body": "Building healthier communities through skilled CHW practice",
      "speakerNotes": "**Talking Points**\\n- Welcome to the Organizational Skills training. This is the first of four modules designed to strengthen your daily practice as a community health worker.\\n- Today we'll focus on practical, immediately applicable strategies that you can use starting tomorrow.\\n\\n**Presenter Tips**\\n- Ask participants to share one organizational challenge they currently face\\n- Allow 2-3 minutes for initial discussion before moving on\\n\\n**Transition**\\n\\"Let's start by looking at what we'll cover today.\\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "centered"
    },
    {
      "id": "slide-2",
      "order": 2,
      "type": "bullets",
      "title": "Learning Objectives",
      "body": ":::checklist\\nExplain why organizational skills are essential\\nIdentify core tasks performed by CHWs\\nRecognize how organization supports accountability\\nDescribe strategies for organizing time and information\\n:::",
      "speakerNotes": "**Talking Points**\\n- By the end of this session, you'll be able to do each of these four things confidently.\\n- Notice that we're not just learning what to do — we're learning why it matters for the communities we serve.\\n\\n**Transition**\\n\\"Let's begin with understanding the core responsibilities that make organization so critical.\\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "full"
    },
    {
      "id": "slide-3",
      "order": 3,
      "type": "content",
      "title": "Key Responsibilities",
      "body": "CHWs manage multiple organizational tasks daily:\\n\\n:::numbered-steps\\nSchedule and track appointments\\nDocument client interactions\\nCoordinate referrals with partners\\nFollow up on pending cases\\n:::",
      "speakerNotes": "**Talking Points**\\n- Each of these four tasks happens every single day in your work. Missing even one can affect a client's health outcome.\\n- Think about how scheduling and documentation connect — when you track appointments well, follow-ups become natural.\\n\\n**Presenter Tips**\\n- Ask: \\"Which of these four tasks do you find most challenging? Why?\\"\\n- Use responses to gauge the group's experience level",
      "imageUrl": null,
      "imagePrompt": "A CHW organizing files at a desk",
      "layout": "split-right"
    },
    {
      "id": "slide-4",
      "order": 4,
      "type": "content",
      "title": "Program Impact",
      "body": ":::metric-row\\n2,450 | Households Visited\\n95% | Follow-up Rate\\n12 | Active CHWs\\n:::\\n\\n:::info-box Key Insight\\nOrganized CHWs achieve 40% higher follow-up rates than their peers.\\n:::",
      "speakerNotes": "**Talking Points**\\n- These numbers tell a powerful story. The 95% follow-up rate didn't happen by accident — it's the result of consistent organizational practices.\\n- When we compare organized CHWs to those without systems, the difference is dramatic: 40% higher follow-up rates.\\n\\n**Transition**\\n\\"Now let's look at the specific strategies that drive these results.\\"",
      "imageUrl": null,
      "imagePrompt": null,
      "layout": "full"
    }
  ]
}

Follow this exact pattern. Use :::block-type on the FIRST line, content on subsequent lines, and ::: alone to close. Separate with \\n. You MUST include :::block directives in at least 30% of your content slides — do NOT output only plain text slides`;
}

export function buildRegeneratePrompt(input: RegenerateInput): string {
  const tone = input.tone ?? "professional";
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

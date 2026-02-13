import type { FidelityLevel, GenerateInput, RegenerateInput } from "../types";

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
- Prefer the source's exact phrasing when it is clear and effective`,

  creative: `## Source Fidelity: CREATIVE

Use the source content as inspiration. Restructure, summarize, and enhance freely to create the most engaging and educational presentation possible.

- You may reorganize, merge, and rewrite content for maximum presentation impact
- Add transitions, summaries, and engagement hooks
- Optimize for audience understanding over source faithfulness
- Speaker notes should provide teaching guidance and discussion prompts`,
};

const BLOCK_SYNTAX_DOCS = `## Visual Block Components

You can use special block directives in slide bodies to create rich visual elements. Use the :::block-type syntax:

### Available Blocks

**:::info-box Title**
Colored callout box with a left accent border. Use for tips, notes, warnings, or key definitions.
\`\`\`
:::info-box Key Definition
A Community Health Worker (CHW) is a frontline health agent...
:::
\`\`\`

**:::key-stat Number Label**
Large statistic display. Use for impactful numbers.
\`\`\`
:::key-stat 95% Vaccination Rate
Among children under 5 in the program area
:::
\`\`\`

**:::numbered-steps**
Vertical numbered step list with connector dots. Use for processes and procedures.
\`\`\`
:::numbered-steps
Assess the patient's symptoms
Record vital signs
Refer to nearest health facility if needed
:::
\`\`\`

**:::flow-diagram**
Horizontal flow with arrows. Use for workflows and processes (3-5 items).
\`\`\`
:::flow-diagram
Assessment -> Diagnosis -> Treatment -> Follow-up
:::
\`\`\`

**:::comparison-table**
Side-by-side comparison. First row is headers, use | to separate columns.
\`\`\`
:::comparison-table
Prevention | Treatment
Vaccines, bed nets | Medication, IV fluids
Low cost | Higher cost
:::
\`\`\`

**:::checklist**
Visual checkbox list. Use for action items or requirements.
\`\`\`
:::checklist
Complete patient intake form
Verify immunization records
Schedule follow-up visit
:::
\`\`\`

**:::quote-block Attribution**
Styled pull quote. Use for impactful quotes or testimonials.
\`\`\`
:::quote-block WHO Guidelines
Every child deserves access to quality healthcare regardless of geography.
:::
\`\`\`

**:::highlight-box**
Full-width colored banner. Use for key takeaways or important messages.
\`\`\`
:::highlight-box
Remember: Always wash hands before and after patient contact!
:::
\`\`\`

**:::timeline**
Horizontal timeline with labeled points. Use for phases or milestones. Format: Label: Description
\`\`\`
:::timeline
Week 1: Initial training
Week 2: Field practice
Week 3: Assessment
:::
\`\`\`

**:::icon-grid**
Grid of items with icon circles. Use for categories, roles, or features.
\`\`\`
:::icon-grid
Prevention
Treatment
Education
Referral
:::
\`\`\`

### Block Usage Guidelines
- Use 1-3 blocks per slide maximum — don't overload
- Blocks work best on "content", "bullets", and "activity" slide types
- You can mix regular markdown with blocks in the same slide body
- Do NOT use blocks on "title" or "closing" slides
- Choose the block that best fits the content — don't force blocks where plain text works better`;

export function buildGeneratePrompt(input: GenerateInput): string {
  const slideCount = input.slideCount ?? 20;
  const fidelity = input.fidelity ?? "balanced";
  const includeBlocks = fidelity !== "verbatim";

  return `You are an expert presentation designer specializing in community health worker (CHW) training materials.

Create a professional slide deck from the provided content. The deck should be educational, engaging, and actionable for community health workers.

${FIDELITY_INSTRUCTIONS[fidelity]}
${includeBlocks ? "\n" + BLOCK_SYNTAX_DOCS : ""}

## Slide Count

**IMPORTANT: If the source content already contains slide markers** (e.g., "Slide 1:", "Slide 2:", numbered slides, or clear slide-by-slide structure), you MUST follow that structure exactly — create one output slide per source slide. The user's slide count preference (${slideCount}) is secondary to the document's own structure.

If the source content does NOT contain slide markers (it's just prose, notes, or unstructured text), generate up to ${slideCount} slides (this is a maximum — use fewer if the content doesn't warrant that many).

## Requirements

- First slide must be type "title" with the deck title
- Last slide must be type "closing" with key takeaways
- Use a mix of slide types: section, content, bullets, comparison, activity, quote
- Include "imagePrompt" on 3-5 slides where a visual would enhance learning (descriptive prompt for health/community imagery)
- Write detailed speaker notes (2-4 sentences) for every slide
- Body content should use Markdown formatting (bold, lists, etc.)
- Keep slide titles concise (under 10 words)
- Keep bullet points to 4-6 per slide maximum

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
- **full**: Content fills the slide
- **centered**: Content centered (good for quotes, section dividers)
- **split-left**: Image left, content right
- **split-right**: Content left, image right
- **two-column**: Side-by-side columns (for comparisons)

## Deck Info
Title: ${input.title}
${input.description ? `Description: ${input.description}` : ""}

## Source Content
${input.content}

## Output Format
Return a JSON object with a "slides" array. Each slide object must have:
{
  "slides": [
    {
      "id": "slide-1",
      "order": 1,
      "type": "title",
      "title": "...",
      "body": "...",
      "speakerNotes": "...",
      "imageUrl": null,
      "imagePrompt": null or "descriptive prompt...",
      "layout": "centered"
    }
  ]
}`;
}

export function buildRegeneratePrompt(input: RegenerateInput): string {
  return `You are an expert presentation designer. Regenerate this single slide based on user feedback.

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

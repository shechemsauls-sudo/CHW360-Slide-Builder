# Generation Prompts — CHW360

Client-provided prompts for AI slide generation. These should be integrated into the generation pipeline.

---

## Image Style Prompt

Use this as the base style directive for all image generation (DALL-E, Stability, etc.):

> Warm natural lighting, clean minimal design, smooth edges, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere (schools, churches, clinics, parks, school gym, school cafeteria, rec centers, and hospitals), community-focused scenes, inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.

**Key directives:**
- Lighting: warm, natural
- Style: clean, minimal, smooth edges, contemporary
- Palette: soft colors (align with theme)
- Setting: Texas-inspired — schools, churches, clinics, parks, gyms, cafeterias, rec centers, hospitals
- People: diverse (Hispanic, Black, Asian, Middle Eastern), all ages (young adults, older adults), community groups
- Tone: calm, supportive, inclusive, community-focused

---

## Citation Prompt

Use this when generating or post-processing slides that include factual claims:

> Add evidence-based citations (2020–2025) using APA 7th edition format.

**Rules:**
- **Density:** 1–2 in-text citations per content slide, only where specific claims need evidence
- **Format:** In-text `(Author, Year)` + full references on a References slide
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

---

## Test Content

Sample input material is stored in `test-content/` (gitignored):

```
test-content/
  organizational-skills/
    org-skills-part-1.docx
    org-skills-part-2.docx
    org-skills-part-3.docx
    org-skills-part-4.docx
```

These are Module: Organizational Skills, Parts 1–4 (Master V1.0). Use for testing the full generation pipeline — DOCX parsing → slide generation → rendering.

## Reference Slides (Gamma — Quality Benchmark)

Shechem's existing Gamma-generated PPTX slides, stored in `test-content/reference-slides/` (gitignored):

```
test-content/
  reference-slides/
    Communication-Skills-Part-1.pptx   (72 MB)
    Communication-Skills-Part-2.pptx   (76 MB)
    Communication-Skills-Part-3.pptx   (85 MB)
    Communication-Skills-Part-4.pptx   (44 MB)
```

**Purpose:** Design reference and quality benchmark. Our generated slides need to exceed the quality of these Gamma outputs. Review these for layout patterns, image usage, visual variety, and content density before tuning the generation pipeline.

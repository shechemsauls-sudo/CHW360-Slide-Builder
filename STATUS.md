# Status — CHW360

## Current Phase: Iterative Polish — Client Review Cycle

Scale: 9 modules × ~4 parts each ≈ 2,250 slides total.

### Completed
- **Phase 1a + 1b** — Auth, roles, email, landing page, admin dashboard, CRM, analytics
- **Phase 2a + 2a.1** — Core generation pipeline, fidelity detection, prompt intelligence
- **Phase 2b + 2b.1** — Theme system, visual blocks (17 types), presentation mode, data viz
- **Phase 2c** — Image generation (DALL-E 3 / gpt-image-1), chat editing, structured notes
- **Phase 2d Sprint 1-4** — Slide CRUD, theme overhaul, smart images, settings UX, quality sweep
- **Phase 2d.5** — 4 CHW theme variants, tech debt sweep, responsive polish
- **Production** — Vercel deployed, RLS on all tables, env validation hardened
- **Renderer Quality Sweep** — Overflow prevention, frosted-glass image-full, footer prop, CycleDiagram, brand fixes
- **Email & Polish** — Production Resend emails, settings page contrast, Spanish email templates
- **Slide Builder Polish** — Overflow ContentFitter, presenter ESC fix, settings fidelity/provider filtering, keyboard shortcuts modal, universal image controls with layout picker, presenter help button
- **Infra** — Client API keys added (YouTube, xAI/Grok, Stability, Replicate, Leonardo), Supabase keep-alive cron, Vercel env fix
- **Admin Hub Overhaul** — CRM notes system, submissions Gmail-style inbox, production audit (19 fixes), UX polish, Turnstile, CSV export, brand tokens, DB indexes

### Up Next (from 2/19 client review)
- **Rendering fixes** — Bold markdown rendering, content overflow, consistent title slides
- **Theme finalization** — Cream default, 6 theme options (cream, white, black, gray, teal, green), default color per module
- **Image quality** — Lighter/brighter images, text contrast fixes, image drag/reposition for cropped faces
- **Visual variety** — More smart art/visual layout variety via prompting heuristics
- **Bulk upload** — Generate multiple decks from batch content
- **Auto-review** — Coherence check for generated decks
- **YouTube embeds** — API key received, needs UI + renderer integration
- **Phase 2e** — Export + Sharing (PPTX/PDF export, public share links)
- **Future** — Client-facing turnkey LMS-style interface

### Recent Changes
| Date | Change |
|------|--------|
| 2026-03-08 | Admin hub overhaul: CRM notes, submissions inbox, production audit, UX polish |
| 2026-03-08 | Turnstile spam protection, CSV export, brand tokens, 8 DB indexes |
| 2026-03-08 | Added client API keys, Supabase keep-alive cron, Vercel env fix |
| 2026-02-19 | API key setup guide (PDF) for client |
| 2026-02-19 | Client review meeting — iterative polish phase |

### Image Style Prompt (from Shechem)
Warm natural lighting, clean minimal design, smooth edges, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, school gym, school cafeteria, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.

### Citation Prompt (from Shechem)
Add evidence-based citations (2020–2025, APA 7th edition) to presentations. 1–2 in-text citations per content slide where specific claims need evidence. Full references on a References slide. Sources: peer-reviewed journals, major health orgs (APA, SAMHSA, NIMH, NAMI, CDC, WHO), systematic reviews/meta-analyses. Skip: title/welcome slides, thank you/closing, test/assessment placeholders, practice scenarios, local resource slides, reflection/discussion prompts. Weave citations naturally — don't disrupt flow, tone, or accessibility level.

### Waiting on Client
- Updated/improved content inputs (more content per slide) → shared Google Drive
- ~~Sample Gamma slides from past renditions~~ ✓ received

### Received from Client
- Image style prompt (Texas-themed, diverse, community-focused) → `docs/generation-prompts.md`
- Citation prompt (APA 7th, 2020–2025, health orgs) → `docs/generation-prompts.md`
- Sample input: Organizational Skills Parts 1–4 (DOCX) → `test-content/organizational-skills/`
- Reference slides: Communication Skills Parts 1–4 (PPTX, Gamma) → `test-content/reference-slides/` — quality benchmark, ours must exceed these

---
*Last updated: 2026-03-08 (session 2)*

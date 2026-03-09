# Status — CHW360

## Current Phase: Iterative Polish — Client Review Cycle

Scale: 9 modules × ~4 parts each ≈ 2,250 slides total.

### Completed
- **Phase 1a + 1b** — Auth, roles, email, landing page, admin dashboard, CRM, analytics
- **Phase 2a + 2a.1** — Core generation pipeline, fidelity detection, prompt intelligence
- **Phase 2b + 2b.1** — Theme system, visual blocks (17 types), presentation mode, data viz
- **Phase 2c** — Image generation (DALL-E 3 / gpt-image-1), chat editing, structured notes
- **Phase 2d** — Slide CRUD, theme overhaul, smart images, settings UX, quality sweep, 4 CHW theme variants, tech debt sweep, responsive polish
- **Production** — Vercel deployed, RLS on all tables, env validation hardened
- **Quality Sweeps** — Overflow prevention, frosted-glass image-full, ContentFitter, brand fixes, email polish, Spanish templates
- **Infra** — Client API keys (YouTube, xAI/Grok, Stability, Replicate, Leonardo), Supabase keep-alive cron
- **Admin Hub Overhaul** — CRM notes, submissions inbox, production audit (19 fixes), Turnstile, CSV export, brand tokens, DB indexes
- **Slide Builder Production (6 sprints)** — Bold markdown, image style, APA citations, provider cleanup, deck groups, YouTube recs, bulk upload, AI review, 3 image providers (Stability/Replicate/Leonardo), presenter ESC fix, image drag/reposition

### Up Next
> All production sprints complete. Remaining backlog:

- **Phase 2e** — PPTX/PDF export, public share links
- **Future** — Client-facing turnkey LMS-style interface

### Recent Changes
| Date | Change |
|------|--------|
| 2026-03-08 | Sprints 5-6 + final polish: deck groups, YouTube, bulk upload, review, 3 image providers, presenter fix, focal point |
| 2026-03-08 | Sprints 1-4: markdown blocks, image style, citations, provider cleanup, settings UI |
| 2026-03-08 | Admin hub overhaul: CRM notes, submissions inbox, production audit, UX polish |
| 2026-03-08 | Turnstile, CSV export, brand tokens, API keys, Supabase keep-alive |
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
*Last updated: 2026-03-08 (session 4)*

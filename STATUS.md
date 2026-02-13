# Status — CHW360

## Current Phase: Phase 2b Complete — Image Generation Next

### Completed
- **Phase 1a + 1b** — Auth, roles, email, landing page, admin dashboard, CRM, analytics
- **Phase 2a: Core Generation Pipeline** — AI slide generation from uploaded content (OpenAI + Anthropic), deck CRUD, provider selector, file upload (PDF/DOCX/MD/TXT), slide count slider (max 120)
- **Phase 2a.1: Source Fidelity** — Smart fidelity detection, fidelity slider (Verbatim/Balanced/Creative), fidelity-aware prompts, markdown rendering via block system
- **Phase 2b: Themes + Visuals + Presentation** — 4 built-in themes, theme selector, slide renderer (16:9, 5 layouts), 10 pre-built visual blocks, presentation mode with speaker notes

### Blocked
- **Production `/admin` broken** — DATABASE_URL likely missing on Vercel (needs client debug session)

### Recent Changes
| Date | Change |
|------|--------|
| 2026-02-13 | Phase 2b complete: 4 themes, slide renderer, 10 visual blocks, presentation mode |
| 2026-02-12 | Phase 2a.1 complete: fidelity detection, fidelity slider, prompt tightening |
| 2026-02-12 | Phase 2a complete: decks table, AI providers, parsers, deck router, new/view pages |
| 2026-02-12 | Fix DOCX upload (double-parse bug), fix delete button (Link nesting), bump slide count max to 120 |
| 2026-02-12 | Detailed ROADMAP.md with Phases 2a.1 through 3 |

---
*Last updated: 2026-02-13*

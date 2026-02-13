# TODO — CHW360

## Critical (blocks production)
- [ ] Vercel env debug session: DATABASE_URL likely missing/wrong — `/admin` returns `server_error`
- [ ] Verify all Vercel env vars match local `.env` (need client's Vercel access)

## Bugs (broken functionality)
- [ ] `/admin` crashes on production (database query fails)

## Phase 2c: Image Generation + Chat Editing (Next Up)
- [ ] DALL-E 3 / gpt-image-1 integration for slide images
- [ ] Supabase Storage bucket for generated images
- [ ] "Generate Images" button (batch generation)
- [ ] Per-slide image controls (regenerate, edit prompt, remove)
- [ ] LLM chat editing panel (natural language slide feedback)
- [ ] Context-aware single-slide regeneration

## Tech Debt (code quality)
- [ ] Add RLS policies to all tables (currently RLS enabled but no policies)
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [ ] Add Drizzle `relations()` to schema (needed for relational queries)
- [ ] Undo CI env validation bypass (`src/env.js`) once Vercel env is confirmed

## Enhancements (nice to have)
- [ ] PPTX/PDF export (Phase 2d)
- [ ] Public share links (Phase 2d)
- [ ] AI provider settings in `/admin/settings` (Phase 2d)
- [ ] Admin: export submissions as CSV

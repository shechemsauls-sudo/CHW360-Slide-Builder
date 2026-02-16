# TODO — CHW360

## Critical (blocks production)
_(none)_

## Bugs (broken functionality)
_(none)_

## Tech Debt (code quality)
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [x] Add Drizzle `relations()` to schema (needed for relational queries)
- [x] Extract `parseSpeakerNotes()` into shared utility (`src/lib/slides/parse-speaker-notes.ts`)
- [ ] Enable leaked password protection in Supabase Auth dashboard
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc. are empty strings)
- [x] Add `createdAt` to `providerPreferences` table (already present in schema)
- [x] Consolidate `process.env!` → validated `env` import in supabase client files

## Brand Polish (slide builder UI drift)
- [x] Audit all slide builder pages for off-brand hex colors, inconsistent teal/coral usage
- [ ] Replace hardcoded hex colors with shared brand tokens where possible
- [x] Deck header buttons: icon-only on mobile with flex-wrap
- [x] Slide list: mobile toggle/collapse for deck viewer
- [x] Image provider in batch generate (reads user's saved preference)

## Enhancements (nice to have)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Admin: export submissions as CSV

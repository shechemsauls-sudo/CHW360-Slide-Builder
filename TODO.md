# TODO — CHW360

## Critical (blocks production)
_(none)_

## Bugs (broken functionality)
_(none)_

## Tech Debt (code quality)
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [ ] Add Drizzle `relations()` to schema (needed for relational queries)
- [ ] Extract `parseSpeakerNotes()` into shared utility (duplicated in deck page + present page)
- [ ] Enable leaked password protection in Supabase Auth dashboard
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc. are empty strings)

## Enhancements (nice to have)
- [ ] Phase 2d Sprint 4: Settings UX (unified panel, custom instructions, tone) → `docs/sprint-4-scope.md`
- [ ] Image provider selector in batch generate (currently defaults to DALL-E 3)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Admin: export submissions as CSV

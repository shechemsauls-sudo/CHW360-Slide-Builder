# TODO — CHW360

## Critical (blocks production)
_(none)_

## Bugs (broken functionality)
- [ ] Fix Vercel RESEND_API_KEY (has surrounding quotes — remove them in Vercel dashboard)

## Tech Debt (code quality)
- [ ] Remove Resend diagnostic logging once email confirmed working in production
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [ ] Enable leaked password protection in Supabase Auth dashboard
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc. are empty strings)
- [ ] `IMAGE_ELIGIBLE_LAYOUTS` export in types.ts may be unused now — verify and remove if so
- [ ] `cleanImagePrompts()` removed from generation — verify no side effects on existing decks

## Brand Polish (slide builder UI drift)
- [ ] Replace hardcoded hex colors with shared brand tokens where possible

## Enhancements (nice to have)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Admin: export submissions as CSV

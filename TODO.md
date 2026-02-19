# TODO — CHW360

## Critical (blocks production)
_(none)_

## Bugs (broken functionality — from 2/19 client review)
- [ ] Fix bold markdown not rendering in slide content
- [ ] Fix content overflow on dense slides
- [ ] Fix images too dark — lighter/brighter defaults needed
- [ ] Enforce consistent title slide layout across all modules
- [ ] Fix Vercel RESEND_API_KEY (has surrounding quotes — remove them in Vercel dashboard)

## Enhancements (from 2/19 client review)
- [ ] Set cream as default theme
- [ ] Finalize 6 theme options: cream, white, black, gray, teal, green
- [ ] Assign default theme color per module (9 modules), user-overridable
- [ ] Add more smart art/visual layout variety (better prompting + heuristics)
- [ ] Add image drag/reposition feature for cropped faces
- [ ] Add bulk upload — generate multiple decks from batch content
- [ ] Auto-review/coherence check for generated decks
- [ ] YouTube embed support (awaiting API key from client)

## Enhancements (backlog)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Admin: export submissions as CSV

## Tech Debt (code quality)
- [ ] Remove Resend diagnostic logging once email confirmed working in production
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [ ] Enable leaked password protection in Supabase Auth dashboard
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc. are empty strings)
- [ ] `IMAGE_ELIGIBLE_LAYOUTS` export in types.ts may be unused now — verify and remove if so
- [ ] `cleanImagePrompts()` removed from generation — verify no side effects on existing decks

## Brand Polish (slide builder UI drift)
- [ ] Replace hardcoded hex colors with shared brand tokens where possible

## Matthew Action Items (non-code)
- [x] ~~Send handoff document with API key instructions to Shechem~~ → `docs/api-key-setup-guide.pdf`
- [x] ~~Send Shechem logo files: teal background, plain background, LinkedIn banner~~

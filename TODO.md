# TODO — CHW360

## Critical (blocks production)
_(none)_

## Bugs (from 2/19 client review)
- [ ] Fix bold markdown not rendering in slide content
- [ ] Fix content overflow on dense slides
- [ ] Fix images too dark — lighter/brighter defaults, text contrast
- [ ] Enforce consistent title slide layout across all modules

## Enhancements (from 2/19 client review)
- [ ] Set cream as default theme
- [ ] Finalize 6 theme options: cream, white, black, gray, teal, green
- [ ] Assign default theme color per module (9 modules), user-overridable
- [ ] Add more smart art/visual layout variety (better prompting + heuristics)
- [ ] Add image drag/reposition feature for cropped faces
- [ ] Add bulk upload — generate multiple decks from batch content
- [ ] Auto-review/coherence check for generated decks
- [ ] YouTube embed support (API key received — needs UI + renderer)

## Enhancements (backlog)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Client-facing turnkey LMS-style interface (future phase)

## Tech Debt (code quality)
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc. are empty strings)
- [ ] Set Turnstile keys in Vercel to activate spam protection (code is wired)

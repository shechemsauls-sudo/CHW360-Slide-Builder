# TODO — CHW360 Slide Builder

## Backlog (future phases)
- [x] PDF export ✓ (implemented)
- [ ] PPTX export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Client-facing turnkey LMS-style interface (future phase)

## Enhancements
- [ ] Test 2-pass generation pipeline with fresh deck — verify block diversity, citations, bookends, image coverage
- [ ] Parallelize image generation in batches (production reliability)
- [ ] Image gen progress visibility — poll for newly arrived images in UI

## Tech Debt
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc.)
- [ ] Set Turnstile keys in Vercel to activate spam protection (code is wired)
- [ ] Push deck_groups schema to Supabase (migration applied via MCP, verify with drizzle push when network allows)
- [ ] Run production build to verify all session changes compile cleanly
- [ ] Remove `?v=2` cache-bust params from logo refs once CDN cache is fully flushed

# TODO — CHW360 Slide Builder

## Backlog (future phases)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Client-facing turnkey LMS-style interface (future phase)

## Enhancements
- [ ] Prompt tuning pass — review block mandate (50% may be too aggressive for short decks), citation toggle, image percentage control
- [ ] Fix tone default mismatch — new deck page defaults "training", saved preferences default "professional"

## Tech Debt
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc.)
- [ ] Set Turnstile keys in Vercel to activate spam protection (code is wired)
- [ ] Push deck_groups schema to Supabase (migration applied via MCP, verify with drizzle push when network allows)
- [ ] Run production build to verify all session changes compile cleanly

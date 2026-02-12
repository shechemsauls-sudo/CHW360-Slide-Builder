# TODO — CHW360

## Critical (blocks production)
- [ ] Vercel env debug session: DATABASE_URL likely missing/wrong — `/admin` returns `server_error`
- [ ] Verify all Vercel env vars match local `.env` (need client's Vercel access)
- [ ] Undo CI env validation bypass (`src/env.js`) once Vercel env is confirmed

## Bugs (broken functionality)
- [ ] `/admin` crashes on production (database query fails → redirects to `/login?error=server_error`)
- [ ] Password reset flow redirects to broken `/admin` on production
- [ ] Claim email flow redirects to broken `/admin` on production
- [ ] Verify admin login works end-to-end after NULL column fix (manual test needed)
- [ ] Verify test user `mmicel583@gmail.com` has no NULL column issues (created via raw SQL)

## Tech Debt (code quality)
- [ ] Add RLS policies to all tables (currently RLS enabled but no policies)
- [ ] Add Turnstile spam protection to contact form (package installed, not wired)
- [ ] Add loading skeletons to admin pages
- [ ] Add Drizzle `relations()` to schema (needed for Phase 2 relational queries)
- [ ] Split landing page into server + client components (SSR/SEO improvement)
- [ ] Replace admin header/layout `!important` CSS with Tailwind approach
- [ ] Don't create auth users via raw SQL — use Supabase admin API instead

## Enhancements (nice to have)
- [ ] Slide builder (Phase 2 — AI content, themes, export)
- [ ] Presentation mode for slides
- [ ] Admin: referrer breakdown on analytics page
- [ ] Admin: export submissions as CSV
- [ ] Admin: per-page metadata titles for sub-pages

# TODO — CHW360

## Critical (blocks production)
- (none)

## Bugs (broken functionality)
- [ ] Verify admin login works end-to-end after NULL column fix (manual test needed)

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

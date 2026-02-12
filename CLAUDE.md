# CHW360 — Shechem Community Health

Web app for CHW360: landing page, admin dashboard, and slide builder (Phase 2).

## Quick Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run typecheck  # Type check
npm run db:push    # Push schema to Supabase
npm run db:studio  # Open Drizzle Studio
```

## Tech Stack

- **Framework:** Next.js 15 + React 19 + TypeScript
- **API:** tRPC 11 + TanStack Query
- **Database:** Drizzle ORM + Supabase (PostgreSQL)
- **Auth:** Supabase Auth (OAuth: Google, GitHub)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Email:** Resend
- **Toasts:** Sonner

## Key Paths

```
src/app/                    # Pages and routes
src/app/admin/              # Admin dashboard (auth-gated)
src/components/admin/       # Admin sidebar, header, layout
src/components/ui/          # shadcn/ui components
src/lib/supabase/           # Supabase client (browser + server)
src/lib/resend.ts           # Email notifications
src/server/api/routers/     # tRPC routers (slide, contact, analytics, users)
src/server/db/schema.ts     # Database schema
src/trpc/                   # tRPC client (RSC + React)
public/chw/                 # Brand assets (logo, heroes, icons)
docs/                       # PRD and proposals
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (public) |
| `/login` | Auth login + claim account (teal/coral brand) |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password (from email link) |
| `/admin` | Dashboard overview (admin-only) |
| `/admin/submissions` | Contact form submissions |
| `/admin/analytics` | Page views and form funnel |
| `/admin/users` | User management (invite, roles) |
| `/admin/slides` | Slide builder (coming soon) |
| `/admin/assets` | Brand assets reference |
| `/admin/settings` | Account settings |

## Database Tables (prefix: `chw360_`)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to Supabase auth (includes role column) |
| `slides` | Slide content (Phase 2) |
| `contact_submissions` | Landing page contact form entries |
| `page_views` | Analytics events (views, interactions) |

## Brand Reference

| Token | Value | Usage |
|-------|-------|-------|
| Dark Teal | `#2D5A5A` | Nav, footer, headings |
| Coral | `#C9725B` | CTAs, accents, active states |
| Cream | `#F5EDE6` | Hero/section backgrounds |
| Light Cream | `#FAF7F4` | Section backgrounds |
| Container | `#EDE4DA` | Form containers |
| Text Gray | `#4A5568` | Body text |
| Headings font | Libre Baskerville | Serif, 400/700 |

## Conventions

- Path alias: `~/` maps to `src/`
- Table prefix: `chw360_` (multi-project safe)
- `publicProcedure` for unauthenticated routes
- `protectedProcedure` for authenticated routes
- `adminProcedure` for admin-only routes (checks profile role)
- Server components by default; `"use client"` only when needed
- Admin sidebar uses teal/coral palette (not gold)

## Env Variables

- `DATABASE_URL` / `DATABASE_URL_DIRECT` — Supabase Postgres
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Server admin operations
- `RESEND_API_KEY` — Email notifications (optional, form works without it)

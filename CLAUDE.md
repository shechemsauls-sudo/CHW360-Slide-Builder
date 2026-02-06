# CHW360 Slide Builder

Interactive web application for building slides — built for Shechem.

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

## Key Paths

```
src/app/              # Pages and routes
src/components/ui/    # shadcn/ui components
src/lib/supabase/     # Supabase client (browser + server)
src/server/api/       # tRPC routers
src/server/db/        # Drizzle schema
src/trpc/             # tRPC client (RSC + React)
```

## Conventions

- Path alias: `~/` maps to `src/`
- Table prefix: `chw360_` (multi-project safe)
- Use `publicProcedure` for unauthenticated routes
- Use `protectedProcedure` for authenticated routes
- Server components by default; add `"use client"` only when needed

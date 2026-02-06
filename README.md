# CHW360 Slide Builder

Interactive web application for building slides — built for Shechem.

## Getting Started

1. Copy `.env.example` to `.env` and fill in values:
   - Create a Supabase project at https://supabase.com
   - Add `DATABASE_URL` (from Supabase project settings)
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add `SUPABASE_SERVICE_ROLE_KEY`
2. `npm install`
3. `npm run db:push` (push schema to Supabase)
4. `npm run dev`

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- tRPC 11 + TanStack Query
- Drizzle ORM + Supabase (PostgreSQL)
- Supabase Auth (OAuth)
- Tailwind CSS 4 + shadcn/ui

## Available Commands

```bash
npm run dev        # Start development server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Type check without building
npm run db:push    # Push schema to database
npm run db:studio  # Open Drizzle Studio
npm run db:generate # Generate migrations
npm run db:migrate  # Run migrations
```

## Documentation

- [STATUS.md](./STATUS.md) — Current feature status
- [TODO.md](./TODO.md) — Tracked work items
- [ROADMAP.md](./ROADMAP.md) — Phased development plan
- [CLAUDE.md](./CLAUDE.md) — AI assistant context

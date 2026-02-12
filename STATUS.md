# Status — CHW360

## Current Phase: Phase 1 Code Complete — Production Env Needs Debug

### Completed
- **Phase 1a + 1b code complete** — all auth, roles, email, landing page updates done
- RBAC: `adminProcedure` + admin layout role gate (non-admins redirected)
- Auth flows: forgot password, reset password, magic link claim, invite-only (no public signup)
- Admin user management: invite users, send claim emails, toggle roles
- Branded email templates (contact notifications + claim invites)
- Landing page copy + 5 hero carousel images, readable contact form
- Callback route handles magiclink, recovery, invite tokens
- Database: role column on profiles, admin user created
- Deploy banner on admin dashboard (build-time timestamp)
- Supabase configured: SMTP (Resend), redirect URLs, auth callbacks
- Admin brand assets page shows all 5 hero images
- Build passes, typecheck passes

### In Progress
- None

### Blocked
- **Production `/admin` broken** — database query fails on Vercel (likely missing `DATABASE_URL`)
- Need debug session with client (Vercel access) to verify env vars
- CI env validation bypass in `src/env.js` should be reverted once env is confirmed

### Recent Changes
| Date | Change |
|------|--------|
| 2026-02-12 | Production debug: `/admin` server_error — DATABASE_URL likely missing on Vercel |
| 2026-02-12 | Fix login page (remove OAuth, add claim/forgot), contact form readability, asset cleanup |
| 2026-02-12 | Fix Supabase auth user NULL columns, configure SMTP + redirect URLs |
| 2026-02-12 | Created first admin user, added deploy banner to admin |
| 2026-02-12 | Phase 1b: auth flows, RBAC, user management, branded emails, landing updates |
| 2026-02-12 | Quality sweep: slide auth fix, a11y, XSS prevention, env validation |

---
*Last updated: 2026-02-12*

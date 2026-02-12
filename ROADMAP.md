# Roadmap — CHW360

## Phase 1a: Foundation
- [x] Project scaffold (Next.js, tRPC, Drizzle, Supabase)
- [x] Auth (Supabase OAuth + email/password)
- [x] Database schema (profiles, slides, contact_submissions, page_views)
- [x] Landing page with hero carousel and contact form
- [x] Admin dashboard with sidebar navigation
- [x] Admin pages (overview, submissions, analytics, assets, settings)
- [x] Brand-consistent auth pages (teal/coral)
- [x] shadcn/ui component library
- [x] Email notifications via Resend
- [x] Analytics tracking (page views, form funnel)
- [x] Enable OAuth + push schema + add Resend key (env setup)

## Phase 1b: Auth & Polish
- [x] Role-based access (admin role column + adminProcedure)
- [x] Admin layout role gate
- [x] Service role admin client (supabaseAdmin)
- [x] Invite/claim auth flow (magic link OTP)
- [x] Forgot password / reset password pages
- [x] Admin user management UI (invite, roles, claim emails)
- [x] Branded email templates (contact + claim)
- [x] Landing page copy and hero image updates
- [x] Disable public signup (removed signup page)
- [x] Callback route handles invite/recovery/magiclink tokens

## Phase 2: Core Slide Builder
- [ ] Slide editor UI (create, edit, delete slides)
- [ ] AI content generation (multiple providers)
- [ ] Input processing and prompt engineering
- [ ] Theme system with brand-consistent templates
- [ ] Live preview
- [ ] Auto-save

## Phase 3: Presentation & Export
- [ ] Presentation/slideshow mode
- [ ] Export to PDF
- [ ] Export to PPTX
- [ ] Template library

## Phase 4: Collaboration & Polish
- [ ] Share slides (public/private links)
- [ ] Collaborative editing
- [ ] Version history
- [ ] Mobile responsiveness audit

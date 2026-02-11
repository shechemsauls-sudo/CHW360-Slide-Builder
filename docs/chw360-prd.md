# Product Requirements Document
## CHW360 Web Ecosystem

**Client:** Shechem Sauls / CHW360
**Provider:** MiracleMind
**Date:** February 2026
**Version:** 1.0

---

## 1. Executive Summary

A self-contained web ecosystem for CHW360 consisting of two subsystems: a public-facing landing page with contact management, and a protected AI-powered slide builder for transforming training content into professional presentations. The product will be delivered as an independent package for the client to own, host, and maintain.

**Total Investment:** $2,000.00
- Subsystem 1 (Landing Page): $500.00
- Subsystem 2 (Slide Builder): $1,500.00

---

## 2. Subsystem 1: Landing Page + Contact Management — $500.00

### 2.1 Overview

A responsive landing page built from a client-provided mockup, featuring a hero carousel, contact form, and a lightweight admin dashboard for managing submissions and viewing page analytics.

### 2.2 Features

#### Public-Facing Landing Page
- **Hero Carousel**: Rotating images/content showcasing diversity in CHW training programs
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Contact Form**: Name, email, phone, message fields with spam protection (Cloudflare Turnstile)
- **Brand-Consistent Styling**: Client's colors, typography, and assets applied throughout

#### Admin Dashboard — Contact Management
- **Submission List**: View all contact form submissions with timestamp, read/unread status
- **Page View Analytics**: Total views, unique visitors, views over time (simple chart)
- **Form View Tracking**: How many visitors viewed/interacted with the contact form vs. submitted
- **Email Notifications**: Automatic email sent to admin inbox + client on each new submission
- **Basic Statistics**: Submission count, conversion rate (views → submissions), time-series trends

### 2.3 Acceptance Criteria

- [ ] Landing page matches provided mockup within reasonable fidelity, plus any approved changes by the client during the development process
- [ ] Hero carousel cycles through at minimum 3 images/slides
- [ ] Contact form validates inputs and displays success/error states
- [ ] Form submissions stored in database with timestamp
- [ ] Email notification fires on each submission (to admin + client inboxes)
- [ ] Admin dashboard shows submissions list with read/unread toggle
- [ ] Page view and form interaction counts displayed in dashboard
- [ ] Spam protection active on contact form
- [ ] Mobile-responsive across common breakpoints

---

## 3. Subsystem 2: Protected AI Slide Builder — $1,500.00

### 3.1 Overview

A protected tool that accepts structured training content, applies a selected visual theme, and generates a complete slide deck with speaker notes, supporting media recommendations, and multiple export formats. Powered by LLM and image generation AI.

### 3.2 User Flow

```
1.  User logs in (protected route)
2.  User uploads/pastes input document (structured content)
3.  User selects a theme from the default library
4.  User selects AI providers:
    a. LLM provider (for content generation + speaker notes)
    b. Image generation provider (or disable images)
    → In-app info cards show pros, cons, and cost estimate for each option
5.  User provides optional prompts and design preferences
6.  System generates slide deck:
    a. Web-view slides with speaker notes
    b. AI-generated images where appropriate (if enabled)
    c. Video recommendations from YouTube/web
7.  User reviews in presentation mode (with speaker notes panel)
8.  User provides prompt-based feedback to adjust design/content
9.  System regenerates affected slides (using same providers)
10. User exports final deck (PDF, PPTX, or web link)
```

### 3.3 Features

#### Input Processing
- **Supported Formats**: Markdown (primary), plain text, PDF, Word (.docx)
- **Input Protocol**: Structured format with slide numbers, slide titles, and slide content
- **Content Parsing**: AI extracts slide structure, speaker notes, and content type per slide

#### Theme System
- **Default Theme Library**: Pre-built themes with distinct visual identities avialble via selecting color pallete and font types.
- **Theme Components**: Color palette, typography, layout templates, accent styles
- **Consistent Application**: Selected theme applied uniformly across all generated slides

#### AI Provider Selection
Users choose their preferred AI providers before generation. Each option displays an in-app info card with a brief description, strengths, limitations, and estimated cost per deck.

**LLM Providers (user selects one):**

| Provider | Strengths | Limitations | Est. Cost/Deck |
|----------|-----------|-------------|----------------|
| **OpenAI GPT-4o** | Fast, excellent structured output, reliable formatting | Moderate context window (128K) | ~$0.03–0.10 |
| **Anthropic Claude Sonnet** | Best for long documents (200K context), nuanced writing | Slightly higher cost | ~$0.05–0.15 |
| **Google Gemini 2.0 Flash** | Very fast, cheapest option, 1M context | Less precise formatting | ~$0.01–0.04 |
| **Google Gemini 2.5 Pro** | Strong reasoning, 1M context, good structured output | Slower than Flash | ~$0.05–0.20 |
| **DeepSeek V3** | Extremely cheap, competitive quality | Newer provider, less established | ~$0.005–0.02 |

**Image Generation Providers (user selects one, or disables):**

| Provider | Strengths | Limitations | Est. Cost/Image |
|----------|-----------|-------------|-----------------|
| **OpenAI DALL-E 3** | Consistent quality, good prompt adherence | Higher cost per image | ~$0.04–0.08 |
| **OpenAI gpt-image-1** | Highest quality, best text rendering | Most expensive option | ~$0.02–0.19 |
| **Stability AI (SD3/SDXL)** | Very cheap, good for illustrations | Less prompt-precise than DALL-E | ~$0.002–0.01 |
| **Flux (via Replicate)** | High quality, photorealistic, fast | Moderate cost | ~$0.01–0.05 |
| **Google Imagen 3** | Strong quality, good for diagrams | Requires Google Cloud setup | ~$0.02–0.04 |
| **Disabled** | No AI images generated | Slides use layout/text only | $0.00 |

> *In-app disclaimer: "AI provider costs are billed directly to your API accounts. Costs shown are estimates and may vary based on content length and complexity. You can change providers between decks."*

#### Slide Generation (AI-Powered)
- **Content Structuring**: Selected LLM organizes raw content into slide-appropriate chunks
- **Speaker Notes**: AI-generated presenter talking points for each slide
- **Image Generation**: Selected image provider creates visuals (diagrams, illustrations, decorative elements) where content benefits from imagery — or disabled per user preference
- **Layout Intelligence**: AI selects appropriate layout per content type (title slide, bullet points, comparison, image-heavy, activity, case study, etc.)

#### Video Recommendations
- **YouTube Search**: AI-curated video suggestions relevant to slide/section content
- **Contextual Relevance**: Videos matched to training topics, not generic results
- **Embedded Links**: Video thumbnails + links displayed alongside relevant slides

#### Presentation Mode
- **Web View**: Full-screen, scroll-based or slide-by-slide navigation
- **Speaker Notes Panel**: Toggleable side panel or secondary display view
- **Keyboard Navigation**: Arrow keys, spacebar, escape for presentation control
- **Progress Indicator**: Current slide / total slides

#### Export Options
- **PDF Download**: Formatted slide deck as PDF (slides only, or slides + notes)
- **PowerPoint Export (.pptx)**: Native PowerPoint file with slides, notes, and basic formatting
- **Web Link**: Shareable URL for the web-view presentation

#### Feedback & Iteration
- **Prompt-Based Editing**: User provides natural language feedback ("make slide 5 more visual", "add a comparison table to slide 12")
- **Targeted Regeneration**: Only affected slides regenerate, preserving approved content
- **Edit History**: Track changes across feedback rounds

### 3.4 Acceptance Criteria

- [ ] User can upload/paste content in markdown, plain text, PDF, and Word formats
- [ ] System correctly parses input into individual slide structures
- [ ] At least 3 selectable themes available in the theme library
- [ ] Generated slides display in a web-view with consistent theme application
- [ ] Speaker notes generated for each slide and accessible in presentation mode
- [ ] AI-generated images appear on slides where contextually appropriate
- [ ] At least 2 video recommendations provided per deck (where relevant content exists)
- [ ] User can provide text-based feedback and see updated slides
- [ ] PDF export produces a formatted document
- [ ] PPTX export produces a valid PowerPoint file with slides and speaker notes
- [ ] Presentation mode supports full-screen view with keyboard navigation
- [ ] Protected behind authentication — only authorized users can access
- [ ] User can select from at least 3 LLM providers before generation
- [ ] User can select from at least 3 image generation providers (or disable images)
- [ ] Each provider option displays an info card with pros, cons, and cost estimate
- [ ] System gracefully handles missing API keys (provider greyed out with "API key not configured" message)
- [ ] Provider selection persists as a user preference for future sessions

---

## 4. Technical Stack & Infrastructure

### 4.1 Core Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (App Router) | Server components, API routes, cron jobs |
| Language | TypeScript | End-to-end type safety |
| Database | Supabase (PostgreSQL) | Auth, storage, real-time |
| ORM | Drizzle | Type-safe database queries |
| API Layer | tRPC | Type-safe client-server communication |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| Hosting | Vercel | Git-based deployment from GitHub |
| Auth | Supabase Auth | Email/password for admin access |

### 4.2 Hosting Architecture

```
GitHub Repository (client-owned, provider as collaborator)
        │
        ▼
Vercel (auto-deploy on push)
        │
        ├── Landing Page (public)
        ├── Admin Dashboard (protected)
        ├── Slide Builder (protected)
        └── API Routes + Cron Jobs
                │
                ▼
        Supabase (database + auth + file storage)
```

---

## 5. Third-Party Services & APIs

### 5.1 Required Services

| Service | Purpose | Account Owner | Free Tier? |
|---------|---------|---------------|------------|
| **Vercel** | App hosting | Client | Yes* |
| **Supabase** | Database, auth, storage | Client | Yes* |
| **GitHub** | Code repository | Client | Yes |
| **Resend** | Transactional email | Client | Yes (3K emails/mo) |

*\*See Section 7 (Cost Projections) for free tier limitations.*

### 5.2 AI Services — Multi-Provider Architecture

The slide builder supports **multiple LLM and image generation providers** as user-selectable options. The system is built with a provider-agnostic abstraction layer — each provider implements a common interface, making it straightforward to add or remove providers without rewriting business logic.

All provider API keys are collected upfront during kickoff. Providers with missing or invalid keys are automatically greyed out in the UI with a "Not configured" label.

#### LLM Providers

| # | Provider | API Key Source | Signup URL | Notes |
|---|----------|---------------|------------|-------|
| 1 | **OpenAI GPT-4o** | platform.openai.com → API Keys | platform.openai.com | Also covers DALL-E 3 + gpt-image-1 |
| 2 | **Anthropic Claude Sonnet** | console.anthropic.com → API Keys | console.anthropic.com | Best for long documents |
| 3 | **Google Gemini 2.0 Flash** | aistudio.google.com → API Keys | aistudio.google.com | Free tier available (15 RPM) |
| 4 | **Google Gemini 2.5 Pro** | aistudio.google.com → API Keys | aistudio.google.com | Same key as Flash |
| 5 | **DeepSeek V3** | platform.deepseek.com → API Keys | platform.deepseek.com | Cheapest option |

#### Image Generation Providers

| # | Provider | API Key Source | Signup URL | Notes |
|---|----------|---------------|------------|-------|
| 1 | **OpenAI DALL-E 3** | Same as OpenAI LLM key | — | Shared key with GPT-4o |
| 2 | **OpenAI gpt-image-1** | Same as OpenAI LLM key | — | Shared key with GPT-4o |
| 3 | **Stability AI (SD3/SDXL)** | platform.stability.ai → API Keys | platform.stability.ai | Cheapest per image |
| 4 | **Flux (via Replicate)** | replicate.com → API Tokens | replicate.com | Also hosts other models |
| 5 | **Google Imagen 3** | Google Cloud Console → Vertex AI | console.cloud.google.com | Same project as YouTube API |

#### Video & Search

| Service | API Key Source | Signup URL | Notes |
|---------|---------------|------------|-------|
| **YouTube Data API v3** | Google Cloud Console → Credentials | console.cloud.google.com | Free 10K units/day |

#### Architecture Notes

- **Provider abstraction**: Each LLM and image provider implements a common `generateSlides()` / `generateImage()` interface. Adding a new provider means writing one adapter file — no changes to business logic.
- **Graceful degradation**: If a selected provider's API returns an error, the system surfaces a clear message and offers to retry with an alternative provider.
- **Cost transparency**: Each generation logs the provider used, token count (for LLMs), and estimated cost. Viewable in the admin dashboard.
- **Future-proof**: New providers (Mistral, Grok, Llama via Together AI, etc.) can be added post-delivery by the client or through a maintenance engagement.

### 5.3 Document Parsing

| Library | Purpose | Cost |
|---------|---------|------|
| **mammoth** (npm) | Word (.docx) → HTML/text | Free (open source) |
| **pdf-parse** (npm) | PDF → text extraction | Free (open source) |
| **marked/remark** (npm) | Markdown parsing | Free (open source) |
| **Cloudflare Turnstile** | Bot/spam protection for contact form | Free |

### 5.4 Export Generation

| Library | Purpose | Cost |
|---------|---------|------|
| **pptxgenjs** (npm) | Generate .pptx PowerPoint files | Free (open source) |
| **@react-pdf/renderer** or **puppeteer** | Generate PDF exports | Free (open source) |

### 5.5 Optional Enhancements (Not in Scope — Future)

| Service | Purpose | Why Consider Later |
|---------|---------|-------------------|
| **Plausible / PostHog** | Advanced analytics | If basic analytics outgrows custom solution |
| **Sentry** | Error monitoring | If client wants proactive crash alerts |
| **Upstash Redis** | Rate limiting | If abuse becomes an issue |
| **Cloudinary** | Image optimization/CDN | If slide images need optimization at scale |
| **Google Docs API** | Google Docs input support | If client requests this format later |
| **Serper API** | Web search for videos beyond YouTube | If YouTube results aren't sufficient |

---

## 6. API Key Summary

All API keys are stored as **environment variables in Vercel** — never committed to code. Keys are collected upfront during kickoff. Providers with missing keys are automatically disabled in the UI.

#### Infrastructure Keys (Required)

| Environment Variable | Service | Who Creates | How to Get |
|---------------------|---------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Client | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Client | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Client | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Resend (email) | Client | resend.com → API Keys |
| `CRON_SECRET` | Vercel cron auth | Provider | Random string, generated during setup |

#### AI Provider Keys (At Least One LLM Required)

| Environment Variable | Service | Who Creates | How to Get |
|---------------------|---------|-------------|------------|
| `OPENAI_API_KEY` | OpenAI (GPT-4o + DALL-E 3 + gpt-image-1) | Client | platform.openai.com → API Keys |
| `ANTHROPIC_API_KEY` | Anthropic (Claude Sonnet) | Client | console.anthropic.com → API Keys |
| `GOOGLE_AI_API_KEY` | Google (Gemini Flash + Pro + Imagen 3) | Client | aistudio.google.com → Get API Key |
| `DEEPSEEK_API_KEY` | DeepSeek (V3) | Client | platform.deepseek.com → API Keys |
| `STABILITY_API_KEY` | Stability AI (SD3/SDXL) | Client | platform.stability.ai → API Keys |
| `REPLICATE_API_TOKEN` | Replicate (Flux + other models) | Client | replicate.com → Account → API Tokens |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Client | Google Cloud Console → Credentials |

#### App Configuration

| Environment Variable | Service | Who Creates | How to Get |
|---------------------|---------|-------------|------------|
| `ADMIN_EMAIL` | Admin access | Client | Client's preferred admin email |
| `NOTIFICATION_EMAIL` | Contact form alerts | Client | Email to receive submissions |
| `NEXT_PUBLIC_APP_URL` | App base URL | Provider | Set to production domain |

> **Total accounts for client to create:** 8 (GitHub, Vercel, Supabase, Resend, OpenAI, Google Cloud, Anthropic, DeepSeek) + 2 optional (Stability AI, Replicate). Some services share keys (Google AI + YouTube use the same Google Cloud project; OpenAI covers LLM + both image generators).

---

## 7. Cost Projections

### 7.1 Monthly Operating Costs — Minimal Usage

| Service | Cost | Notes |
|---------|------|-------|
| Vercel (Hobby) | $0 | Non-commercial TOS applies (see note below) |
| Supabase (Free) | $0 | 500MB DB, 1GB storage, pauses after 7 days inactive |
| Resend | $0 | Up to 3,000 emails/month |
| AI APIs (combined) | ~$1–5 | A few slide decks per month, varies by provider |
| YouTube API | $0 | Free quota |
| **Total** | **~$1–5/mo** | |

### 7.2 Monthly Operating Costs — Heavy Usage

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro | $20 | Required for commercial use / high traffic |
| Supabase Pro | $25 | Daily backups, 8GB DB, 100GB storage |
| Resend | $0–20 | Free up to 3K emails, then $20/mo |
| AI APIs (combined) | $5–75 | Depends on provider selection + volume |
| YouTube API | $0 | Free quota sufficient for most usage |
| **Total** | **~$50–140/mo** | |

### 7.3 Cost Per Slide Deck — By Provider Combination

Estimated cost for a **20-slide deck with 5 generated images**:

| LLM Provider | Cost/Deck | Image Provider | Cost/5 Images | **Combo Total** |
|-------------|-----------|----------------|---------------|-----------------|
| DeepSeek V3 | ~$0.01 | Stability AI | ~$0.01–0.05 | **~$0.02–0.06** |
| Gemini 2.0 Flash | ~$0.01–0.04 | Stability AI | ~$0.01–0.05 | **~$0.02–0.09** |
| GPT-4o | ~$0.03–0.10 | Flux (Replicate) | ~$0.05–0.25 | **~$0.08–0.35** |
| GPT-4o | ~$0.03–0.10 | DALL-E 3 | ~$0.20–0.40 | **~$0.23–0.50** |
| Claude Sonnet | ~$0.05–0.15 | gpt-image-1 | ~$0.10–0.95 | **~$0.15–1.10** |
| Gemini 2.5 Pro | ~$0.05–0.20 | Imagen 3 | ~$0.10–0.20 | **~$0.15–0.40** |
| Any LLM | varies | Disabled | $0.00 | **LLM cost only** |

> **Cheapest combination**: DeepSeek + Stability AI (~$0.02/deck)
> **Best quality combination**: Claude Sonnet or GPT-4o + gpt-image-1 (~$0.50–1.00/deck)
> **Best value combination**: GPT-4o + Flux (~$0.15/deck) — good quality, reasonable cost

*These estimates assume ~2K input tokens + 4K output tokens for LLM, and standard resolution for images. Actual costs vary with content length and complexity.*

> **Note on Vercel Hobby Plan**: Vercel's free tier (Hobby) is designated for personal, non-commercial use per Vercel's Terms of Service. Client assumes responsibility for selecting a hosting plan appropriate for their use case. For commercial use, Vercel Pro ($20/mo) is recommended.

### 7.4 Supabase Keep-Alive

Supabase free tier pauses databases after 7 days of inactivity. A daily cron job will be included to prevent this. If the client upgrades to Supabase Pro, this is unnecessary.

---

## 8. Delivery Process

### 8.1 Development Phases

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Kickoff** | 1 session | Accounts created, credentials shared, assets collected |
| **Phase 1**: Landing Page | ~1 week | Public page + contact form + admin dashboard |
| **Review 1**: Landing Page Feedback | — | Client reviews, provides consolidated feedback |
| **Phase 2**: Landing Page Revisions | 2–4 days | Feedback incorporated (up to 2 rounds) |
| **Phase 3**: Slide Builder Core | ~2 weeks | Input processing, theme system, LLM generation, web view |
| **Review 2**: Slide Builder Feedback | — | Client reviews, provides consolidated feedback |
| **Phase 4**: Slide Builder Revisions + Export | 1 week | Feedback incorporated, PDF + PPTX export, video recs |
| **Handoff** | 1 session | Password rotation, documentation walkthrough, training |

**Estimated Total Timeline:** 4–6 weeks

### 8.2 Revision Rounds

Each subsystem includes **1 setup round + 2 feedback rounds**.

**Definition of a feedback round:**
- One consolidated set of written change requests
- Delivered within **5 business days** of the previous deliverable
- All items must fall within the original scope defined in this document
- Changes requested outside of scope will be quoted separately

### 8.3 Handoff Deliverables

- [ ] Full source code in client's GitHub repository
- [ ] All environment variables configured in client's Vercel account
- [ ] Database schema deployed to client's Supabase instance
- [ ] `DEPLOYMENT.md` — step-by-step redeployment and environment setup guide
- [ ] `ADMIN-GUIDE.md` — how to use the admin dashboard and slide builder
- [ ] Recorded walkthrough video (15–30 minutes)
- [ ] Provider removed from all accounts / collaborator access revoked
- [ ] Client changes all temporary passwords

---

## 9. Kickoff Call Checklist

### 9.1 Pre-Call

```
KICKOFF PREPARATION — CHW360 Web Ecosystem

Please complete the following before our kickoff call on [DATE].
This looks like a lot of accounts — many are free, take 2 minutes
each, and share the same credentials (e.g., Google covers 2 services).
We collect everything upfront so you never have to pause for setup later.

─────────────────────────────────────────────
REQUIRED ACCOUNTS (6)
─────────────────────────────────────────────
[ ] GitHub → github.com
    (code repository — you'll own the source code)

[ ] Vercel → vercel.com
    (sign up with your GitHub account)

[ ] Supabase → supabase.com
    (database and authentication)

[ ] Resend → resend.com
    (email delivery for contact form notifications)

[ ] OpenAI Platform → platform.openai.com
    → Add a payment method (Settings → Billing)
    → Set a monthly spending limit: suggest $20 cap to start
    (covers GPT-4o for slide content + DALL-E/gpt-image-1 for images)

[ ] Google Cloud → console.cloud.google.com
    → Create a new project (name: "CHW360")
    → Enable "YouTube Data API v3" (for video recommendations)
    → Enable "Generative Language API" (for Gemini AI access)
    → Create an API key (APIs & Services → Credentials)
    (one account covers both YouTube search and Google Gemini AI)

─────────────────────────────────────────────
RECOMMENDED ACCOUNTS (2)
─────────────────────────────────────────────
These give you more AI provider options and cheaper alternatives.
Skip any you're not interested in — the system works without them.

[ ] Anthropic → console.anthropic.com
    → Add billing (Settings → Billing)
    → Create an API key
    (Claude AI — best for processing long training documents)

[ ] DeepSeek → platform.deepseek.com
    → Add billing
    → Create an API key
    (cheapest AI option — good for high-volume generation)

─────────────────────────────────────────────
OPTIONAL ACCOUNTS (2)
─────────────────────────────────────────────
Budget image generation alternatives. Only needed if you want
cheaper image options beyond what OpenAI provides.

[ ] Stability AI → platform.stability.ai
    → Add billing, create API key
    (cheapest image generation — ~$0.01/image)

[ ] Replicate → replicate.com
    → Add billing, copy API token
    (Flux image model — high quality, moderate cost)

─────────────────────────────────────────────
ASSETS TO PREPARE
─────────────────────────────────────────────
[ ] Landing page mockup / design reference
[ ] Hero carousel images (minimum 3, high resolution)
[ ] Logo files (SVG preferred, PNG acceptable)
[ ] Brand colors (hex codes if available)
[ ] Landing page copy (headline, subheadline, about text, etc.)
[ ] Sample training document for slide builder testing
[ ] Preferred admin email address
[ ] Domain name (if applicable) and registrar login info

─────────────────────────────────────────────
CREDENTIALS
─────────────────────────────────────────────
We'll set up credential sharing during the call using a secure
one-time-secret method. Please use a temporary password for each
service that you're comfortable sharing during development.
You will change all passwords at project handoff.

Don't worry about getting API keys before the call — we can
walk through that together if needed.
```

### 9.2 During Kickoff Call (~45–60 Minutes)

#### Block 1: Account Setup & Credential Exchange (20 min)
- [ ] Walk through each account — confirm creation and billing
- [ ] Client creates a Supabase project (choose region closest to users)
- [ ] Client connects Vercel to GitHub
- [ ] Set up credential sharing (one-time secret links or screen share)
- [ ] Client shares temporary credentials or adds provider as collaborator
- [ ] Collect API keys for all configured services:
  - [ ] Supabase (URL + anon key + service role key)
  - [ ] Resend API key
  - [ ] OpenAI API key
  - [ ] Google Cloud API key (YouTube + Gemini)
  - [ ] Anthropic API key (if created)
  - [ ] DeepSeek API key (if created)
  - [ ] Stability AI API key (if created)
  - [ ] Replicate API token (if created)
- [ ] Verify provider can access: GitHub, Vercel, Supabase, Resend

#### Block 2: DNS & Email Setup (10 min)
- [ ] Confirm domain ownership and registrar access
- [ ] Plan DNS changes (CNAME to Vercel, or provider handles via registrar access)
- [ ] Discuss Resend domain verification (SPF/DKIM DNS records)
- [ ] Confirm admin + notification email addresses

#### Block 3: Design & Content Review (15 min)
- [ ] Review landing page mockup together
- [ ] Confirm hero carousel content and imagery
- [ ] Discuss brand colors, typography, overall visual direction
- [ ] Review sample training document structure
- [ ] Confirm slide builder input format expectations
- [ ] Discuss theme preferences for default theme library

#### Block 4: Process & Expectations (10 min)
- [ ] Confirm communication channel (email, Slack, text, etc.)
- [ ] Confirm feedback round process (consolidated written feedback, 5 business day window)
- [ ] Set expectations for review turnaround
- [ ] Confirm timeline and any hard deadlines
- [ ] Answer client questions

### 9.3 Post-Call (Provider Action Items)

- [ ] Create GitHub repository, invite client as collaborator
- [ ] Initialize project with tech stack
- [ ] Configure Vercel project with ALL environment variables (infrastructure + AI providers)
- [ ] Run initial database migration on Supabase
- [ ] Verify Resend domain and send test email
- [ ] Generate `CRON_SECRET` and add to Vercel env vars
- [ ] Test each AI provider key with a simple API call (log which ones work)
- [ ] Confirm all services are connected and functional
- [ ] Send client a confirmation email summarizing:
  - [ ] Setup status for each service
  - [ ] Which AI providers are active vs. not configured
  - [ ] Next steps and expected timeline

---

## 10. Terms & Conditions

### Payment

Due in full upon agreement, prior to project commencement.

### Scope

Additional features, functionality, or design changes beyond the scope defined in this document will be quoted separately. Each subsystem includes 1 setup round and 2 feedback rounds. Each feedback round consists of one consolidated set of written change requests, delivered within 5 business days of the previous deliverable. Feedback items must fall within the original scope.

### Ownership & Intellectual Property

Upon final delivery, the customer receives a **perpetual, irrevocable license** to use, modify, host, and deploy the delivered codebase without restriction. MiracleMind retains intellectual property rights to underlying frameworks, architectural patterns, and reusable tools, which may be utilized in other projects. This does not affect the customer's right to use, modify, or extend their delivered codebase in any way.

### Warranty

Provider will fix bugs or defects in the delivered code for **30 days** following delivery at no additional cost. This warranty covers defects in the code as delivered and does not cover:
- Issues arising from customer modifications to the codebase
- Third-party service changes (API deprecations, pricing changes, outages)
- Hosting environment changes not made by the provider
- New feature requests or enhancements

### Ongoing Costs

The product will be delivered as an independent package for customer ownership and maintenance. Ongoing operational costs — including hosting, AI/LLM APIs, image generation services, email delivery, and other third-party integrations — are the sole responsibility of the customer.

**Estimated monthly operating costs:**
- Hosting and database: Available via free tiers (Vercel Hobby + Supabase Free) for low-traffic use; paid tiers recommended for commercial or high-volume use (~$45/mo)
- AI services: ~$5–75/month depending on selected providers and slide generation volume. The system supports multiple AI providers at different price points — the customer controls costs by choosing which providers to use.
- Email: Free for up to 3,000 emails/month
- Actual costs will vary based on providers selected and usage patterns. Cost-per-deck estimates are displayed in-app before each generation.

> *Note: Vercel's free tier (Hobby) is designated for personal, non-commercial use per Vercel's Terms of Service. Customer assumes responsibility for selecting a hosting plan appropriate for their use case.*

### Maintenance (Post-Warranty)

Ongoing maintenance, updates, and support beyond the 30-day warranty period are available under a separate maintenance agreement at the customer's discretion.

### Confidentiality

Both parties agree to keep shared credentials, business information, and project details confidential. Provider will access customer accounts only for the purpose of project development and will relinquish all access upon project handoff.

### Credential Exchange Protocol

All API keys, passwords, and sensitive credentials shared during development must be transmitted using **one-time secret links** (e.g., onetimesecret.com or equivalent service). One-time secret links generate a unique URL that self-destructs after a single view, ensuring credentials are never persisted in email threads, chat logs, or shared documents.

**Requirements:**
- Credentials must **never** be sent via email, SMS, Slack, Discord, or any messaging platform that retains server-side history
- Each credential must be shared as its own individual one-time link
- Links should be protected with an additional passphrase when supported by the service
- Where possible, credentials should be entered directly into Vercel environment variables via live screen share during the kickoff call, eliminating the need for the provider to handle raw keys
- All temporary passwords used during development must be rotated by the customer at project handoff (see Section 8.3)

---
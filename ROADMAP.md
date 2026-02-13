# Roadmap — CHW360 Slide Builder

## Phase 1a: Foundation (Complete)
- [x] Project scaffold (Next.js, tRPC, Drizzle, Supabase)
- [x] Auth (Supabase OAuth + email/password)
- [x] Database schema (profiles, contact_submissions, page_views, crm_contacts)
- [x] Landing page with hero carousel and contact form
- [x] Admin dashboard with sidebar navigation
- [x] Admin pages (overview, submissions, CRM, analytics, assets, settings)
- [x] Brand-consistent auth pages (teal/coral)
- [x] shadcn/ui component library
- [x] Email notifications via Resend
- [x] Analytics tracking (page views, form funnel)

## Phase 1b: Auth & Polish (Complete)
- [x] Role-based access (admin role column + adminProcedure)
- [x] Admin layout role gate
- [x] Invite/claim auth flow (magic link OTP)
- [x] Forgot password / reset password pages
- [x] Admin user management UI (invite, roles, claim emails)
- [x] Branded email templates (contact + claim)
- [x] CRM contacts system with TipTap email composer
- [x] Source-filterable submissions and analytics

---

## Phase 2a: Core Generation Pipeline (Complete)
- [x] Database: `chw360_decks` table (slides as JSONB, status tracking, generation log)
- [x] Database: `chw360_provider_preferences` table (per-user LLM/image defaults)
- [x] AI provider layer: OpenAI GPT-4o + Anthropic Claude Sonnet
- [x] Provider config with availability detection (configured/unconfigured status)
- [x] Content parsers: Markdown, plaintext, PDF (pdf-parse), DOCX (mammoth)
- [x] Deck tRPC router: list, getById, create, generate, update, updateSlide, delete, parseFile, providers, getPreferences, setPreferences
- [x] Deck list page with empty state and delete
- [x] New deck wizard: title, description, content input (paste + file upload), provider selector, slide count slider (max 120)
- [x] Deck viewer: slide list sidebar + slide detail panel
- [x] Generation status UI (loading spinner, error display)
- [x] Env vars: OPENAI_API_KEY, ANTHROPIC_API_KEY

---

## Phase 2a.1: Source Fidelity & Prompt Intelligence (Complete)

### Smart Fidelity Detection
- [x] **Pre-generation content analysis**: Heuristic analysis of content structure (slide markers, heading density, bullet density)
- [x] **Auto-detect fidelity level**: Scoring system → verbatim (50+ pts), balanced (20-49), creative (<20) with confidence metric
- [x] **Display detected fidelity**: Shown in UI before generation

### User Fidelity Control
- [x] **Fidelity slider in New Deck form**: Three-position control (Verbatim / Balanced / Creative)
- [x] **Slider adjusts the system prompt**: Each level injects different LLM instructions
- [x] **Auto-set from detection**: Defaults to detected level, user can override
- [x] **Persist preference**: Saved in `provider_preferences`

### Prompt Improvements
- [x] **Stronger source preservation instructions**: Prompt prioritizes source language
- [x] **Slide-by-slide mapping**: 1:1 mapping for structured content
- [x] **Content completeness check**: LLM instructed to include ALL source content
- [x] **Speaker notes sourcing**: Notes expand on content, not repeat it

### Markdown Rendering
- [x] **Render markdown in slide viewer**: Block renderer + slide renderer handle all formatting
- [x] **Render markdown in slide preview cards**: Preview cards render formatted content

---

## Phase 2b: Theme System + Visual Components + Presentation Mode (Complete)

### Theme System
- [x] **Theme data model**: `SlideTheme` interface with colors, typography, and metadata (`src/lib/themes/types.ts`)
- [x] **Built-in themes** (4 themes in `src/lib/themes/`):
  - CHW Teal — Brand theme: teal/coral/cream, Libre Baskerville (default)
  - Modern Dark — Dark slate, white text, blue accent, Inter
  - Clean Light — White background, minimal borders, teal accents
  - Vibrant Health — Dark green, emerald accents, Inter
- [x] **Theme selector component**: Visual picker with mini 16:9 thumbnails (`src/components/slides/theme-selector.tsx`)
- [x] **Theme-aware slide renderer**: `SlideRenderer` applies theme colors/fonts per slide type and layout
- [x] **Theme switching on existing decks**: Theme button in deck viewer header, no regeneration needed

### Pre-Built Visual Components (AI Toolkit)
- [x] **Block type system**: `:::block-type` markup syntax parsed from slide body content
- [x] **Block renderer**: `src/components/slides/blocks/block-renderer.tsx` (385 lines)
- [x] **10 blocks implemented**: info-box, key-stat, numbered-steps, flow-diagram, comparison-table, icon-grid, quote-block, checklist, timeline, highlight-box
- [x] **Prompt integration**: Block syntax documented in AI system prompt (balanced/creative modes)
- [x] **Theme-aware blocks**: All blocks inherit theme colors

### Slide Renderer
- [x] **16:9 aspect ratio rendering**: Proper presentation aspect ratio with scale parameter
- [x] **Layout engine**: full, centered, split-left, split-right, two-column
- [x] **Type-specific rendering**: Title/section slides get accent bars, activity slides get badges, quotes get decorative marks
- [x] **Image placement**: Images rendered according to layout type

### Presentation Mode (`/admin/slides/[deckId]/present`)
- [x] **Fullscreen route**: Dedicated page with z-50 overlay, no admin sidebar
- [x] **Fullscreen API**: Browser fullscreen on entry, black background
- [x] **Keyboard navigation**: Right Arrow / Space / Click = next, Left Arrow = prev, Escape = exit
- [x] **Progress bar**: Theme-colored bar at bottom
- [x] **Speaker notes panel**: Toggle with N key
- [x] **Navigation hints**: Auto-fade after 3 seconds, slide counter bottom-right

---

## Phase 2c: Image Generation + LLM Chat Editing

### AI Image Generation
- [ ] **DALL-E 3 integration**: Generate images from the `imagePrompt` field on slides via OpenAI API
- [ ] **gpt-image-1 support**: Alternative OpenAI image model option
- [ ] **Supabase Storage bucket**: `slide-images` bucket for generated images (public read, auth write)
- [ ] **Storage path convention**: `{profileId}/{deckId}/{slideId}.png`
- [ ] **"Generate Images" button**: After deck creation, batch-generate images for all slides that have `imagePrompt`
- [ ] **Per-slide image controls**: Regenerate image, edit the prompt, or remove image
- [ ] **Image generation status**: Per-slide loading indicators during batch generation
- [ ] **Cost awareness**: Show estimated cost before generating (DALL-E 3 ~$0.04/image)

### LLM Chat Editing (Feedback Loop)
- [ ] **Feedback panel**: Click any slide to open a chat-style feedback panel
- [ ] **Natural language editing**: Type feedback like "make the bullets more concise" or "add a CHW activity here" and the LLM regenerates just that slide
- [ ] **Context-aware regeneration**: Send the current slide + previous/next slides + user feedback to the LLM for coherent output
- [ ] **Preserve or override**: User can choose to accept or reject the regenerated version
- [ ] **Edit history**: Track changes per slide so the user can undo

### YouTube Recommendations (Placeholder)
- [ ] **"Coming Soon" panel**: Video recommendations panel in the deck viewer
- [ ] **`videoRecs` JSONB column**: Already exists in schema, ready for future YouTube API integration
- [ ] **Future**: When YouTube API is configured, auto-suggest relevant training videos per slide topic

---

## Phase 2d: Export + Sharing + Polish

### Export
- [ ] **PPTX export** (pptxgenjs): Full deck with slides, speaker notes, theme colors, and images
- [ ] **PDF export** (jspdf): One slide per page, themed rendering
- [ ] **Export dialog**: Modal with format selection (PDF, PPTX, Web Link)
- [ ] **Theme-accurate export**: Exported files should match the on-screen themed rendering

### Sharing
- [ ] **Public share links**: Toggle a deck to public, generate a unique slug
- [ ] **Public view route**: `/slides/[slug]` — no auth required, read-only deck viewer
- [ ] **Copy-to-clipboard**: One-click copy of the share URL
- [ ] **Schema additions**: `is_public` boolean + `share_slug` text on decks table

### Settings Integration
- [ ] **AI Providers section** on `/admin/settings`: Configure default LLM and image provider
- [ ] **Fidelity default**: Set default fidelity level in settings
- [ ] **New deck inherits preferences**: New deck form pre-fills from saved settings

### Generation Cost Tracking
- [ ] **Cost summary component**: Show tokens used, estimated cost from `generationLog`
- [ ] **Per-deck cost**: Display on deck viewer page
- [ ] **Cumulative usage**: Optional usage tracking across all decks

---

## Phase 3: Advanced Features (Future)

### Template Library
- [ ] Pre-built deck templates for common CHW training topics
- [ ] "Start from template" option in new deck wizard
- [ ] Community-shared templates

### Collaboration
- [ ] Share decks with other users (viewer/editor roles)
- [ ] Collaborative editing (real-time or async)
- [ ] Comment/annotation system on individual slides

### Version History
- [ ] Track edit history per deck
- [ ] Diff view between versions
- [ ] Restore previous versions

### Advanced AI Features
- [ ] Multi-model comparison: Generate with two providers side-by-side
- [ ] Auto-improve: AI reviews its own output and suggests enhancements
- [ ] Content gap analysis: AI identifies missing topics from the source material
- [ ] Audience adaptation: Adjust reading level and terminology for different audiences

---

## Implementation Priority

```
Done     ✓ Phase 2a.1: Source Fidelity & Prompt Intelligence
Done     ✓ Phase 2b: Themes + Visual Components + Presentation
Current  → Phase 2c: Images + Chat Editing
           (DALL-E, feedback loop, per-slide editing)
Next     → Phase 2d: Export + Sharing
           (PPTX, PDF, public links, settings)
Future   → Phase 3: Templates, Collaboration, Version History
```

Each phase is independently deployable. Phase 2c is the next priority — adding AI image generation and per-slide chat editing to the existing themed slide system.

---
*Last updated: 2026-02-13*

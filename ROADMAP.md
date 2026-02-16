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

## Phase 2c: Image Generation + LLM Chat Editing (Complete)

### AI Image Generation
- [x] **DALL-E 3 integration**: Generate images from `imagePrompt` field via OpenAI API
- [x] **gpt-image-1 support**: Alternative OpenAI image model option
- [x] **Supabase Storage bucket**: `slide-images` bucket for generated images
- [x] **"Generate Images" button**: Batch-generate images for slides with `imagePrompt`
- [x] **Per-slide image controls**: Regenerate image, edit prompt, or remove image
- [x] **Image generation status**: Per-slide loading indicators during batch generation

### LLM Chat Editing (Feedback Loop)
- [x] **Feedback panel**: Chat-style slide edit panel with natural language editing
- [x] **Context-aware regeneration**: Current slide + neighbors + user feedback
- [x] **Slide-level regeneration**: `regenerateSlide` mutation with context

---

## Phase 2d: CRUD, Themes, Images, UX (Current)

### Sprint 1: Slide CRUD + Editing UX (Complete)
- [x] **deleteSlide mutation**: Remove slide by ID, re-number remaining orders
- [x] **duplicateSlide mutation**: Copy slide after original, bump subsequent orders
- [x] **reorderSlides mutation**: Accept ordered ID array, update all order values
- [x] **Drag-to-reorder**: @dnd-kit integration for slide list
- [x] **Slide action buttons**: Duplicate (copy icon), Delete (trash + confirm) per card
- [x] **Add Slide button**: At bottom of slide list
- [x] **Edit panel polish**: Teal header, suggestion chips, wider on large screens
- [x] **Presentation discovery UX**: Hint text on Present button, keyboard overlay

### Sprint 2: Theme Overhaul + Typography (Complete)
- [x] **Gradient theme support**: Add `gradient` field to SlideTheme type
- [x] **Theme redesigns**: CHW Teal (glassmorphism), Modern Dark (glow), Clean Light (refined), Vibrant Health (organic)
- [x] **New themes**: Sunset Warmth, Ocean Professional
- [x] **Typography upgrade**: Larger titles, better spacing, decorative dividers
- [x] **Renderer visual upgrades**: Gradient backgrounds, wider accent bars, surface cards, shimmer placeholders

### Sprint 3: Smart Images + Prompt Engineering (Complete)
- [x] **Image/layout alignment**: imagePrompt only on image-eligible layouts, post-gen cleanup
- [x] **New layouts**: image-full (bleed bg + overlay), image-top (top 40% image)
- [x] **Image prompt engineering**: Style/negative guidance in system prompt
- [x] **Auto image generation flow**: Post-generation dialog for batch image gen

### Sprint 4: Settings UX + Power User Controls (Complete)
- [x] **Unified settings panel**: Single gear-icon drawer (theme, generation, images, advanced)
- [x] **Custom instructions textarea**: Appended to system prompt
- [x] **Tone selector**: Professional / Conversational / Academic / Training-focused
- [x] **Inline regeneration settings**: Show all settings when regenerating

---

## Phase 2e: Export + Sharing (Future)

### Export
- [ ] **PPTX export** (pptxgenjs): Full deck with slides, speaker notes, theme colors, and images
- [ ] **PDF export** (jspdf): One slide per page, themed rendering
- [ ] **Export dialog**: Modal with format selection (PDF, PPTX, Web Link)

### Sharing
- [ ] **Public share links**: Toggle a deck to public, generate a unique slug
- [ ] **Public view route**: `/slides/[slug]` — no auth required, read-only deck viewer

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
Done     ✓ Phase 2c: Images + Chat Editing
Done     ✓ Phase 2d Sprints 1-4: CRUD, Themes, Smart Images, Settings UX
Done     ✓ Phase 2d.5: Theme variants, tech debt, responsive polish
Done     ✓ Renderer Quality Sweep: 9 fixes + iterative polish
Next     → Phase 2e: Export + Sharing
Future   → Phase 3: Templates, Collaboration, Version History
```

---
*Last updated: 2026-02-16*

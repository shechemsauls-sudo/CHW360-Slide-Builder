# TODO — CHW360 Slide Builder

> Full plan with implementation details: `docs/slide-builder-plan.md`

## Sprint 1: Foundation Fixes (do first)
- [ ] 1.1 Fix bold markdown in 13 visual blocks that use plain text instead of MarkdownRenderer
- [ ] 1.2 Fix title slide consistency — image-full hardcodes white/shadow instead of theme
- [ ] 1.3 Fix content overflow — lower min shrink to 0.45, add delayed re-measure, safety overflow-hidden
- [ ] 1.4 Create `src/lib/ai/image/style-prompt.ts` — centralize client image style directive

## Sprint 2: Image Quality (depends on 1.4)
- [ ] 2.1 Inject style directive into `buildGeneratePrompt()` image guidelines
- [ ] 2.2 Inject style directive into `generateImagePrompt()` per-slide mutation
- [ ] 2.3 Wrap all image generation calls with `enhanceImagePrompt()` prefix
- [ ] 2.4 Verify image provider quality/brightness settings

## Sprint 3: Citation Integration (depends on 1.1)
- [ ] 3.1 Integrate citation prompt into `buildGeneratePrompt()` — APA 7th, 2020–2025
- [ ] 3.2 Post-process: tag References slides with `type: "references"`
- [ ] 3.3 Exclude References from slide count display (20 content + N references)
- [ ] 3.4 Render References slides with compact layout and small font

## Sprint 4: Provider & Settings Cleanup (parallel with 2-3)
- [ ] 4.1 Remove Gemini/DeepSeek/Stability/Replicate from provider config (not implemented)
- [ ] 4.2 Filter creation wizard to only show configured providers (like editing does)
- [ ] 4.3 Add provider preferences section to Settings page (API exists, no UI)
- [ ] 4.4 Align editing: allow changing LLM/image provider during regenerate
- [ ] 4.5 Wire xAI/Grok as LLM provider (API key available)
- [ ] 4.6 Future: wire Stability/Replicate/Leonardo image providers

## Sprint 5: Deck List Overhaul (independent)
- [ ] 5.1 Schema: add `deck_groups` table + `groupId` FK on decks
- [ ] 5.2 Router: group CRUD + assignDecksToGroup + applyGroupTheme
- [ ] 5.3 Rebuild deck list — sleek rows, sorting, filtering, search, pagination
- [ ] 5.4 Group management UI — create/rename/delete groups, group theme editing

## Sprint 6: YouTube & Advanced (after 1-4 solid)
- [ ] 6.1 YouTube video recommendations (API key available, DB field exists)
- [ ] 6.2 Bulk upload — multiple files → multiple decks with shared settings
- [ ] 6.3 Auto-review/coherence check for generated decks

## Presenter Mode Polish (minor, non-blocking)
- [ ] Fix ESC closing presentation instead of help overlay when overlay is showing
- [ ] Add aria-modal="true" to help overlay dialog

## Backlog (future phases)
- [ ] PPTX/PDF export (Phase 2e)
- [ ] Public share links (Phase 2e)
- [ ] Client-facing turnkey LMS-style interface (future phase)
- [ ] Image drag/reposition feature for cropped faces

## Tech Debt
- [ ] Clean up broken Vercel Supabase integration vars (POSTGRES_URL etc.)
- [ ] Set Turnstile keys in Vercel to activate spam protection (code is wired)

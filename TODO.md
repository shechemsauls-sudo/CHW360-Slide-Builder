# TODO — CHW360 Slide Builder

> Full plan with implementation details: `docs/slide-builder-plan.md`

## Sprint 1: Foundation Fixes — DONE
- [x] 1.1 Fix bold markdown in 8 visual blocks (MarkdownRenderer + inlineFormat)
- [x] 1.2 Fix title slide consistency — image-full now type-aware sizing + decorative dividers
- [x] 1.3 Fix content overflow — min shrink 0.45, dual delayed measurement (300ms + 600ms)
- [x] 1.4 Create `src/lib/ai/image/style-prompt.ts` — centralized style directive + enhanceImagePrompt()

## Sprint 2: Image Quality — DONE
- [x] 2.1 Inject brand style directive into `buildGeneratePrompt()` image guidelines
- [x] 2.2 Inject style directive into `generateImagePrompt()` per-slide mutation
- [x] 2.3 Wrap all image generation calls with `enhanceImagePrompt()` prefix
- [x] 2.4 Verified image provider settings (DALL-E 3 standard quality, gpt-image-1 defaults — good)

## Sprint 3: Citation Integration — DONE
- [x] 3.1 Integrate APA 7th citation prompt into `buildGeneratePrompt()` — in-text + references
- [x] 3.2 Post-process: `tagReferenceSlides()` tags + strips images from reference slides
- [x] 3.3 Exclude References from slide count — DB stores content count, UI shows "X slides + Y ref"
- [x] 3.4 Render References slides compact — text-[11px], leading-snug, p-8, top-aligned, text-xl title

## Sprint 4: Provider & Settings Cleanup — DONE
- [x] 4.1 Remove Gemini/DeepSeek/Stability/Replicate from provider config
- [x] 4.2 Filter creation wizard to only show configured providers
- [x] 4.3 Add Generation Preferences card to Settings page (LLM, image, fidelity, tone, instructions)
- [x] 4.4 Add imageProvider override to regenerate mutation
- [x] 4.5 Wire xAI/Grok as LLM provider (grok-3 + grok-3-mini, OpenAI-compatible API)
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

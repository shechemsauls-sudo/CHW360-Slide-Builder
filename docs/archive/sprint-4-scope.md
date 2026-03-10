# Sprint 4: Settings UX + Power User Controls — Implementation Scope

## Overview

Replace scattered settings buttons/dropdowns with a unified settings experience. Add power user controls (custom instructions, tone) that persist per-user and feed into the LLM prompt.

---

## 4a. Database Migration

**File:** New migration via Supabase MCP or `drizzle-kit`

Add 2 columns to `chw360_provider_preferences`:

```sql
ALTER TABLE chw360_provider_preferences
ADD COLUMN custom_instructions text DEFAULT '',
ADD COLUMN tone text DEFAULT 'professional';
```

**File:** `src/server/db/schema.ts`

```ts
// Add to providerPreferences table:
customInstructions: text("custom_instructions").default(""),
tone: text("tone").default("professional"),
```

**Tone enum values:** `professional`, `conversational`, `academic`, `training`

---

## 4b. Backend — Update preferences mutation

**File:** `src/server/api/routers/deck.ts`

Update `setPreferences` input schema to accept:
```ts
customInstructions: z.string().max(500).optional(),
tone: z.enum(["professional", "conversational", "academic", "training"]).optional(),
```

Update `getPreferences` return to include these fields (already returns the full row, so it should just work after schema change).

---

## 4c. Prompt Integration

**File:** `src/lib/ai/llm/prompts.ts`

### Tone instructions
Add a `TONE_INSTRUCTIONS` record mapping each tone to a prompt paragraph:
- **professional** — Formal, clear, evidence-based language
- **conversational** — Warm, direct, use "you" and "we" freely
- **academic** — Formal citations style, technical terminology
- **training** — Instructor-focused, pedagogical, step-by-step scaffolding

### Custom instructions
Append `customInstructions` text directly after the tone block in `buildGeneratePrompt()`.

### Changes to GenerateInput type
**File:** `src/lib/ai/types.ts`

Add to `GenerateInput`:
```ts
customInstructions?: string;
tone?: string;
```

Pass these through from `deck.generate` and `deck.regenerate` mutations.

---

## 4d. Unified Settings Panel (Deck Viewer)

**File:** `src/app/admin/slides/[deckId]/page.tsx`

### Current state
- Theme picker: toggled via "Theme" button in header → shows `ThemeSelector` in a Card
- Regenerate: toggled via "Regenerate" button → dropdown with fidelity + slide count
- Shortcuts: toggled via "Shortcuts" button → dropdown with keyboard shortcuts
- Images: "Images" button for batch generation

### Target state
Replace Theme/Regenerate/Shortcuts buttons with a single **Settings gear icon** that opens a `Sheet` (side panel) containing:

1. **Theme** section — Current `ThemeSelector` component
2. **Generation** section
   - LLM provider selector (dropdown: OpenAI / Anthropic)
   - Fidelity selector (3 cards: Verbatim / Balanced / Creative)
   - Slide count slider
3. **Images** section
   - Image provider selector (DALL-E 3 / gpt-image-1 / Disabled)
   - Auto-generate toggle (future-ready, just UI for now)
4. **Advanced** section
   - Custom instructions textarea (max 500 chars, with char count)
   - Tone selector (4 radio buttons with descriptions)

### New component
**File:** `src/components/slides/deck-settings-panel.tsx`

```tsx
interface DeckSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}
```

Uses `api.deck.getPreferences` and `api.deck.setPreferences` for persistence.

### Keep separate
- **Present** button stays in header (it's an action, not a setting)
- **Delete** button stays in header
- **Shortcuts** dropdown stays (or move into settings under "Keyboard Shortcuts" section)

---

## 4e. Inline Regeneration Settings

**File:** `src/app/admin/slides/[deckId]/page.tsx`

When "Regenerate Deck" is clicked, instead of a small dropdown, show a **full-width Card** below the header with ALL settings inline:
- Provider selector
- Fidelity cards
- Slide count slider
- Visual blocks toggle (currently on new deck page only)
- Custom instructions textarea
- Tone selector
- "Regenerate with these settings" coral button

This replaces the current `showRegenOptions` dropdown.

### Update regenerate mutation input
**File:** `src/server/api/routers/deck.ts`

Add `customInstructions` and `tone` to `regenerate` input schema, pass through to `provider.generateSlides()`.

---

## 4f. Settings Page Enhancement (Optional)

**File:** `src/app/admin/settings/page.tsx`

Currently just shows Account info. Could add an "AI Defaults" section that mirrors the deck settings panel for setting global defaults. This is optional — the per-deck panel is the primary UX.

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/server/db/schema.ts` | Add `customInstructions`, `tone` columns |
| `src/server/api/routers/deck.ts` | Update preferences + regenerate mutations |
| `src/lib/ai/types.ts` | Add fields to `GenerateInput` |
| `src/lib/ai/llm/prompts.ts` | Add tone instructions, custom instructions block |
| `src/components/slides/deck-settings-panel.tsx` | NEW — Unified settings Sheet |
| `src/app/admin/slides/[deckId]/page.tsx` | Replace scattered buttons with settings panel + inline regen |

## Dependencies
- Database migration (must run before schema push)
- No new npm packages needed (Sheet already available from shadcn/ui)

## Verification
- `npm run build` — zero errors
- Test: create deck, open settings, change tone/custom instructions, regenerate
- Test: preferences persist across sessions
- Test: custom instructions appear in LLM output

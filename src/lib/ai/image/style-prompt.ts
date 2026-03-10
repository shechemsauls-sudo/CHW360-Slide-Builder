/**
 * Centralized image style directive from client (Shechem / CHW360).
 * All images are photorealistic — no abstract styles.
 */

/** Shared constraints applied to all images */
const SHARED_CONSTRAINTS = `Photorealistic professional photography. Warm color temperature. Natural layered lighting with soft shadows for depth and dimension — never flat or overexposed. No text, logos, or watermarks. Single cohesive scene only — never split, collage, diptych, or side-by-side compositions. No religious imagery, symbols, icons, or iconography (no crosses, saints, halos, prayer imagery, religious statues, stained glass, etc.). No clipart, cartoon, or stylized illustration.`;

/** Realistic: photographic community scenes */
export const IMAGE_STYLE_DIRECTIVE = `${SHARED_CONSTRAINTS} Soft warm color palette, Texas-inspired community spaces. Human-centered composition with clear visual storytelling. Calm, supportive, welcoming atmosphere. Settings: schools, clinics, parks, community centers, rec centers, hospitals, homes. Diverse individuals (Hispanic, Black, Asian, Middle Eastern, White — young adults, middle-aged, older adults). Professional framing with foreground/subject/background depth. Contemporary (2020s era).`;

/** Lighting variations rotated across slides for visual variety */
const LIGHTING_VARIATIONS = [
  "Golden morning light with warm angled shadows, inviting atmosphere",
  "Bright natural midday light, crisp details, energetic community scene",
  "Soft window light indoors, warm and intimate professional setting",
  "Gentle overcast diffused light, even and calming outdoor scene",
  "Late afternoon warmth, long shadows, relaxed community gathering",
];

/** Composition variations rotated across slides */
const COMPOSITION_VARIATIONS = [
  "Medium shot, rule-of-thirds framing, breathing room around subject",
  "Wide establishing shot, community context visible, depth in layers",
  "Close-medium shot, subject prominent, soft background bokeh",
  "Dynamic angle with leading lines guiding the eye to focal point",
  "Eye-level intimate framing, connection with subjects, warm tones",
];

export interface EngineStyleConfig {
  providerId: string;
}

export function enhanceImagePrompt(basePrompt: string, slideIndex?: number): string {
  const lighting = slideIndex !== undefined
    ? LIGHTING_VARIATIONS[slideIndex % LIGHTING_VARIATIONS.length]
    : LIGHTING_VARIATIONS[0];
  const composition = slideIndex !== undefined
    ? COMPOSITION_VARIATIONS[slideIndex % COMPOSITION_VARIATIONS.length]
    : COMPOSITION_VARIATIONS[0];

  return `${IMAGE_STYLE_DIRECTIVE}\n\nComposition: ${composition}. Lighting: ${lighting}.\n\n${basePrompt}`;
}

/**
 * Engine strength classification for photorealism.
 * Used to sort engines by realistic quality.
 */
const ENGINE_REALISTIC_STRENGTH: Record<string, number> = {
  replicate:      5,  // FLUX 1.1 Pro — top-tier photorealism
  "gpt-image-1":  4,  // Newer model, excellent prompt following
  leonardo:       4,  // Leonardo Phoenix — strong photorealism + alchemy
  stability:      3,  // SD3 — very capable
  dalle3:         3,  // Solid workhorse
};

/**
 * Multi-engine strategy: rotate across configured engines sorted by
 * photorealism strength. All images are realistic.
 */
export function getMultiEngineConfig(slideIndex: number, configuredIds?: string[]): EngineStyleConfig {
  if (configuredIds && configuredIds.length > 0) {
    return getCustomMixConfig(slideIndex, configuredIds);
  }
  // Default: replicate (best photorealism)
  return { providerId: "replicate" };
}

/**
 * Custom mix: rotate through user-selected engines sorted by realistic quality.
 */
export function getCustomMixConfig(slideIndex: number, engineIds: string[]): EngineStyleConfig {
  if (engineIds.length === 0) return getMultiEngineConfig(slideIndex);
  if (engineIds.length === 1) return { providerId: engineIds[0]! };

  // Sort by realistic strength (descending), then rotate
  const sorted = [...engineIds].sort((a, b) => {
    const sa = ENGINE_REALISTIC_STRENGTH[a] ?? 3;
    const sb = ENGINE_REALISTIC_STRENGTH[b] ?? 3;
    return sb - sa;
  });

  const providerId = sorted[slideIndex % sorted.length]!;
  return { providerId };
}

/**
 * Parse the imageProvider preference string into a structured config.
 * Formats: "multi" | "custom:id1,id2,id3" | "replicate" (single engine)
 */
export function parseImageProviderPref(pref: string): {
  mode: "multi" | "custom" | "single";
  engineIds: string[];
} {
  if (pref === "multi") return { mode: "multi", engineIds: [] };
  if (pref.startsWith("custom:")) {
    const ids = pref.slice(7).split(",").filter(Boolean);
    return { mode: "custom", engineIds: ids };
  }
  return { mode: "single", engineIds: [pref] };
}

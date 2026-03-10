/**
 * Centralized image style directive from client (Shechem / CHW360).
 * All images are photorealistic — no abstract styles.
 */

/** Shared constraints applied to all images */
const SHARED_CONSTRAINTS = `Bright, well-lit, high exposure, airy and luminous. Clean minimal design, smooth edges. Never dark, moody, or dramatic lighting. No text or words in the image. Single cohesive scene only — never split, collage, diptych, or side-by-side compositions. No religious imagery, symbols, icons, or iconography (no crosses, saints, halos, prayer imagery, religious statues, stained glass, etc.).`;

/** Realistic: photographic community scenes */
export const IMAGE_STYLE_DIRECTIVE = `${SHARED_CONSTRAINTS} Warm natural lighting, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, school gym, school cafeteria, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.`;

const REALISTIC_PREFIX = `Photorealistic style, brightly lit. ${IMAGE_STYLE_DIRECTIVE}`;

export interface EngineStyleConfig {
  providerId: string;
}

export function enhanceImagePrompt(basePrompt: string): string {
  return `${REALISTIC_PREFIX} ${basePrompt}`;
}

/**
 * Engine strength classification for photorealism.
 * Used to sort engines by realistic quality.
 */
const ENGINE_REALISTIC_STRENGTH: Record<string, number> = {
  replicate:      5,  // FLUX — top-tier photorealism
  leonardo:       4,  // Leonardo — strong scenes
  "gpt-image-1":  3,  // Good quality
  stability:      3,  // SD3
  dalle3:         3,  // Solid all-around
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

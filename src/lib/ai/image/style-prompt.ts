/**
 * Centralized image style directive from client (Shechem / CHW360).
 * Used by Sprint 2 to inject into LLM prompts and image generation calls.
 */

export const IMAGE_STYLE_DIRECTIVE = `Warm natural lighting, clean minimal design, smooth edges, soft color palette, Texas-inspired places/landmarks/objects, human-centered composition, calm and supportive atmosphere, community-focused scenes (schools, churches, clinics, parks, school gym, school cafeteria, rec centers, hospitals), inclusive everyday environments, clear visual storytelling, friendly contemporary style. Diverse individuals (Hispanic, Black, Asian, young adults, older adults, Middle Eastern) and community groups.`;

export function enhanceImagePrompt(basePrompt: string): string {
  return `${IMAGE_STYLE_DIRECTIVE} ${basePrompt}`;
}

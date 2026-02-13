export type FidelityLevel = "verbatim" | "balanced" | "creative";

interface FidelitySignals {
  slideMarkers: number;
  headingDensity: number;
  bulletDensity: number;
  numberedSections: number;
  totalLines: number;
}

/**
 * Detect how structured the source content is and recommend a fidelity level.
 *
 * - "verbatim"  — Explicit slide markers, numbered slides, strong structure
 * - "balanced"  — Some headings/bullets but not slide-by-slide
 * - "creative"  — Prose, notes, unstructured text
 */
export function detectFidelity(content: string): {
  level: FidelityLevel;
  confidence: number;
  signals: FidelitySignals;
} {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const totalLines = lines.length;

  if (totalLines === 0) {
    return {
      level: "creative",
      confidence: 1,
      signals: { slideMarkers: 0, headingDensity: 0, bulletDensity: 0, numberedSections: 0, totalLines: 0 },
    };
  }

  // Slide markers: "Slide 1:", "Slide 2:", "--- Slide 3 ---", etc.
  const slideMarkerPattern = /^(?:slide\s*\d+|---+\s*slide\s*\d+|#{1,3}\s*slide\s*\d+)/i;
  const slideMarkers = lines.filter((l) => slideMarkerPattern.test(l.trim())).length;

  // Numbered section markers: "1.", "2.", "1)", "Section 1:", etc.
  const numberedSectionPattern = /^(?:\d+[.)]\s|section\s+\d+|part\s+\d+)/i;
  const numberedSections = lines.filter((l) => numberedSectionPattern.test(l.trim())).length;

  // Heading density (markdown headings or all-caps lines)
  const headingPattern = /^#{1,6}\s|^[A-Z][A-Z\s]{4,}$/;
  const headings = lines.filter((l) => headingPattern.test(l.trim())).length;
  const headingDensity = headings / totalLines;

  // Bullet density (-, *, or numbered lists)
  const bulletPattern = /^[-*]\s|^\d+[.)]\s/;
  const bullets = lines.filter((l) => bulletPattern.test(l.trim())).length;
  const bulletDensity = bullets / totalLines;

  const signals: FidelitySignals = {
    slideMarkers,
    headingDensity,
    bulletDensity,
    numberedSections,
    totalLines,
  };

  // Scoring: slide markers are the strongest signal
  let score = 0;

  // Slide markers: strongest indicator of verbatim content
  if (slideMarkers >= 3) score += 50;
  else if (slideMarkers >= 1) score += 25;

  // Numbered sections: strong structure signal
  if (numberedSections >= 5) score += 25;
  else if (numberedSections >= 3) score += 15;

  // Heading density: moderate structure signal
  if (headingDensity > 0.1) score += 15;
  else if (headingDensity > 0.05) score += 8;

  // Bullet density: some structure signal
  if (bulletDensity > 0.3) score += 10;
  else if (bulletDensity > 0.15) score += 5;

  // Determine level from score
  let level: FidelityLevel;
  let confidence: number;

  if (score >= 50) {
    level = "verbatim";
    confidence = Math.min(score / 100, 1);
  } else if (score >= 20) {
    level = "balanced";
    confidence = score / 50;
  } else {
    level = "creative";
    confidence = 1 - score / 20;
  }

  return { level, confidence: Math.round(confidence * 100) / 100, signals };
}

import type { SlideTheme } from "./types";

export const oceanProfessional: SlideTheme = {
  id: "ocean-professional",
  name: "Ocean Professional",
  description: "Navy to deep blue gradient, cyan accents, corporate polish",
  colors: {
    primary: "#06b6d4",
    secondary: "#22d3ee",
    background: "#0c1929",
    surface: "rgba(255,255,255,0.06)",
    text: "#f0f9ff",
    textMuted: "rgba(240,249,255,0.6)",
    accent: "#06b6d4",
  },
  gradient: {
    background: "linear-gradient(155deg, #0f2847 0%, #0c1929 60%, #0e1f3d 100%)",
    accent: "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)",
  },
  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

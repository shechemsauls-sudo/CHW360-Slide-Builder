import type { SlideTheme } from "./types";

export const chwTeal: SlideTheme = {
  id: "chw-teal",
  name: "CHW Teal",
  description: "Brand theme — deep teal gradient, coral accents, glassmorphism",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#1E4545",
    surface: "rgba(255,255,255,0.08)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.75)",
    accent: "#C9725B",
  },
  gradient: {
    background: "linear-gradient(135deg, #2D5A5A 0%, #1A3D3D 100%)",
    accent: "linear-gradient(90deg, #C9725B 0%, #D4896E 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

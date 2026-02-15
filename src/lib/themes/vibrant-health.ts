import type { SlideTheme } from "./types";

export const vibrantHealth: SlideTheme = {
  id: "vibrant-health",
  name: "Vibrant Health",
  description: "Deep emerald to forest gradient, bright green accent, organic warmth",
  colors: {
    primary: "#10b981",
    secondary: "#34d399",
    background: "#052e21",
    surface: "rgba(255,255,255,0.07)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.7)",
    accent: "#10b981",
  },
  gradient: {
    background: "linear-gradient(145deg, #064e3b 0%, #052e21 60%, #0a3d2e 100%)",
    accent: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

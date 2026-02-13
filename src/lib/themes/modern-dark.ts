import type { SlideTheme } from "./types";

export const modernDark: SlideTheme = {
  id: "modern-dark",
  name: "Modern Dark",
  description: "Sleek dark slate with blue accents",
  colors: {
    primary: "#3b82f6",
    secondary: "#60a5fa",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f8fafc",
    textMuted: "rgba(248,250,252,0.7)",
    accent: "#3b82f6",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

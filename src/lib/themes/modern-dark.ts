import type { SlideTheme } from "./types";

export const modernDark: SlideTheme = {
  id: "modern-dark",
  name: "Modern Dark",
  description: "Near-black to deep blue gradient, electric blue glow, frosted glass",
  colors: {
    primary: "#3b82f6",
    secondary: "#60a5fa",
    background: "#0a0f1e",
    surface: "rgba(255,255,255,0.06)",
    text: "#f8fafc",
    textMuted: "rgba(248,250,252,0.65)",
    accent: "#3b82f6",
  },
  palette: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"],
  gradient: {
    background: "linear-gradient(160deg, #0f172a 0%, #0a1628 50%, #111d3a 100%)",
    accent: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
  },
  typography: {
    headingFont: "Inter, system-ui, sans-serif",
    bodyFont: "Inter, system-ui, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

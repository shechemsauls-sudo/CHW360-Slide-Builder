import type { SlideTheme } from "./types";

export const sunsetWarmth: SlideTheme = {
  id: "sunset-warmth",
  name: "Sunset Warmth",
  description: "Charcoal to deep orange gradient, gold and amber accents",
  colors: {
    primary: "#f59e0b",
    secondary: "#fbbf24",
    background: "#1c1412",
    surface: "rgba(255,255,255,0.06)",
    text: "#FFF8F0",
    textMuted: "rgba(255,248,240,0.65)",
    accent: "#f59e0b",
  },
  palette: ["#f59e0b", "#ef4444", "#d97706", "#84cc16"],
  gradient: {
    background: "linear-gradient(150deg, #292018 0%, #1c1412 50%, #2a1a10 100%)",
    accent: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
  },
  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

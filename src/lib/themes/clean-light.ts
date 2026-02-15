import type { SlideTheme } from "./types";

export const cleanLight: SlideTheme = {
  id: "clean-light",
  name: "Clean Light",
  description: "White to warm gray, crisp card shadows, refined borders",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#FAFAF9",
    surface: "#FFFFFF",
    text: "#1a1a2e",
    textMuted: "rgba(26,26,46,0.55)",
    accent: "#2D5A5A",
  },
  gradient: {
    background: "linear-gradient(180deg, #FFFFFF 0%, #F5F3F0 100%)",
    accent: "linear-gradient(90deg, #2D5A5A 0%, #3D7A7A 100%)",
  },
  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

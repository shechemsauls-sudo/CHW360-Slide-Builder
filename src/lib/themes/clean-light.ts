import type { SlideTheme } from "./types";

export const cleanLight: SlideTheme = {
  id: "clean-light",
  name: "Clean Light",
  description: "Minimal white background with clean typography",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#FFFFFF",
    surface: "#f8fafc",
    text: "#1e293b",
    textMuted: "rgba(30,41,59,0.6)",
    accent: "#2D5A5A",
  },
  typography: {
    headingFont: "system-ui, -apple-system, sans-serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

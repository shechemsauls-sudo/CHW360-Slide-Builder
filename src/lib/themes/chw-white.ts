import type { SlideTheme } from "./types";

export const chwWhite: SlideTheme = {
  id: "chw-white",
  name: "CHW White",
  description: "Clean white — minimal, teal accent bars, boardroom-safe",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#1a1a2e",
    textMuted: "#6B7280",
    accent: "#2D5A5A",
  },
  palette: ["#2D5A5A", "#C9725B", "#B89B6A", "#6E7F5E", "#8C6E5D"],
  gradient: {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)",
    accent: "linear-gradient(90deg, #2D5A5A 0%, #3D6F6F 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

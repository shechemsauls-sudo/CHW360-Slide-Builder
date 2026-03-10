import type { SlideTheme } from "./types";

export const chwSlate: SlideTheme = {
  id: "chw-slate",
  name: "CHW Slate",
  description: "Neutral professional — slate charcoal, light teal accent only",
  colors: {
    primary: "#5B8A8A",
    secondary: "#7BA3A3",
    background: "#2D3239",
    surface: "rgba(255,255,255,0.06)",
    text: "#F1F5F9",
    textMuted: "rgba(241,245,249,0.60)",
    accent: "#5B8A8A",
  },
  palette: ["#5B8A8A", "#A68A7B", "#B8A878", "#7D8D6D", "#9A7E6A"],
  gradient: {
    background: "linear-gradient(135deg, #2D3239 0%, #1C1E22 100%)",
    accent: "linear-gradient(90deg, #5B8A8A 0%, #7BA3A3 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

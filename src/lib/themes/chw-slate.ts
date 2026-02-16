import type { SlideTheme } from "./types";

export const chwSlate: SlideTheme = {
  id: "chw-slate",
  name: "CHW Slate",
  description: "Neutral professional — slate charcoal, light teal accent only",
  colors: {
    primary: "#5B8A8A",
    secondary: "#7BA3A3",
    background: "#1E293B",
    surface: "rgba(255,255,255,0.06)",
    text: "#F1F5F9",
    textMuted: "rgba(241,245,249,0.60)",
    accent: "#5B8A8A",
  },
  palette: ["#5B8A8A", "#A68A7B", "#B8A472", "#7D8D6D"],
  gradient: {
    background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    accent: "linear-gradient(90deg, #5B8A8A 0%, #7BA3A3 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

import type { SlideTheme } from "./types";

export const chwCream: SlideTheme = {
  id: "chw-cream",
  name: "CHW Cream",
  description: "Warm light — brand cream palette, teal headings, coral accents",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#FAF7F4",
    surface: "#FFFFFF",
    text: "#2D5A5A",
    textMuted: "#4A5568",
    accent: "#C9725B",
  },
  palette: ["#2D5A5A", "#C9725B", "#B89B6A", "#6E7F5E", "#8C6E5D"],
  gradient: {
    background: "linear-gradient(135deg, #FAF7F4 0%, #F5EDE6 100%)",
    accent: "linear-gradient(90deg, #C9725B 0%, #D4896E 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

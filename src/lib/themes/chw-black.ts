import type { SlideTheme } from "./types";

export const chwBlack: SlideTheme = {
  id: "chw-black",
  name: "CHW Black",
  description: "Bold dark — high-contrast, coral pops against black",
  colors: {
    primary: "#2D5A5A",
    secondary: "#5B8A8A",
    background: "#000000",
    surface: "rgba(45,90,90,0.12)",
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.70)",
    accent: "#C9725B",
  },
  palette: ["#5B8A8A", "#C9725B", "#D4A84C", "#8A9D7D"],
  gradient: {
    background: "linear-gradient(135deg, #000000 0%, #0A1515 100%)",
    accent: "linear-gradient(90deg, #C9725B 0%, #D4896E 100%)",
  },
  typography: {
    headingFont: "Libre Baskerville, serif",
    bodyFont: "system-ui, -apple-system, sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
};

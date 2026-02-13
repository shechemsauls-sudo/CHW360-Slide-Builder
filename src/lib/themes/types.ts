export interface SlideTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
    bodyWeight: number;
  };
}

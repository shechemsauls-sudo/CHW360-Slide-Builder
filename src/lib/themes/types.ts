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
  gradient?: {
    /** CSS gradient for the slide background */
    background: string;
    /** CSS gradient for accent bars/elements */
    accent: string;
  };
  palette?: string[];
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
    bodyWeight: number;
  };
}

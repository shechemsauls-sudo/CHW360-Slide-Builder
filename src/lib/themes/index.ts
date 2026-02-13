import type { SlideTheme } from "./types";
import { chwTeal } from "./chw-teal";
import { modernDark } from "./modern-dark";
import { cleanLight } from "./clean-light";
import { vibrantHealth } from "./vibrant-health";

export type { SlideTheme } from "./types";

const themes: Record<string, SlideTheme> = {
  "chw-teal": chwTeal,
  "modern-dark": modernDark,
  "clean-light": cleanLight,
  "vibrant-health": vibrantHealth,
};

export function getTheme(id: string): SlideTheme {
  return themes[id] ?? chwTeal;
}

export function getAllThemes(): SlideTheme[] {
  return Object.values(themes);
}

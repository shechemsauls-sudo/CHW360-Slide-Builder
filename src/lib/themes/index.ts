import type { SlideTheme } from "./types";
import { chwTeal } from "./chw-teal";
import { chwCream } from "./chw-cream";
import { chwWhite } from "./chw-white";
import { chwBlack } from "./chw-black";
import { chwSlate } from "./chw-slate";
import { modernDark } from "./modern-dark";
import { cleanLight } from "./clean-light";
import { vibrantHealth } from "./vibrant-health";
import { sunsetWarmth } from "./sunset-warmth";
import { oceanProfessional } from "./ocean-professional";

export type { SlideTheme } from "./types";

const themes: Record<string, SlideTheme> = {
  "chw-teal": chwTeal,
  "chw-cream": chwCream,
  "chw-white": chwWhite,
  "chw-black": chwBlack,
  "chw-slate": chwSlate,
  "modern-dark": modernDark,
  "clean-light": cleanLight,
  "vibrant-health": vibrantHealth,
  "sunset-warmth": sunsetWarmth,
  "ocean-professional": oceanProfessional,
};

export function getTheme(id: string): SlideTheme {
  return themes[id] ?? chwTeal;
}

export function getAllThemes(): SlideTheme[] {
  return Object.values(themes);
}

/** Get palette color by index, cycling through available colors. Falls back to theme accent. */
export function getPaletteColor(theme: SlideTheme, index: number): string {
  if (!theme.palette?.length) return theme.colors.accent;
  return theme.palette[index % theme.palette.length]!;
}

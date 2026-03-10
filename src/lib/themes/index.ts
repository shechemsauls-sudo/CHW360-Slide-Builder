import type { SlideTheme } from "./types";
import { chwCream } from "./chw-cream";
import { chwWhite } from "./chw-white";
import { chwBlack } from "./chw-black";
import { chwSlate } from "./chw-slate";
import { chwTeal } from "./chw-teal";
import { vibrantHealth } from "./vibrant-health";

export type { SlideTheme } from "./types";

const themes: Record<string, SlideTheme> = {
  "chw-cream": chwCream,
  "chw-white": chwWhite,
  "chw-black": chwBlack,
  "chw-slate": chwSlate,
  "chw-teal": chwTeal,
  "chw-green": vibrantHealth,
};

export function getTheme(id: string): SlideTheme {
  return themes[id] ?? chwCream;
}

export function getAllThemes(): SlideTheme[] {
  return Object.values(themes);
}

/** Get palette color by index, cycling through available colors. Falls back to theme accent. */
export function getPaletteColor(theme: SlideTheme, index: number): string {
  if (!theme.palette?.length) return theme.colors.accent;
  return theme.palette[index % theme.palette.length]!;
}

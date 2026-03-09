/**
 * CHW360 brand tokens — single source of truth for brand colors.
 *
 * Usage:
 *   import { brand } from "~/lib/brand";
 *   style={{ color: brand.teal }}
 *
 * For Tailwind arbitrary values in className strings (e.g. bg-[#2D5A5A]/20),
 * inline hex is acceptable — these constants are mainly for style props and JS logic.
 */
export const brand = {
  teal: "#2D5A5A",
  tealLight: "#5B8A8A",
  coral: "#C9725B",
  cream: "#F5EDE6",
  creamLight: "#FAF7F4",
  container: "#EDE4DA",
  textGray: "#4A5568",
  textLight: "#6B7280",
} as const;

export type BrandColor = (typeof brand)[keyof typeof brand];

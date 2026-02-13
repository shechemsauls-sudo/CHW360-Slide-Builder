import type { SlideTheme } from "~/lib/themes";

export interface ParsedChartData {
  title: string;
  seriesNames: string[];
  data: { label: string; values: number[] }[];
}

/**
 * Parses chart block data from the :::block-type Title | Series1, Series2
 * format with lines of "Label: value1, value2".
 */
export function parseChartData(blockArg: string, content: string): ParsedChartData {
  // Parse title and optional series names from block arg
  // Format: "Title | Series1, Series2" or just "Title"
  const [titlePart, seriesPart] = blockArg.split("|").map((s) => s.trim());
  const title = titlePart ?? "";
  const seriesNames = seriesPart
    ? seriesPart.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Parse data lines: "Label: value1, value2"
  const data = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) return null;

      const label = line.slice(0, colonIdx).trim();
      const valuesStr = line.slice(colonIdx + 1).trim();
      const values = valuesStr.split(",").map((v) => {
        const parsed = parseFloat(v.trim());
        return isNaN(parsed) ? 0 : parsed;
      });

      return { label, values };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  // Auto-generate series names if not provided
  if (seriesNames.length === 0 && data.length > 0) {
    const maxValues = Math.max(...data.map((d) => d.values.length));
    for (let i = 0; i < maxValues; i++) {
      seriesNames.push(`Series ${i + 1}`);
    }
  }

  return { title, seriesNames, data };
}

/**
 * Converts parsed chart data to Recharts-compatible format:
 * [{ label: "A", series1: 10, series2: 20 }, ...]
 */
export function toRechartsData(
  parsed: ParsedChartData,
): Record<string, string | number>[] {
  return parsed.data.map((item) => {
    const entry: Record<string, string | number> = { label: item.label };
    parsed.seriesNames.forEach((name, i) => {
      entry[name] = item.values[i] ?? 0;
    });
    return entry;
  });
}

/**
 * Derives a chart color palette from the slide theme.
 * Returns [accent, primary, secondary, ...opacity variants]
 */
export function getChartColorPalette(theme: SlideTheme, count: number): string[] {
  const base = [
    theme.colors.accent,
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.accent + "99",
    theme.colors.primary + "99",
    theme.colors.secondary + "99",
  ];

  // Ensure we always return enough colors
  while (base.length < count) {
    base.push(theme.colors.accent + Math.round(40 + (base.length * 10)).toString(16));
  }

  return base.slice(0, Math.max(count, 1));
}

/**
 * Returns chart height based on slide layout.
 * Tighter layouts get shorter charts to fit within the slide.
 */
export function getChartHeight(layout: string): number {
  switch (layout) {
    case "split-left":
    case "split-right":
      return 150;
    case "two-column":
      return 130;
    default:
      return 200; // full, centered
  }
}

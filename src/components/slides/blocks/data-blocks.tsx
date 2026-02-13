import type { SlideTheme } from "~/lib/themes";

interface DataBlockProps {
  arg?: string;
  content: string;
  theme: SlideTheme;
}

/**
 * CSS-only progress bars.
 * Format:
 *   :::progress-bars Title
 *   Label: percentage
 *   :::
 */
export function ProgressBars({ arg, content, theme }: DataBlockProps) {
  const title = arg?.trim() ?? "";
  const items = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) return null;
      const label = line.slice(0, colonIdx).trim();
      const raw = parseFloat(line.slice(colonIdx + 1).trim());
      const value = isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
      return { label, value };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="my-4 w-full">
      {title && (
        <p className="mb-3 text-sm font-semibold" style={{ color: theme.colors.text }}>
          {title}
        </p>
      )}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-medium" style={{ color: theme.colors.text }}>
                {item.label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: theme.colors.accent }}>
                {item.value}%
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: `${theme.colors.accent}15` }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.value}%`,
                  background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accent}cc)`,
                  boxShadow: `0 0 6px ${theme.colors.accent}30`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CSS-only metric row for KPI dashboards.
 * Format:
 *   :::metric-row
 *   Value | Label
 *   :::
 */
export function MetricRow({ arg, content, theme }: DataBlockProps) {
  const title = arg?.trim() ?? "";
  const items = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipeIdx = line.indexOf("|");
      if (pipeIdx === -1) return { value: line, label: "" };
      return {
        value: line.slice(0, pipeIdx).trim(),
        label: line.slice(pipeIdx + 1).trim(),
      };
    });

  return (
    <div className="my-5 w-full">
      {title && (
        <p className="mb-3 text-center text-sm font-semibold" style={{ color: theme.colors.text }}>
          {title}
        </p>
      )}
      <div className="flex items-stretch justify-center gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-center rounded-xl px-4 py-4"
            style={{
              backgroundColor: `${theme.colors.accent}10`,
              border: `1px solid ${theme.colors.accent}20`,
            }}
          >
            <span
              className="text-2xl font-extrabold leading-none tracking-tight"
              style={{
                color: theme.colors.accent,
                textShadow: `0 1px 8px ${theme.colors.accent}20`,
              }}
            >
              {item.value}
            </span>
            {item.label && (
              <>
                <div
                  className="mx-auto mt-2 mb-1.5 h-px w-8 rounded-full"
                  style={{ background: `${theme.colors.accent}30` }}
                />
                <span
                  className="text-[11px] font-medium leading-tight text-center"
                  style={{ color: theme.colors.textMuted }}
                >
                  {item.label}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { SlideTheme } from "~/lib/themes";

export function InfoBox({ title, content, theme }: { title?: string; content: string; theme: SlideTheme }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5"
      style={{
        backgroundColor: `${theme.colors.accent}12`,
        border: `1px solid ${theme.colors.accent}20`,
      }}
    >
      {/* Accent gradient bar */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.accent}, ${theme.colors.accent}80)`,
        }}
      />
      <div className="pl-3">
        {title && (
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md text-[10px]"
              style={{ backgroundColor: `${theme.colors.accent}25`, color: theme.colors.accent }}
            >
              i
            </div>
            <p className="text-sm font-bold tracking-wide" style={{ color: theme.colors.accent }}>
              {title}
            </p>
          </div>
        )}
        <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
          {content}
        </p>
      </div>
    </div>
  );
}

export function KeyStat({ args, content, theme }: { args?: string; content: string; theme: SlideTheme }) {
  const parts = (args ?? "").split(/\s+/);
  const number = parts[0] ?? "";
  const label = parts.slice(1).join(" ") || content;

  return (
    <div className="flex items-center justify-center py-3">
      <div className="text-center">
        {/* Decorative ring behind the number */}
        <div className="relative inline-block">
          <div
            className="absolute -inset-3 rounded-full opacity-15"
            style={{
              background: `radial-gradient(circle, ${theme.colors.accent}40, transparent 70%)`,
            }}
          />
          <p
            className="relative text-5xl font-extrabold tracking-tight"
            style={{
              color: theme.colors.accent,
              textShadow: `0 2px 12px ${theme.colors.accent}30`,
            }}
          >
            {number}
          </p>
        </div>
        <div
          className="mx-auto mt-2 h-0.5 w-12 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.colors.accent}, transparent)` }}
        />
        <p className="mt-2 text-sm font-medium tracking-wide" style={{ color: theme.colors.textMuted }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function NumberedSteps({ content, theme }: { content: string; theme: SlideTheme }) {
  const steps = content.split("\n").filter((l) => l.trim());
  return (
    <div className="relative space-y-1">
      {/* Connector line */}
      {steps.length > 1 && (
        <div
          className="absolute left-[15px] top-5 bottom-5 w-0.5 rounded-full"
          style={{
            background: `linear-gradient(180deg, ${theme.colors.accent}60, ${theme.colors.accent}15)`,
          }}
        />
      )}
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-start gap-4 py-1.5">
          <div
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}cc)`,
              color: theme.colors.background,
              boxShadow: `0 2px 8px ${theme.colors.accent}30`,
            }}
          >
            {i + 1}
          </div>
          <div
            className="flex-1 rounded-xl px-4 py-2.5"
            style={{
              backgroundColor: `${theme.colors.accent}08`,
              border: `1px solid ${theme.colors.accent}12`,
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
              {step.replace(/^\d+[.)]\s*/, "")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FlowDiagram({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.includes("->")
    ? content.split("->").map((s) => s.trim()).filter(Boolean)
    : content.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="relative rounded-xl px-5 py-3 text-center text-sm font-semibold shadow-sm"
            style={{
              background: i === 0
                ? `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}dd)`
                : `${theme.colors.accent}12`,
              color: i === 0 ? theme.colors.background : theme.colors.text,
              border: i === 0 ? "none" : `1px solid ${theme.colors.accent}20`,
              boxShadow: i === 0 ? `0 4px 12px ${theme.colors.accent}25` : "none",
            }}
          >
            {item}
          </div>
          {i < items.length - 1 && (
            <div className="flex items-center">
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: `${theme.colors.accent}50` }} />
              <div
                className="h-0 w-0"
                style={{
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: `6px solid ${theme.colors.accent}70`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ComparisonTable({ content, theme }: { content: string; theme: SlideTheme }) {
  const rows = content.split("\n").filter((l) => l.trim());
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  const headers = (headerRow ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  const data = dataRows.map((r) => r.split("|").map((s) => s.trim()).filter(Boolean));

  return (
    <div
      className="overflow-hidden rounded-xl shadow-sm"
      style={{ border: `1px solid ${theme.colors.accent}18` }}
    >
      {headers.length > 0 && (
        <div
          className="flex"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}dd)`,
          }}
        >
          {headers.map((h, i) => (
            <div
              key={i}
              className="flex-1 px-5 py-3 text-center text-sm font-bold tracking-wide"
              style={{
                color: theme.colors.background,
                borderLeft: i > 0 ? `1px solid ${theme.colors.background}15` : "none",
              }}
            >
              {h}
            </div>
          ))}
        </div>
      )}
      {data.map((row, i) => (
        <div
          key={i}
          className="flex"
          style={{
            backgroundColor: i % 2 === 0 ? `${theme.colors.accent}06` : "transparent",
            borderTop: `1px solid ${theme.colors.accent}10`,
          }}
        >
          {row.map((cell, j) => (
            <div
              key={j}
              className="flex-1 px-5 py-3 text-center text-sm"
              style={{
                color: theme.colors.text,
                borderLeft: j > 0 ? `1px solid ${theme.colors.accent}10` : "none",
              }}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function IconGrid({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());
  const cols = items.length <= 4 ? 2 : items.length <= 6 ? 3 : 4;

  return (
    <div className={`grid gap-3 ${
      cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4"
    }`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl p-4 text-center transition-all"
          style={{
            backgroundColor: `${theme.colors.accent}08`,
            border: `1px solid ${theme.colors.accent}15`,
          }}
        >
          <div
            className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}30, ${theme.colors.accent}15)`,
              color: theme.colors.accent,
              boxShadow: `0 2px 8px ${theme.colors.accent}15`,
            }}
          >
            {item.charAt(0).toUpperCase()}
          </div>
          <p className="text-xs font-semibold tracking-wide" style={{ color: theme.colors.text }}>
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export function QuoteBlock({ attribution, content, theme }: { attribution?: string; content: string; theme: SlideTheme }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-5"
      style={{
        backgroundColor: `${theme.colors.accent}08`,
        border: `1px solid ${theme.colors.accent}15`,
      }}
    >
      {/* Large decorative quote mark */}
      <div
        className="absolute -left-1 -top-2 text-7xl font-serif leading-none select-none"
        style={{ color: `${theme.colors.accent}18` }}
      >
        &ldquo;
      </div>
      <div className="relative">
        <p
          className="text-base italic leading-relaxed"
          style={{ color: theme.colors.text }}
        >
          {content}
        </p>
        {attribution && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-0.5 w-6 rounded-full"
              style={{ backgroundColor: `${theme.colors.accent}60` }}
            />
            <p className="text-sm font-semibold" style={{ color: theme.colors.accent }}>
              {attribution}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Checklist({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl px-4 py-2.5"
          style={{
            backgroundColor: `${theme.colors.accent}06`,
            border: `1px solid ${theme.colors.accent}10`,
          }}
        >
          <div
            className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}cc)`,
              boxShadow: `0 1px 4px ${theme.colors.accent}30`,
            }}
          >
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3"
              fill="none"
              stroke={theme.colors.background}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6L5 8.5L9.5 3.5" />
            </svg>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
            {item.replace(/^[-*]\s*/, "")}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());

  return (
    <div className="py-2">
      {/* Horizontal connector line */}
      <div className="relative mx-8">
        <div
          className="absolute left-0 right-0 top-4 h-0.5 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${theme.colors.accent}15, ${theme.colors.accent}40, ${theme.colors.accent}15)`,
          }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-2">
        {items.map((item, i) => {
          const [label, ...desc] = item.split(":");
          const isFirst = i === 0;
          return (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              {/* Node circle */}
              <div
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shadow-sm"
                style={{
                  background: isFirst
                    ? `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}cc)`
                    : `${theme.colors.accent}20`,
                  color: isFirst ? theme.colors.background : theme.colors.accent,
                  boxShadow: isFirst ? `0 2px 10px ${theme.colors.accent}30` : "none",
                  border: isFirst ? "none" : `2px solid ${theme.colors.accent}30`,
                }}
              >
                {i + 1}
              </div>
              {/* Label card */}
              <div
                className="mt-2 w-full rounded-lg px-2 py-1.5"
                style={{
                  backgroundColor: `${theme.colors.accent}08`,
                  border: `1px solid ${theme.colors.accent}12`,
                }}
              >
                <p className="text-xs font-bold" style={{ color: theme.colors.text }}>
                  {label?.trim()}
                </p>
                {desc.length > 0 && (
                  <p className="mt-0.5 text-[10px] leading-tight" style={{ color: theme.colors.textMuted }}>
                    {desc.join(":").trim()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HighlightBox({ content, theme }: { content: string; theme: SlideTheme }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-4 text-center"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.accent}18, ${theme.colors.accent}08)`,
        border: `1px solid ${theme.colors.accent}25`,
      }}
    >
      {/* Decorative corner accents */}
      <div
        className="absolute left-0 top-0 h-8 w-8 opacity-30"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${theme.colors.accent}40, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-8 w-8 opacity-30"
        style={{
          background: `radial-gradient(circle at 100% 100%, ${theme.colors.accent}40, transparent 70%)`,
        }}
      />
      <p
        className="relative text-sm font-semibold leading-relaxed"
        style={{ color: theme.colors.accent }}
      >
        {content}
      </p>
    </div>
  );
}

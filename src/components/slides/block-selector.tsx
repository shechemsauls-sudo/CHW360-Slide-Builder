"use client";

import type { VisualBlockType } from "~/lib/ai/types";

interface BlockMeta {
  id: VisualBlockType;
  name: string;
  description: string;
}

const BLOCKS: BlockMeta[] = [
  { id: "key-stat", name: "Key Stat", description: "Large statistic display" },
  { id: "numbered-steps", name: "Steps", description: "Numbered step list" },
  { id: "flow-diagram", name: "Flow", description: "Horizontal workflow arrows" },
  { id: "comparison-table", name: "Compare", description: "Side-by-side table" },
  { id: "checklist", name: "Checklist", description: "Visual checkbox items" },
  { id: "info-box", name: "Info Box", description: "Callout with accent border" },
  { id: "highlight-box", name: "Highlight", description: "Key takeaway banner" },
  { id: "timeline", name: "Timeline", description: "Phases & milestones" },
  { id: "icon-grid", name: "Grid", description: "Category icon grid" },
  { id: "quote-block", name: "Quote", description: "Styled pull quote" },
  { id: "bar-chart", name: "Bar Chart", description: "Compare values by category" },
  { id: "pie-chart", name: "Pie Chart", description: "Proportions & breakdowns" },
  { id: "line-chart", name: "Line Chart", description: "Trends over time" },
  { id: "area-chart", name: "Area Chart", description: "Cumulative volume trends" },
  { id: "radar-chart", name: "Radar", description: "Multi-factor assessment" },
  { id: "progress-bars", name: "Progress", description: "Completion rate bars" },
  { id: "metric-row", name: "Metrics", description: "Dashboard KPI cards" },
  { id: "cycle", name: "Cycle", description: "Circular process loop" },
  { id: "card-grid", name: "Cards", description: "Multi-card layout" },
  { id: "chevron-flow", name: "Chevron", description: "Stacked process arrows" },
  { id: "accent-list", name: "Accent List", description: "Highlighted label/detail" },
  { id: "pill-list", name: "Pills", description: "Rounded tag capsules" },
  { id: "stat-bubbles", name: "Bubbles", description: "Circular stat badges" },
  { id: "tag-cloud", name: "Tags", description: "Weighted keyword cloud" },
  { id: "rounded-cards", name: "Rounded", description: "Soft rounded card grid" },
];

interface BlockSelectorProps {
  selected: VisualBlockType[];
  onSelect: (blocks: VisualBlockType[]) => void;
  disabled?: boolean;
}

export function BlockSelector({ selected, onSelect, disabled }: BlockSelectorProps) {
  const allSelected = selected.length === 0; // empty = all enabled

  const toggle = (id: VisualBlockType) => {
    if (disabled) return;

    if (allSelected) {
      // Switching from "all" to specific: select all except the toggled one
      onSelect(BLOCKS.filter((b) => b.id !== id).map((b) => b.id));
    } else if (selected.includes(id)) {
      const next = selected.filter((b) => b !== id);
      // If removing last one, go back to "all"
      onSelect(next.length === 0 ? [] : next);
    } else {
      const next = [...selected, id];
      // If all selected individually, reset to "all" (empty)
      onSelect(next.length === BLOCKS.length ? [] : next);
    }
  };

  const selectAll = () => {
    if (!disabled) onSelect([]);
  };

  const isActive = (id: VisualBlockType) => allSelected || selected.includes(id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">Visual Blocks</label>
        <button
          type="button"
          onClick={selectAll}
          className={`text-xs transition-colors ${
            allSelected ? "text-[#5B8A8A]" : "text-gray-500 hover:text-gray-300"
          }`}
          disabled={disabled}
        >
          {allSelected ? "All enabled" : "Enable all"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {BLOCKS.map((block) => {
          const active = isActive(block.id);
          return (
            <button
              key={block.id}
              type="button"
              onClick={() => toggle(block.id)}
              disabled={disabled}
              className={`group rounded-lg border p-2.5 text-left transition-all ${
                active
                  ? "border-[#5B8A8A]/60 bg-[#2D5A5A]/15"
                  : "border-white/10 bg-white/[0.02] opacity-50 hover:opacity-80"
              }`}
            >
              {/* Mini preview */}
              <div className="mb-2 flex h-10 items-center justify-center overflow-hidden rounded bg-white/[0.04]">
                <BlockPreview type={block.id} active={active} />
              </div>
              <div className="text-xs font-medium text-white">{block.name}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-gray-500">
                {block.description}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        {allSelected
          ? "AI will choose the best blocks for your content (30-40% of slides)"
          : `${selected.length} block type${selected.length === 1 ? "" : "s"} enabled — AI will only use these`}
      </p>
    </div>
  );
}

function BlockPreview({ type, active }: { type: VisualBlockType; active: boolean }) {
  const accent = active ? "#5B8A8A" : "#666";
  const muted = active ? "rgba(91,138,138,0.3)" : "rgba(255,255,255,0.1)";
  const textColor = active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)";

  switch (type) {
    case "key-stat":
      return (
        <div className="text-center">
          <div className="text-lg font-bold leading-none" style={{ color: accent }}>95%</div>
          <div className="mt-0.5 h-1 w-8 rounded-full mx-auto" style={{ backgroundColor: muted }} />
        </div>
      );

    case "numbered-steps":
      return (
        <div className="flex flex-col gap-1 px-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-1.5">
              <div className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[6px] font-bold" style={{ backgroundColor: accent, color: "#fff" }}>{n}</div>
              <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      );

    case "flow-diagram":
      return (
        <div className="flex items-center gap-1 px-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-3.5 w-6 rounded" style={{ backgroundColor: muted }} />
              {i < 2 && <span className="text-[8px]" style={{ color: accent }}>→</span>}
            </div>
          ))}
        </div>
      );

    case "comparison-table":
      return (
        <div className="w-full px-2">
          <div className="flex gap-px">
            <div className="h-2 flex-1 rounded-t" style={{ backgroundColor: accent }} />
            <div className="h-2 flex-1 rounded-t" style={{ backgroundColor: accent }} />
          </div>
          {[0, 1].map((r) => (
            <div key={r} className="flex gap-px mt-px">
              <div className="h-1.5 flex-1" style={{ backgroundColor: muted }} />
              <div className="h-1.5 flex-1" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div className="flex flex-col gap-1 px-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 shrink-0 rounded-sm border" style={{ borderColor: accent }} />
              <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      );

    case "info-box":
      return (
        <div className="w-full px-2">
          <div className="rounded border-l-2 px-1.5 py-1" style={{ borderColor: accent, backgroundColor: muted }}>
            <div className="h-1 w-6 rounded-full" style={{ backgroundColor: accent }} />
            <div className="mt-1 h-1 w-full rounded-full" style={{ backgroundColor: `${accent}40` }} />
          </div>
        </div>
      );

    case "highlight-box":
      return (
        <div className="w-full px-2">
          <div className="rounded px-2 py-1.5 text-center" style={{ backgroundColor: muted }}>
            <div className="h-1 w-full rounded-full mx-auto" style={{ backgroundColor: accent }} />
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="flex items-center gap-2 px-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mt-0.5 h-0.5 w-3" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      );

    case "icon-grid":
      return (
        <div className="grid grid-cols-2 gap-1 px-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: muted }} />
              <div className="mt-0.5 h-0.5 w-3 rounded-full" style={{ backgroundColor: `${textColor}` }} />
            </div>
          ))}
        </div>
      );

    case "quote-block":
      return (
        <div className="px-2 text-center">
          <span className="text-sm leading-none" style={{ color: accent }}>&ldquo;</span>
          <div className="h-1 w-10 rounded-full mx-auto" style={{ backgroundColor: muted }} />
          <div className="mt-1 h-1 w-6 rounded-full mx-auto" style={{ backgroundColor: `${textColor}` }} />
        </div>
      );

    case "bar-chart":
      return (
        <svg viewBox="0 0 36 24" className="h-7 w-9">
          {[
            { x: 2, h: 14 },
            { x: 10, h: 20 },
            { x: 18, h: 10 },
            { x: 26, h: 16 },
          ].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={24 - bar.h}
              width="6"
              height={bar.h}
              rx="1"
              fill={i === 1 ? accent : muted}
            />
          ))}
        </svg>
      );

    case "pie-chart":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <circle cx="12" cy="12" r="10" fill={muted} />
          <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill={accent} />
          <path d="M12 12 L22 12 A10 10 0 0 1 17 20.66 Z" fill={`${accent}88`} />
        </svg>
      );

    case "line-chart":
      return (
        <svg viewBox="0 0 40 20" className="h-6 w-10 px-1">
          <polyline
            points="2,16 10,10 20,13 30,5 38,8"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[2, 10, 20, 30, 38].map((x, i) => (
            <circle key={i} cx={x} cy={[16, 10, 13, 5, 8][i]} r="1.5" fill={accent} />
          ))}
        </svg>
      );

    case "area-chart":
      return (
        <svg viewBox="0 0 40 20" className="h-6 w-10 px-1">
          <defs>
            <linearGradient id="area-prev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d="M2,16 L10,12 L20,14 L30,6 L38,9 L38,18 L2,18 Z"
            fill="url(#area-prev)"
          />
          <polyline
            points="2,16 10,12 20,14 30,6 38,9"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "radar-chart":
      return (
        <svg viewBox="0 0 24 24" className="h-7 w-7">
          <polygon
            points="12,2 22,8 19,20 5,20 2,8"
            fill="none"
            stroke={muted}
            strokeWidth="0.5"
          />
          <polygon
            points="12,5 18,9 16,17 8,17 6,9"
            fill={`${accent}30`}
            stroke={accent}
            strokeWidth="1"
          />
        </svg>
      );

    case "progress-bars":
      return (
        <div className="flex flex-col gap-1.5 px-2 w-full">
          {[85, 60, 40].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: `${muted}` }}>
                <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: accent }} />
              </div>
            </div>
          ))}
        </div>
      );

    case "metric-row":
      return (
        <div className="flex gap-1 px-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center rounded px-1 py-1" style={{ backgroundColor: muted }}>
              <div className="text-[8px] font-bold leading-none" style={{ color: accent }}>42</div>
              <div className="mt-0.5 h-0.5 w-3 rounded-full" style={{ backgroundColor: `${textColor}` }} />
            </div>
          ))}
        </div>
      );

    case "cycle":
      return (
        <svg viewBox="0 0 28 28" className="h-7 w-7">
          <circle cx="14" cy="14" r="10" fill="none" stroke={muted} strokeWidth="1.5" strokeDasharray="4 3" />
          {[0, 120, 240].map((deg, i) => {
            const rad = (deg - 90) * Math.PI / 180;
            return <circle key={i} cx={14 + 10 * Math.cos(rad)} cy={14 + 10 * Math.sin(rad)} r="2.5" fill={accent} />;
          })}
        </svg>
      );

    case "card-grid":
      return (
        <div className="grid grid-cols-2 gap-1 px-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded px-1 py-1" style={{ backgroundColor: muted }}>
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mt-0.5 h-0.5 w-full rounded-full" style={{ backgroundColor: `${textColor}` }} />
            </div>
          ))}
        </div>
      );

    case "chevron-flow":
      return (
        <svg viewBox="0 0 40 24" className="h-7 w-10">
          {[0, 1, 2].map((i) => {
            const x = i * 12;
            const fill = i === 0 ? accent : muted;
            return (
              <path
                key={i}
                d={`M${x},2 L${x + 9},2 L${x + 13},12 L${x + 9},22 L${x},22 L${x + 4},12 Z`}
                fill={fill}
              />
            );
          })}
        </svg>
      );

    case "accent-list":
      return (
        <div className="flex flex-col gap-1 px-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 w-1 rounded-full" style={{ backgroundColor: accent }} />
              <div className="h-1 w-4 rounded-full" style={{ backgroundColor: accent }} />
              <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      );

    case "pill-list":
      return (
        <div className="flex flex-wrap justify-center gap-1 px-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{ width: `${12 + (i % 3) * 4}px`, backgroundColor: i === 0 ? accent : muted }}
            />
          ))}
        </div>
      );

    case "stat-bubbles":
      return (
        <div className="flex items-center justify-center gap-1.5 px-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ backgroundColor: i === 0 ? accent : muted }}
            >
              <span className="text-[5px] font-bold" style={{ color: "#fff" }}>8</span>
            </div>
          ))}
        </div>
      );

    case "tag-cloud":
      return (
        <div className="flex flex-wrap justify-center gap-0.5 px-1">
          {[8, 6, 10, 7, 5].map((w, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: `${w * 1.5}px`,
                height: `${4 + (i % 2)}px`,
                backgroundColor: i < 2 ? accent : muted,
              }}
            />
          ))}
        </div>
      );

    case "rounded-cards":
      return (
        <div className="grid grid-cols-2 gap-1 px-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-lg px-1.5 py-1" style={{ backgroundColor: muted }}>
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mt-0.5 h-0.5 w-full rounded-full" style={{ backgroundColor: `${textColor}` }} />
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

import { useId } from "react";
import type { SlideTheme } from "~/lib/themes";
import { getPaletteColor } from "~/lib/themes";
import { MarkdownRenderer, inlineFormat } from "../markdown-renderer";

export function InfoBox({ title, content, theme }: { title?: string; content: string; theme: SlideTheme }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4"
      style={{
        backgroundColor: `${theme.colors.accent}15`,
        border: `1px solid ${theme.colors.accent}25`,
      }}
    >
      {/* Accent gradient bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{
          background: `linear-gradient(180deg, ${theme.colors.accent}, ${theme.colors.accent}80)`,
        }}
      />
      <div className="pl-3 text-left">
        {title && (
          <div className="mb-1.5 flex items-center gap-2">
            <div
              className="flex h-[18px] w-[18px] items-center justify-center rounded text-[9px] font-semibold"
              style={{ backgroundColor: `${theme.colors.accent}30`, color: theme.colors.accent }}
            >
              i
            </div>
            <p className="text-sm font-bold tracking-wide" style={{ color: theme.colors.accent }}>
              {title}
            </p>
          </div>
        )}
        <MarkdownRenderer
          content={content}
          className="text-sm leading-relaxed"
          style={{ color: theme.colors.text }}
        />
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
  const compact = steps.length > 4;
  return (
    <div className={`relative ${compact ? "space-y-0.5" : "space-y-1"}`}>
      {/* Connector line */}
      {steps.length > 1 && (
        <div
          className={`absolute ${compact ? "left-[11px]" : "left-[15px]"} top-5 bottom-5 w-0.5 rounded-full`}
          style={{
            background: `linear-gradient(180deg, ${theme.colors.accent}70, ${theme.colors.accent}25)`,
          }}
        />
      )}
      {steps.map((step, i) => {
        const color = getPaletteColor(theme, i);
        return (
        <div key={i} className={`relative flex items-start gap-3 ${compact ? "py-0.5" : "py-1.5"}`}>
          <div
            className={`relative z-10 flex ${compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"} shrink-0 items-center justify-center rounded-full font-bold shadow-sm`}
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: theme.colors.background,
              boxShadow: `0 2px 8px ${color}30`,
            }}
          >
            {i + 1}
          </div>
          <div
            className={`flex-1 rounded-xl ${compact ? "px-3 py-1" : "px-4 py-2"}`}
            style={{
              backgroundColor: `${color}18`,
              border: `1px solid ${color}28`,
            }}
          >
            <MarkdownRenderer
              content={step.replace(/^\d+[.)]\s*/, "")}
              className={`${compact ? "text-xs" : "text-sm"} leading-relaxed`}
              style={{ color: theme.colors.text }}
            />
          </div>
        </div>
        );
      })}
    </div>
  );
}

export function FlowDiagram({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.includes("->")
    ? content.split("->").map((s) => s.trim()).filter(Boolean)
    : content.includes("→")
      ? content.split("→").map((s) => s.trim()).filter(Boolean)
      : content.split("\n").map((s) => s.trim()).filter(Boolean);

  // Single row — only for 4 or fewer items
  if (items.length <= 4) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
        {items.map((item, i) => (
          <FlowItem key={i} item={item} index={i} isLast={i === items.length - 1} theme={theme} />
        ))}
      </div>
    );
  }

  // Multi-row: chunk into rows, snake pattern (even rows L→R, odd rows R→L)
  // For 5 items: 3+2; for 6: 3+3; for 7: 4+3; etc.
  const maxPerRow = items.length <= 6 ? 3 : Math.ceil(items.length / Math.ceil(items.length / 4));
  const rows: string[][] = [];
  for (let i = 0; i < items.length; i += maxPerRow) {
    rows.push(items.slice(i, i + maxPerRow));
  }

  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {rows.map((row, rowIdx) => {
        const reversed = rowIdx % 2 === 1;
        const displayRow = reversed ? [...row].reverse() : row;
        const baseIndex = rows.slice(0, rowIdx).reduce((s, r) => s + r.length, 0);

        return (
          <div key={rowIdx}>
            {/* S-curve connector from previous row */}
            {rowIdx > 0 && (
              <FlowSCurve
                fromRight={rowIdx % 2 === 1}
                color={getPaletteColor(theme, baseIndex - 1)}
                nextColor={getPaletteColor(theme, baseIndex)}
              />
            )}
            <div className={`flex items-center justify-center gap-1.5 ${reversed ? "flex-row" : ""}`}>
              {displayRow.map((item, i) => {
                const actualIdx = reversed
                  ? baseIndex + (row.length - 1 - i)
                  : baseIndex + i;
                const isLastInRow = i === displayRow.length - 1;
                return (
                  <FlowItem
                    key={actualIdx}
                    item={item}
                    index={actualIdx}
                    isLast={isLastInRow}
                    theme={theme}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlowItem({ item, index, isLast, theme }: { item: string; index: number; isLast: boolean; theme: SlideTheme }) {
  const color = getPaletteColor(theme, index);
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="relative rounded-xl px-5 py-3 text-center text-sm font-semibold shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: theme.colors.background,
          boxShadow: `0 4px 12px ${color}25`,
        }}
        dangerouslySetInnerHTML={{ __html: inlineFormat(item) }}
      />
      {!isLast && (
        <div className="flex items-center">
          <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: `${color}50` }} />
          <div
            className="h-0 w-0"
            style={{
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: `6px solid ${color}70`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/** SVG S-curve connector between flow diagram rows */
function FlowSCurve({ fromRight, color, nextColor }: { fromRight: boolean; color: string; nextColor: string }) {
  // Full-width S-curve: spans from one side of the row to the other
  // fromRight=true: previous row was L→R, so curve starts at right and ends at left
  // fromRight=false: previous row was R→L, so curve starts at left and ends at right
  const vbW = 200;
  const vbH = 60;
  const pad = 8;

  // Two-segment S-curve with strong vertical tangents at start and end.
  // Control points stay at the same X as their anchor for ~60% of the height,
  // forcing the curve to travel vertically before sweeping horizontally.
  const startX = fromRight ? vbW - pad : pad;
  const endX = fromRight ? pad : vbW - pad;

  const path = [
    `M${startX},0`,
    // Control point 1: same X as start, 65% down — curve drops vertically first
    // Control point 2: same X as end, 20% down — long vertical run into landing
    `C${startX},${vbH * 0.65} ${endX},${vbH * 0.05} ${endX},${vbH}`,
  ].join(" ");

  return (
    <div className="w-full px-4">
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        fill="none"
        className="h-12 w-full overflow-visible"
      >
        <defs>
          <linearGradient id={`scurve-${fromRight ? "r" : "l"}`} x1="0" y1="0" x2={fromRight ? "0" : "1"} y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={nextColor} stopOpacity="0.5" />
          </linearGradient>
          <marker
            id={`scurve-arrow-${fromRight ? "r" : "l"}`}
            markerWidth="6"
            markerHeight="5"
            refX="5"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0.5 L5,2.5 L0,4.5" fill="none" stroke={nextColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </marker>
        </defs>
        <path
          d={path}
          stroke={`url(#scurve-${fromRight ? "r" : "l"})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd={`url(#scurve-arrow-${fromRight ? "r" : "l"})`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function CycleDiagram({ content, theme }: { content: string; theme: SlideTheme }) {
  const uid = useId();
  const items = content.includes("->")
    ? content.split("->").map((s) => s.trim()).filter(Boolean)
    : content.split("\n").map((s) => s.trim()).filter(Boolean);

  const n = items.length;
  if (n === 0) return null;

  // Scale layout based on item count
  const svgW = 480;
  const svgH = n <= 4 ? 225 : n <= 5 ? 270 : 300;
  const cxPos = svgW / 2;
  const cyPos = svgH / 2;
  const elRx = n <= 4 ? 178 : 185;
  const elRy = n <= 4 ? 82 : n <= 5 ? 105 : 120;
  const nW = n <= 4 ? 130 : n <= 5 ? 115 : 105;
  const nH = n <= 4 ? 40 : 36;
  const badgeSize = n <= 4 ? 28 : 24;

  const nodes = items.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cxPos + elRx * Math.cos(angle), y: cyPos + elRy * Math.sin(angle), angle };
  });

  // Smart anchor: use ellipse tangent to find where arrow exits/enters each pill
  function getAnchor(idx: number, outgoing: boolean) {
    const nd = nodes[idx]!;
    // Tangent direction on ellipse (clockwise flow)
    let tx = -elRx * Math.sin(nd.angle);
    let ty = elRy * Math.cos(nd.angle);
    const len = Math.sqrt(tx * tx + ty * ty);
    tx /= len;
    ty /= len;
    if (!outgoing) { tx = -tx; ty = -ty; }
    // Intersect ray from center with pill boundary
    const hw = nW / 2;
    const hh = nH / 2;
    const s = Math.min(
      Math.abs(tx) > 0.001 ? hw / Math.abs(tx) : 1e9,
      Math.abs(ty) > 0.001 ? hh / Math.abs(ty) : 1e9,
    );
    return { x: nd.x + tx * (s + 5), y: nd.y + ty * (s + 5) };
  }

  return (
    <div className="flex items-center justify-center py-1">
      <div className="relative w-full" style={{ maxWidth: svgW, aspectRatio: `${svgW} / ${svgH}` }}>
        {/* Arrow layer */}
        <svg viewBox={`-10 -10 ${svgW + 20} ${svgH + 20}`} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            {nodes.map((_, i) => {
              const color = getPaletteColor(theme, i);
              const next = getPaletteColor(theme, (i + 1) % n);
              return [
                <marker key={`m-${i}`} id={`cy-m-${uid}-${i}`} markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <path d="M0,0.5 L5,2.5 L0,4.5" fill="none" stroke={next} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </marker>,
                <linearGradient key={`g-${i}`} id={`cy-g-${uid}-${i}`}>
                  <stop offset="0%" stopColor={color} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={next} stopOpacity="0.55" />
                </linearGradient>,
              ];
            })}
          </defs>
          {nodes.map((_, i) => {
            const start = getAnchor(i, true);
            const end = getAnchor((i + 1) % n, false);
            // Cubic bezier with tangent-following control points for smooth arcs.
            // Each control point follows the ellipse tangent direction at its node,
            // producing curves that hug the ellipse contour naturally.
            const startNode = nodes[i]!;
            const endNode = nodes[(i + 1) % n]!;
            const tangentLen = Math.max(30, 55 - n * 4); // shorter tangents for more items

            // Tangent at start node (clockwise along ellipse)
            let st_tx = -elRx * Math.sin(startNode.angle);
            let st_ty = elRy * Math.cos(startNode.angle);
            const st_len = Math.sqrt(st_tx * st_tx + st_ty * st_ty) || 1;
            st_tx /= st_len; st_ty /= st_len;

            // Tangent at end node (clockwise, but incoming — so reverse)
            let en_tx = elRx * Math.sin(endNode.angle);
            let en_ty = -elRy * Math.cos(endNode.angle);
            const en_len = Math.sqrt(en_tx * en_tx + en_ty * en_ty) || 1;
            en_tx /= en_len; en_ty /= en_len;

            const cp1x = start.x + st_tx * tangentLen;
            const cp1y = start.y + st_ty * tangentLen;
            const cp2x = end.x + en_tx * tangentLen;
            const cp2y = end.y + en_ty * tangentLen;

            return (
              <path
                key={`a-${i}`}
                d={`M${start.x},${start.y} C${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`}
                stroke={`url(#cy-g-${uid}-${i})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                markerEnd={`url(#cy-m-${uid}-${i})`}
              />
            );
          })}
        </svg>

        {/* Node pills */}
        {nodes.map((node, i) => {
          const color = getPaletteColor(theme, i);
          return (
            <div
              key={`n-${i}`}
              className="absolute flex items-center gap-1.5 rounded-full pl-1.5 pr-3 text-center"
              style={{
                left: `${((node.x - nW / 2) / svgW) * 100}%`,
                top: `${((node.y - nH / 2) / svgH) * 100}%`,
                width: `${(nW / svgW) * 100}%`,
                height: `${(nH / svgH) * 100}%`,
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 4px 14px ${color}25`,
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                }}
              >
                {i + 1}
              </div>
              <span className="flex-1 text-[10px] font-semibold leading-tight text-white" dangerouslySetInnerHTML={{ __html: inlineFormat(items[i]!) }} />
            </div>
          );
        })}
      </div>
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
      style={{ border: `1px solid ${theme.colors.accent}28` }}
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
              dangerouslySetInnerHTML={{ __html: inlineFormat(h) }}
            />
          ))}
        </div>
      )}
      {data.map((row, i) => (
        <div
          key={i}
          className="flex"
          style={{
            backgroundColor: i % 2 === 0 ? `${theme.colors.accent}12` : "transparent",
            borderTop: `1px solid ${theme.colors.accent}20`,
          }}
        >
          {row.map((cell, j) => (
            <div
              key={j}
              className="flex-1 px-5 py-3 text-center text-sm"
              style={{
                color: theme.colors.text,
                borderLeft: j > 0 ? `1px solid ${theme.colors.accent}20` : "none",
              }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }}
            />
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
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
        <div
          key={i}
          className="rounded-xl p-4 text-center transition-all"
          style={{
            backgroundColor: `${color}18`,
            border: `1px solid ${color}30`,
          }}
        >
          <div
            className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold"
            style={{
              background: `linear-gradient(135deg, ${color}40, ${color}25)`,
              color: color,
              boxShadow: `0 2px 8px ${color}25`,
            }}
          >
            {item.charAt(0).toUpperCase()}
          </div>
          <p className="text-xs font-semibold tracking-wide" style={{ color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        </div>
        );
      })}
    </div>
  );
}

export function QuoteBlock({ attribution, content, theme }: { attribution?: string; content: string; theme: SlideTheme }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl px-6 py-5"
      style={{
        backgroundColor: `${theme.colors.accent}18`,
        border: `1px solid ${theme.colors.accent}28`,
      }}
    >
      {/* Large decorative quote mark */}
      <div
        className="absolute -left-1 -top-2 text-7xl font-serif leading-none select-none"
        style={{ color: `${theme.colors.accent}30` }}
      >
        &ldquo;
      </div>
      <div className="relative">
        <MarkdownRenderer
          content={content}
          className="text-base italic leading-relaxed"
          style={{ color: theme.colors.text }}
        />
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
  const items = content.split("\n").filter((l) => l.trim()).map((line) => {
    const trimmed = line.replace(/^[-*]\s*/, "");
    const checked = /^\[x\]\s*/i.test(trimmed);
    const text = trimmed.replace(/^\[[ x]?\]\s*/i, "");
    return { text, checked };
  });
  const compact = items.length > 4;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1.5"}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex items-start gap-2.5 rounded-lg ${compact ? "px-2.5 py-1" : "px-3 py-2"}`}
          style={{
            backgroundColor: `${theme.colors.accent}12`,
            border: `1px solid ${theme.colors.accent}20`,
          }}
        >
          {item.checked ? (
            <div
              className={`mt-0.5 flex ${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 items-center justify-center rounded-md shadow-sm`}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accent}cc)`,
                boxShadow: `0 1px 4px ${theme.colors.accent}30`,
              }}
            >
              <svg
                viewBox="0 0 12 12"
                className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}
                fill="none"
                stroke={theme.colors.background}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6L5 8.5L9.5 3.5" />
              </svg>
            </div>
          ) : (
            <div
              className={`mt-0.5 flex ${compact ? "h-4 w-4" : "h-5 w-5"} shrink-0 items-center justify-center rounded-md`}
              style={{
                border: `2px solid ${theme.colors.accent}60`,
              }}
            />
          )}
          <MarkdownRenderer
            content={item.text}
            className={`${compact ? "text-xs" : "text-sm"} leading-relaxed`}
            style={{ color: theme.colors.text }}
          />
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
            background: `linear-gradient(90deg, ${theme.colors.accent}25, ${theme.colors.accent}55, ${theme.colors.accent}25)`,
          }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-2">
        {items.map((item, i) => {
          const [label, ...desc] = item.split(":");
          const color = getPaletteColor(theme, i);
          return (
            <div key={i} className="flex flex-1 flex-col items-center text-center">
              {/* Node circle */}
              <div
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: theme.colors.background,
                  boxShadow: `0 2px 10px ${color}30`,
                }}
              >
                {i + 1}
              </div>
              {/* Label card */}
              <div
                className="mt-2 w-full rounded-lg px-2 py-1.5"
                style={{
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}28`,
                }}
              >
                <p className="text-xs font-bold" style={{ color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: inlineFormat(label?.trim() ?? "") }} />
                {desc.length > 0 && (
                  <p className="mt-0.5 text-[10px] leading-tight" style={{ color: theme.colors.textMuted }} dangerouslySetInnerHTML={{ __html: inlineFormat(desc.join(":").trim()) }} />
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
      className="relative overflow-hidden rounded-xl px-5 py-3 text-center"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.accent}25, ${theme.colors.accent}12)`,
        border: `1px solid ${theme.colors.accent}35`,
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
      <MarkdownRenderer
        content={content}
        className="relative text-sm font-semibold leading-relaxed"
        style={{ color: theme.colors.accent }}
      />
    </div>
  );
}

export function CardGrid({ content, theme }: { content: string; theme: SlideTheme }) {
  // Support two formats:
  // 1. Single-line: "Title | Description" per line
  // 2. Multi-line: groups separated by --- where first line is title, rest is description
  const hasSeparators = /^-{2,}$/m.test(content);

  const items = hasSeparators
    ? content
        .split(/^-{2,}$/m)
        .map((section) => section.trim())
        .filter(Boolean)
        .map((section) => {
          const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
          return {
            title: lines[0] ?? "",
            description: lines.slice(1).join("\n"),
          };
        })
    : content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const pipeIdx = line.indexOf("|");
          if (pipeIdx === -1) return { title: line, description: "" };
          return {
            title: line.slice(0, pipeIdx).trim(),
            description: line.slice(pipeIdx + 1).trim(),
          };
        });

  return (
    <div className={`grid gap-3 ${items.length <= 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <div
            key={i}
            className={`rounded-xl shadow-sm ${items.length > 3 ? "p-3" : "p-5"}`}
            style={{ backgroundColor: color }}
          >
            <MarkdownRenderer
              content={item.title}
              className={`${items.length > 3 ? "text-xs" : "text-sm"} font-bold leading-tight text-white`}
            />
            {item.description && (
              <MarkdownRenderer
                content={item.description}
                className={`mt-1.5 ${items.length > 3 ? "text-[10px]" : "text-xs"} leading-relaxed text-white/85`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ChevronFlow({ content, theme }: { content: string; theme: SlideTheme }) {
  // Split on newlines first; if only one line, try splitting on -> or → arrows
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const expanded = lines.length === 1 && /->|→/.test(lines[0]!)
    ? lines[0]!.split(/\s*(?:->|→)\s*/).filter(Boolean)
    : lines;

  const items = expanded.map((line) => {
    const pipeIdx = line.indexOf("|");
    if (pipeIdx === -1) return { title: line, description: "" };
    return {
      title: line.slice(0, pipeIdx).trim(),
      description: line.slice(pipeIdx + 1).trim(),
    };
  });

  if (items.length === 0) return null;

  return (
    <div className="flex items-stretch gap-1 overflow-hidden py-2">
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        const isLast = i === items.length - 1;
        return (
          <div
            key={i}
            className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-3 text-center"
            style={{
              backgroundColor: color,
              clipPath: isLast
                ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)"
                : i === 0
                  ? "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)"
                  : "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%, 8% 50%)",
              marginLeft: i === 0 ? 0 : -4,
              paddingLeft: i === 0 ? "1.5rem" : "2rem",
            }}
          >
            <MarkdownRenderer content={item.title} className="text-sm font-bold text-white" />
            {item.description && (
              <MarkdownRenderer content={item.description} className="mt-1 text-[10px] leading-tight text-white/80" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PillList({ content, theme }: { content: string; theme: SlideTheme }) {
  const lines = content.split("\n").filter((l) => l.trim());

  // Detect single-line pipe-separated format: "A | B | C | D"
  // vs multi-line with pipe descriptions: "Label | Description\nLabel2 | Description2"
  const isSingleLinePipeSeparated = lines.length === 1 && (lines[0]!.match(/\|/g)?.length ?? 0) >= 2;

  const items = isSingleLinePipeSeparated
    ? lines[0]!.split("|").map((s) => ({ label: s.trim(), description: "" })).filter((i) => i.label)
    : lines.map((line) => {
        const pipeIdx = line.indexOf("|");
        if (pipeIdx === -1) return { label: line.trim(), description: "" };
        return { label: line.slice(0, pipeIdx).trim(), description: line.slice(pipeIdx + 1).trim() };
      });

  return (
    <div className="flex flex-wrap gap-2 py-1">
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <div
            key={i}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              backgroundColor: `${color}20`,
              border: `1px solid ${color}40`,
            }}
          >
            <span className="text-sm font-semibold" style={{ color }} dangerouslySetInnerHTML={{ __html: inlineFormat(item.label) }} />
            {item.description && (
              <span className="text-xs" style={{ color: theme.colors.textMuted }} dangerouslySetInnerHTML={{ __html: inlineFormat(item.description) }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StatBubbles({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim()).map((line) => {
    const pipeIdx = line.indexOf("|");
    if (pipeIdx === -1) return { value: line.trim(), label: "" };
    return { value: line.slice(0, pipeIdx).trim(), label: line.slice(pipeIdx + 1).trim() };
  });

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <div key={i} className="flex flex-col items-center text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                boxShadow: `0 4px 14px ${color}30`,
              }}
            >
              <span className="text-xl font-extrabold text-white">{item.value}</span>
            </div>
            {item.label && (
              <p className="mt-2 text-xs font-medium" style={{ color: theme.colors.textMuted }} dangerouslySetInnerHTML={{ __html: inlineFormat(item.label) }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TagCloud({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim()).map((line) => {
    const pipeIdx = line.indexOf("|");
    if (pipeIdx === -1) return { term: line.trim(), weight: 2 };
    return { term: line.slice(0, pipeIdx).trim(), weight: Math.min(3, Math.max(1, parseInt(line.slice(pipeIdx + 1).trim()) || 2)) };
  });

  const sizeMap: Record<number, string> = { 1: "text-xs px-2.5 py-1", 2: "text-sm px-3 py-1.5", 3: "text-base px-4 py-2 font-bold" };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-1">
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <span
            key={i}
            className={`rounded-full ${sizeMap[item.weight] ?? sizeMap[2]}`}
            style={{
              backgroundColor: `${color}22`,
              color,
              border: `1px solid ${color}40`,
            }}
            dangerouslySetInnerHTML={{ __html: inlineFormat(item.term) }}
          />
        );
      })}
    </div>
  );
}

export function RoundedCards({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim()).map((line) => {
    const pipeIdx = line.indexOf("|");
    if (pipeIdx === -1) return { title: line.trim(), description: "" };
    return { title: line.slice(0, pipeIdx).trim(), description: line.slice(pipeIdx + 1).trim() };
  });

  return (
    <div className={`grid gap-3 ${items.length <= 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <div
            key={i}
            className={`rounded-3xl shadow-md ${items.length > 3 ? "p-3" : "p-5"}`}
            style={{
              background: `linear-gradient(145deg, ${color}18, ${color}08)`,
              border: `1px solid ${color}30`,
            }}
          >
            <MarkdownRenderer
              content={item.title}
              className={`${items.length > 3 ? "text-xs" : "text-sm"} font-bold leading-tight`}
              style={{ color: theme.colors.text }}
            />
            {item.description && (
              <MarkdownRenderer
                content={item.description}
                className={`mt-1.5 ${items.length > 3 ? "text-[10px]" : "text-xs"} leading-relaxed`}
                style={{ color: theme.colors.textMuted }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AccentList({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const pipeIdx = line.indexOf("|");
      if (pipeIdx === -1) return { title: line, description: "" };
      return {
        title: line.slice(0, pipeIdx).trim(),
        description: line.slice(pipeIdx + 1).trim(),
      };
    });

  // Use compact spacing when there are many items
  const compact = items.length > 3;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {items.map((item, i) => {
        const color = getPaletteColor(theme, i);
        return (
          <div
            key={i}
            className={`rounded-lg ${compact ? "px-3 py-1.5" : "px-4 py-2.5"}`}
            style={{
              backgroundColor: `${color}15`,
              borderLeft: `4px solid ${color}`,
            }}
          >
            <MarkdownRenderer
              content={item.title}
              className={`${compact ? "text-xs" : "text-sm"} font-bold`}
              style={{ color: theme.colors.text }}
            />
            {item.description && (
              <MarkdownRenderer
                content={item.description}
                className={`mt-0.5 ${compact ? "text-[10px]" : "text-xs"} leading-relaxed`}
                style={{ color: theme.colors.textMuted }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

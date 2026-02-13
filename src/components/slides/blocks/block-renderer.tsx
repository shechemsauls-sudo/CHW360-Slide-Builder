"use client";

import type { SlideTheme } from "~/lib/themes";

interface BlockRendererProps {
  content: string;
  theme: SlideTheme;
}

interface ParsedBlock {
  type: "text" | "block";
  content: string;
  blockType?: string;
  blockArg?: string;
}

/**
 * Parses content that may contain :::block directives and renders them
 * as styled components. Regular text passes through as-is.
 *
 * Syntax:
 *   :::block-type Optional Argument
 *   Content here
 *   :::
 */
export function BlockRenderer({ content, theme }: BlockRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return block.content ? (
            <div key={i} className="whitespace-pre-wrap">
              {block.content}
            </div>
          ) : null;
        }

        return (
          <div key={i} className="my-3">
            {renderBlock(block.blockType!, block.blockArg, block.content, theme)}
          </div>
        );
      })}
    </>
  );
}

function parseBlocks(content: string): ParsedBlock[] {
  const lines = content.split("\n");
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock = { type: "text", content: "" };
  let inBlock = false;
  let blockType = "";
  let blockArg = "";
  let blockContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Block opening: :::block-type optional arg
    const openMatch = trimmed.match(/^:::(\w[\w-]*)\s*(.*)$/);
    if (openMatch && !inBlock) {
      // Flush current text
      if (current.content.trim()) {
        blocks.push(current);
      }
      current = { type: "text", content: "" };
      inBlock = true;
      blockType = openMatch[1]!;
      blockArg = openMatch[2] ?? "";
      blockContent = [];
      continue;
    }

    // Block closing: :::
    if (trimmed === ":::" && inBlock) {
      blocks.push({
        type: "block",
        blockType,
        blockArg: blockArg.trim(),
        content: blockContent.join("\n").trim(),
      });
      inBlock = false;
      blockType = "";
      blockArg = "";
      blockContent = [];
      continue;
    }

    if (inBlock) {
      blockContent.push(line);
    } else {
      current.content += (current.content ? "\n" : "") + line;
    }
  }

  // Flush remaining
  if (inBlock) {
    // Unclosed block — treat as text
    current.content += `\n:::${blockType} ${blockArg}\n${blockContent.join("\n")}`;
  }
  if (current.content.trim()) {
    blocks.push(current);
  }

  return blocks;
}

function renderBlock(
  type: string,
  arg: string | undefined,
  content: string,
  theme: SlideTheme,
): React.ReactNode {
  switch (type) {
    case "info-box":
      return <InfoBox title={arg} content={content} theme={theme} />;
    case "key-stat":
      return <KeyStat args={arg} content={content} theme={theme} />;
    case "numbered-steps":
      return <NumberedSteps content={content} theme={theme} />;
    case "flow-diagram":
      return <FlowDiagram content={content} theme={theme} />;
    case "comparison-table":
      return <ComparisonTable content={content} theme={theme} />;
    case "icon-grid":
      return <IconGrid content={content} theme={theme} />;
    case "quote-block":
      return <QuoteBlock attribution={arg} content={content} theme={theme} />;
    case "checklist":
      return <Checklist content={content} theme={theme} />;
    case "timeline":
      return <Timeline content={content} theme={theme} />;
    case "highlight-box":
      return <HighlightBox content={content} theme={theme} />;
    default:
      return (
        <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.surface }}>
          <p className="text-xs opacity-60">[{type}]</p>
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        </div>
      );
  }
}

// ── Block Components ──────────────────────────────────────────────

function InfoBox({ title, content, theme }: { title?: string; content: string; theme: SlideTheme }) {
  return (
    <div
      className="rounded-lg border-l-4 p-4"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }}
    >
      {title && (
        <p className="mb-1.5 text-sm font-bold" style={{ color: theme.colors.accent }}>
          {title}
        </p>
      )}
      <p className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
        {content}
      </p>
    </div>
  );
}

function KeyStat({ args, content, theme }: { args?: string; content: string; theme: SlideTheme }) {
  // Args format: "95%" or "95% Completion Rate"
  const parts = (args ?? "").split(/\s+/);
  const number = parts[0] ?? "";
  const label = parts.slice(1).join(" ") || content;

  return (
    <div className="text-center py-2">
      <p className="text-4xl font-bold" style={{ color: theme.colors.accent }}>
        {number}
      </p>
      <p className="mt-1 text-sm" style={{ color: theme.colors.textMuted }}>
        {label}
      </p>
    </div>
  );
}

function NumberedSteps({ content, theme }: { content: string; theme: SlideTheme }) {
  const steps = content.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: theme.colors.accent, color: theme.colors.background }}
          >
            {i + 1}
          </div>
          <p className="pt-0.5 text-sm leading-relaxed" style={{ color: theme.colors.text }}>
            {step.replace(/^\d+[.)]\s*/, "")}
          </p>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram({ content, theme }: { content: string; theme: SlideTheme }) {
  // Items separated by -> or newlines
  const items = content.includes("->")
    ? content.split("->").map((s) => s.trim()).filter(Boolean)
    : content.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="rounded-lg px-4 py-2 text-center text-sm font-medium"
            style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
          >
            {item}
          </div>
          {i < items.length - 1 && (
            <span className="text-lg" style={{ color: theme.colors.accent }}>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ComparisonTable({ content, theme }: { content: string; theme: SlideTheme }) {
  const rows = content.split("\n").filter((l) => l.trim());
  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  // Split by | delimiter
  const headers = (headerRow ?? "").split("|").map((s) => s.trim()).filter(Boolean);
  const data = dataRows.map((r) => r.split("|").map((s) => s.trim()).filter(Boolean));

  return (
    <div className="overflow-hidden rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
      {headers.length > 0 && (
        <div className="flex" style={{ backgroundColor: theme.colors.accent }}>
          {headers.map((h, i) => (
            <div key={i} className="flex-1 px-4 py-2 text-center text-sm font-bold" style={{ color: theme.colors.background }}>
              {h}
            </div>
          ))}
        </div>
      )}
      {data.map((row, i) => (
        <div
          key={i}
          className="flex border-t"
          style={{ borderColor: `${theme.colors.text}15` }}
        >
          {row.map((cell, j) => (
            <div key={j} className="flex-1 px-4 py-2 text-center text-sm" style={{ color: theme.colors.text }}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function IconGrid({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());
  const cols = items.length <= 4 ? 2 : 3;

  return (
    <div className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-3 text-center"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div
            className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: `${theme.colors.accent}30`, color: theme.colors.accent }}
          >
            {item.charAt(0).toUpperCase()}
          </div>
          <p className="text-xs font-medium" style={{ color: theme.colors.text }}>
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function QuoteBlock({ attribution, content, theme }: { attribution?: string; content: string; theme: SlideTheme }) {
  return (
    <div className="border-l-4 py-2 pl-4" style={{ borderColor: theme.colors.accent }}>
      <p className="text-base italic leading-relaxed" style={{ color: theme.colors.text }}>
        &ldquo;{content}&rdquo;
      </p>
      {attribution && (
        <p className="mt-2 text-sm font-medium" style={{ color: theme.colors.textMuted }}>
          — {attribution}
        </p>
      )}
    </div>
  );
}

function Checklist({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2"
            style={{ borderColor: theme.colors.accent }}
          >
            <span className="text-xs" style={{ color: theme.colors.accent }}>
              ✓
            </span>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text }}>
            {item.replace(/^[-*]\s*/, "")}
          </p>
        </div>
      ))}
    </div>
  );
}

function Timeline({ content, theme }: { content: string; theme: SlideTheme }) {
  const items = content.split("\n").filter((l) => l.trim());

  return (
    <div className="flex items-start justify-between gap-1">
      {items.map((item, i) => {
        const [label, ...desc] = item.split(":");
        return (
          <div key={i} className="flex flex-1 flex-col items-center text-center">
            <div
              className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: theme.colors.accent, color: theme.colors.background }}
            >
              {i + 1}
            </div>
            <p className="text-xs font-bold" style={{ color: theme.colors.text }}>
              {label?.trim()}
            </p>
            {desc.length > 0 && (
              <p className="mt-0.5 text-[10px]" style={{ color: theme.colors.textMuted }}>
                {desc.join(":").trim()}
              </p>
            )}
            {i < items.length - 1 && (
              <div
                className="absolute mt-3 h-0.5 w-full"
                style={{ backgroundColor: `${theme.colors.accent}40` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function HighlightBox({ content, theme }: { content: string; theme: SlideTheme }) {
  return (
    <div
      className="rounded-lg px-5 py-3 text-center"
      style={{ backgroundColor: `${theme.colors.accent}20` }}
    >
      <p className="text-sm font-semibold" style={{ color: theme.colors.accent }}>
        {content}
      </p>
    </div>
  );
}

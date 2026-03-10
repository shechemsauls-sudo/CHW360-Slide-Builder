"use client";

import type { SlideTheme } from "~/lib/themes";
import { MarkdownRenderer } from "../markdown-renderer";
import {
  InfoBox,
  KeyStat,
  NumberedSteps,
  FlowDiagram,
  CycleDiagram,
  ComparisonTable,
  IconGrid,
  QuoteBlock,
  Checklist,
  Timeline,
  HighlightBox,
  CardGrid,
  ChevronFlow,
  AccentList,
  PillList,
  StatBubbles,
  TagCloud,
  RoundedCards,
} from "./text-blocks";
import {
  BarChartBlock,
  PieChartBlock,
  LineChartBlock,
  AreaChartBlock,
  RadarChartBlock,
} from "./chart-blocks";
import { ProgressBars, MetricRow } from "./data-blocks";

interface BlockRendererProps {
  content: string;
  theme: SlideTheme;
  layout: string;
  dense?: boolean;
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
export function BlockRenderer({ content, theme, layout, dense }: BlockRendererProps) {
  const blocks = parseBlocks(content);
  const spacing = dense ? "my-1.5" : "my-3";

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return block.content ? (
            <MarkdownRenderer
              key={i}
              content={block.content}
              className="space-y-2 leading-relaxed"
              style={{ color: theme.colors.textMuted }}
            />
          ) : null;
        }

        return (
          <div key={i} className={spacing}>
            {renderBlock(block.blockType!, block.blockArg, block.content, theme, layout)}
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
  layout: string,
): React.ReactNode {
  switch (type) {
    // ── Text blocks ──
    case "info-box":
      return <InfoBox title={arg} content={content} theme={theme} />;
    case "key-stat":
      return <KeyStat args={arg} content={content} theme={theme} />;
    case "numbered-steps":
      return <NumberedSteps content={content} theme={theme} />;
    case "flow-diagram": {
      // Auto-detect cycles: if last item matches the first, render as cycle
      const flowItems = content.includes("->")
        ? content.split("->").map((s) => s.trim()).filter(Boolean)
        : content.split("\n").map((s) => s.trim()).filter(Boolean);
      if (flowItems.length >= 3 && flowItems[0]!.toLowerCase() === flowItems[flowItems.length - 1]!.toLowerCase()) {
        return <CycleDiagram content={flowItems.slice(0, -1).join(" -> ")} theme={theme} />;
      }
      return <FlowDiagram content={content} theme={theme} />;
    }
    case "cycle":
      return <CycleDiagram content={content} theme={theme} />;
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
    case "card-grid":
      return <CardGrid content={content} theme={theme} />;
    case "chevron-flow":
      return <ChevronFlow content={content} theme={theme} />;
    case "accent-list":
      return <AccentList content={content} theme={theme} />;
    case "pill-list":
      return <PillList content={content} theme={theme} />;
    case "stat-bubbles":
      return <StatBubbles content={content} theme={theme} />;
    case "tag-cloud":
      return <TagCloud content={content} theme={theme} />;
    case "rounded-cards":
      return <RoundedCards content={content} theme={theme} />;

    // ── Chart blocks (Recharts) ──
    case "bar-chart":
      return <BarChartBlock arg={arg} content={content} theme={theme} layout={layout} />;
    case "pie-chart":
      return <PieChartBlock arg={arg} content={content} theme={theme} layout={layout} />;
    case "line-chart":
      return <LineChartBlock arg={arg} content={content} theme={theme} layout={layout} />;
    case "area-chart":
      return <AreaChartBlock arg={arg} content={content} theme={theme} layout={layout} />;
    case "radar-chart":
      return <RadarChartBlock arg={arg} content={content} theme={theme} layout={layout} />;

    // ── Data blocks (CSS-only) ──
    case "progress-bars":
      return <ProgressBars arg={arg} content={content} theme={theme} />;
    case "metric-row":
      return <MetricRow arg={arg} content={content} theme={theme} />;

    default:
      return (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: `${theme.colors.accent}10`, border: `1px solid ${theme.colors.accent}25` }}
        >
          <p className="text-xs opacity-60">[{type}]</p>
          <MarkdownRenderer
            content={content}
            className="text-sm leading-relaxed"
            style={{ color: theme.colors.textMuted }}
          />
        </div>
      );
  }
}

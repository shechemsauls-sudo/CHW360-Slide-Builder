"use client";

import type { SlideTheme } from "~/lib/themes";
import {
  InfoBox,
  KeyStat,
  NumberedSteps,
  FlowDiagram,
  ComparisonTable,
  IconGrid,
  QuoteBlock,
  Checklist,
  Timeline,
  HighlightBox,
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
export function BlockRenderer({ content, theme, layout }: BlockRendererProps) {
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
          <div key={i} className="my-4">
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
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        </div>
      );
  }
}

"use client";

import type { SlideData } from "~/lib/ai/types";
import type { SlideTheme } from "~/lib/themes";
import { MarkdownRenderer } from "./markdown-renderer";
import { BlockRenderer } from "./blocks/block-renderer";

interface SlideRendererProps {
  slide: SlideData;
  theme: SlideTheme;
  className?: string;
  /** Scale for presentation vs preview (1 = full size) */
  scale?: number;
}

/**
 * Renders a single slide with proper 16:9 aspect ratio,
 * theme-aware colors/fonts, and layout positioning.
 */
export function SlideRenderer({ slide, theme, className, scale = 1 }: SlideRendererProps) {
  const hasBlocks = slide.body.includes(":::");

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ""}`}
      style={{
        aspectRatio: "16 / 9",
        backgroundColor: theme.colors.background,
        fontFamily: theme.typography.bodyFont,
        color: theme.colors.text,
      }}
    >
      {/* Decorative accent bar */}
      <div
        className="absolute left-0 top-0 h-1 w-full"
        style={{ backgroundColor: theme.colors.accent }}
      />

      {/* Layout container */}
      <div className="flex h-full w-full">
        {renderLayout(slide, theme, hasBlocks, scale)}
      </div>
    </div>
  );
}

function renderLayout(
  slide: SlideData,
  theme: SlideTheme,
  hasBlocks: boolean,
  scale: number,
): React.ReactNode {
  switch (slide.layout) {
    case "centered":
      return <CenteredLayout slide={slide} theme={theme} hasBlocks={hasBlocks} scale={scale} />;
    case "split-left":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="left" scale={scale} />;
    case "split-right":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="right" scale={scale} />;
    case "two-column":
      return <TwoColumnLayout slide={slide} theme={theme} scale={scale} />;
    default:
      return <FullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} scale={scale} />;
  }
}

// ── Slide Type Renderers ──────────────────────────────────────

function SlideTitle({ slide, theme, scale }: { slide: SlideData; theme: SlideTheme; scale: number }) {
  const isTitle = slide.type === "title";
  const isSection = slide.type === "section";
  const isClosing = slide.type === "closing";

  const titleSize = isTitle
    ? `text-${scale >= 0.5 ? "3xl" : "xl"}`
    : isSection
      ? `text-${scale >= 0.5 ? "2xl" : "lg"}`
      : `text-${scale >= 0.5 ? "xl" : "base"}`;

  return (
    <h2
      className={`${titleSize} font-bold leading-tight`}
      style={{
        fontFamily: theme.typography.headingFont,
        fontWeight: theme.typography.headingWeight,
        color: theme.colors.text,
      }}
    >
      {slide.title}
      {(isTitle || isClosing) && (
        <div
          className="mt-2 h-1 w-16 rounded"
          style={{ backgroundColor: theme.colors.accent }}
        />
      )}
    </h2>
  );
}

function SlideBody({
  slide,
  theme,
  hasBlocks,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
}) {
  if (hasBlocks) {
    return <BlockRenderer content={slide.body} theme={theme} />;
  }

  return (
    <MarkdownRenderer
      content={slide.body}
      className="leading-relaxed"
      style={{ color: theme.colors.textMuted }}
    />
  );
}

// ── Layout Components ──────────────────────────────────────────

function FullLayout({
  slide,
  theme,
  hasBlocks,
  scale,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  scale: number;
}) {
  const p = scale >= 0.5 ? "p-8" : "p-4";
  const textSize = scale >= 0.5 ? "text-sm" : "text-[10px]";
  const isActivity = slide.type === "activity";

  return (
    <div className={`flex w-full flex-col justify-center ${p}`}>
      {isActivity && (
        <div
          className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
        >
          Activity
        </div>
      )}
      <SlideTitle slide={slide} theme={theme} scale={scale} />
      <div className={`mt-4 ${textSize} overflow-auto`}>
        <SlideBody slide={slide} theme={theme} hasBlocks={hasBlocks} />
      </div>
    </div>
  );
}

function CenteredLayout({
  slide,
  theme,
  hasBlocks,
  scale,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  scale: number;
}) {
  const p = scale >= 0.5 ? "p-8" : "p-4";
  const textSize = scale >= 0.5 ? "text-sm" : "text-[10px]";
  const isQuote = slide.type === "quote";

  return (
    <div className={`flex w-full flex-col items-center justify-center text-center ${p}`}>
      {isQuote && (
        <span className="mb-2 text-4xl" style={{ color: theme.colors.accent }}>
          &ldquo;
        </span>
      )}
      <SlideTitle slide={slide} theme={theme} scale={scale} />
      <div className={`mt-4 max-w-[80%] ${textSize} overflow-auto`}>
        <SlideBody slide={slide} theme={theme} hasBlocks={hasBlocks} />
      </div>
    </div>
  );
}

function SplitLayout({
  slide,
  theme,
  hasBlocks,
  imagePosition,
  scale,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  imagePosition: "left" | "right";
  scale: number;
}) {
  const p = scale >= 0.5 ? "p-8" : "p-4";
  const textSize = scale >= 0.5 ? "text-sm" : "text-[10px]";

  const imagePlaceholder = (
    <div
      className="flex h-full items-center justify-center"
      style={{ backgroundColor: theme.colors.surface }}
    >
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="text-center">
          <div className="text-3xl opacity-20">🖼</div>
          <p className="mt-1 text-xs opacity-30">Image</p>
        </div>
      )}
    </div>
  );

  const contentSide = (
    <div className={`flex flex-col justify-center ${p} overflow-auto`}>
      <SlideTitle slide={slide} theme={theme} scale={scale} />
      <div className={`mt-4 ${textSize}`}>
        <SlideBody slide={slide} theme={theme} hasBlocks={hasBlocks} />
      </div>
    </div>
  );

  return (
    <>
      <div className="w-1/2">{imagePosition === "left" ? imagePlaceholder : contentSide}</div>
      <div className="w-1/2">{imagePosition === "left" ? contentSide : imagePlaceholder}</div>
    </>
  );
}

function TwoColumnLayout({
  slide,
  theme,
  scale,
}: {
  slide: SlideData;
  theme: SlideTheme;
  scale: number;
}) {
  const p = scale >= 0.5 ? "p-8" : "p-4";
  const textSize = scale >= 0.5 ? "text-sm" : "text-[10px]";

  // Split body by --- or double newline for two columns
  const parts = slide.body.split(/\n---\n|\n\n\n/);
  const left = parts[0] ?? "";
  const right = parts[1] ?? "";

  return (
    <div className={`flex w-full flex-col ${p}`}>
      <SlideTitle slide={slide} theme={theme} scale={scale} />
      <div className={`mt-4 flex flex-1 gap-4 ${textSize} overflow-auto`}>
        <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: theme.colors.surface }}>
          <MarkdownRenderer content={left} style={{ color: theme.colors.text }} />
        </div>
        <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: theme.colors.surface }}>
          <MarkdownRenderer content={right} style={{ color: theme.colors.text }} />
        </div>
      </div>
    </div>
  );
}

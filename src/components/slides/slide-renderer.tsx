"use client";

import { useRef, useState, useEffect } from "react";
import type { SlideData } from "~/lib/ai/types";
import type { SlideTheme } from "~/lib/themes";
import { MarkdownRenderer } from "./markdown-renderer";
import { BlockRenderer } from "./blocks/block-renderer";

/** Fixed internal slide resolution — all content is laid out at this size */
const SLIDE_W = 960;
const SLIDE_H = 540;

interface SlideRendererProps {
  slide: SlideData;
  theme: SlideTheme;
  className?: string;
}

/**
 * Renders a single slide at a fixed 960×540 internal resolution,
 * then CSS-scales to fit the container. This ensures identical
 * spatial rendering in preview, deck viewer, and presentation mode.
 */
export function SlideRenderer({ slide, theme, className }: SlideRendererProps) {
  const hasBlocks = slide.body.includes(":::");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setScale(w / SLIDE_W);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg ${className ?? ""}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
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
          {renderLayout(slide, theme, hasBlocks)}
        </div>
      </div>
    </div>
  );
}

function renderLayout(
  slide: SlideData,
  theme: SlideTheme,
  hasBlocks: boolean,
): React.ReactNode {
  switch (slide.layout) {
    case "centered":
      return <CenteredLayout slide={slide} theme={theme} hasBlocks={hasBlocks} />;
    case "split-left":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="left" />;
    case "split-right":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="right" />;
    case "two-column":
      return <TwoColumnLayout slide={slide} theme={theme} />;
    default:
      return <FullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} />;
  }
}

// ── Slide Type Renderers ──────────────────────────────────────

function SlideTitle({ slide, theme }: { slide: SlideData; theme: SlideTheme }) {
  const isTitle = slide.type === "title";
  const isSection = slide.type === "section";
  const isClosing = slide.type === "closing";

  const titleSize = isTitle
    ? "text-4xl"
    : isSection
      ? "text-3xl"
      : "text-2xl";

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
    return <BlockRenderer content={slide.body} theme={theme} layout={slide.layout} />;
  }

  return (
    <MarkdownRenderer
      content={slide.body}
      className="leading-relaxed"
      style={{ color: theme.colors.textMuted }}
    />
  );
}

// ── Footer Detection ──────────────────────────────────────────

const FOOTER_PATTERN = /^(©|\(c\)|copyright|educational use only|not medical advice|for educational purposes)/i;
const PIPE_COPYRIGHT_PATTERN = /\|.*©/;

function extractFooter(body: string): { bodyContent: string; footerText: string | null } {
  const lines = body.trimEnd().split("\n");
  const footerLines: string[] = [];

  // Check last 1-3 lines for footer patterns
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
    const line = lines[i]!.trim();
    if (line && (FOOTER_PATTERN.test(line) || PIPE_COPYRIGHT_PATTERN.test(line))) {
      footerLines.unshift(line);
    } else {
      break;
    }
  }

  if (footerLines.length === 0) return { bodyContent: body, footerText: null };

  const bodyContent = lines.slice(0, lines.length - footerLines.length).join("\n");
  const footerText = footerLines.join("\n");
  return { bodyContent, footerText };
}

function SlideFooter({ text, theme }: { text: string; theme: SlideTheme }) {
  return (
    <div
      className="mt-auto pt-2 text-[10px] leading-tight opacity-50"
      style={{ color: theme.colors.textMuted }}
    >
      {text}
    </div>
  );
}

// ── Layout Components ──────────────────────────────────────────

function FullLayout({
  slide,
  theme,
  hasBlocks,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
}) {
  const isActivity = slide.type === "activity";
  const { bodyContent, footerText } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };

  return (
    <div className="flex h-full w-full flex-col p-10">
      <div className="flex flex-1 flex-col justify-center">
        {isActivity && (
          <div
            className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
          >
            Activity
          </div>
        )}
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-5 text-base leading-relaxed">
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
        </div>
      </div>
      {footerText && <SlideFooter text={footerText} theme={theme} />}
    </div>
  );
}

function CenteredLayout({
  slide,
  theme,
  hasBlocks,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
}) {
  const isQuote = slide.type === "quote";
  const { bodyContent, footerText } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };

  return (
    <div className="flex h-full w-full flex-col items-center text-center p-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        {isQuote && (
          <span className="mb-2 text-5xl" style={{ color: theme.colors.accent }}>
            &ldquo;
          </span>
        )}
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-5 max-w-[80%] text-base leading-relaxed">
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
        </div>
      </div>
      {footerText && <SlideFooter text={footerText} theme={theme} />}
    </div>
  );
}

function SplitLayout({
  slide,
  theme,
  hasBlocks,
  imagePosition,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  imagePosition: "left" | "right";
}) {
  const imagePlaceholder = (
    <div
      className="flex h-full items-center justify-center"
      style={{ backgroundColor: theme.colors.surface }}
    >
      {slide.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
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

  const { bodyContent, footerText } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };

  const contentSide = (
    <div className="flex h-full flex-col p-10 overflow-auto">
      <div className="flex flex-1 flex-col justify-center">
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-5 text-base leading-relaxed">
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
        </div>
      </div>
      {footerText && <SlideFooter text={footerText} theme={theme} />}
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
}: {
  slide: SlideData;
  theme: SlideTheme;
}) {
  const { bodyContent, footerText } = extractFooter(slide.body);

  // Split body by --- or double newline for two columns
  const parts = bodyContent.split(/\n---\n|\n\n\n/);
  const left = parts[0] ?? "";
  const right = parts[1] ?? "";

  return (
    <div className="flex h-full w-full flex-col p-10">
      <div className="flex flex-1 flex-col justify-center">
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-5 flex flex-1 gap-4 text-base leading-relaxed">
          <div className="flex-1 rounded-lg p-4" style={{ backgroundColor: theme.colors.surface }}>
            <MarkdownRenderer content={left} style={{ color: theme.colors.text }} />
          </div>
          <div className="flex-1 rounded-lg p-4" style={{ backgroundColor: theme.colors.surface }}>
            <MarkdownRenderer content={right} style={{ color: theme.colors.text }} />
          </div>
        </div>
      </div>
      {footerText && <SlideFooter text={footerText} theme={theme} />}
    </div>
  );
}

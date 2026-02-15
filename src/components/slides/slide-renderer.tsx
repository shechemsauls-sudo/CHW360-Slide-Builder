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
          background: theme.gradient?.background ?? theme.colors.background,
          fontFamily: theme.typography.bodyFont,
          color: theme.colors.text,
        }}
      >
        {/* Gradient accent bar — wider, gradient-filled */}
        <div
          className="absolute left-0 top-0 h-1.5 w-full"
          style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
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
    case "image-full":
      return <ImageFullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} />;
    case "image-top":
      return <ImageTopLayout slide={slide} theme={theme} hasBlocks={hasBlocks} />;
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
    ? "text-5xl tracking-tight"
    : isSection
      ? "text-4xl tracking-tight"
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
          className="mt-3 h-1 w-24 rounded-full"
          style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
        />
      )}
      {isSection && (
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-0.5 w-12 rounded-full"
            style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
          />
          <div
            className="h-0.5 w-6 rounded-full opacity-40"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>
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
      className="space-y-2 leading-relaxed"
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
      className="mt-auto border-t pt-2 text-[10px] leading-tight opacity-40"
      style={{ color: theme.colors.textMuted, borderColor: `${theme.colors.text}10` }}
    >
      {text}
    </div>
  );
}

// ── Image Placeholder with shimmer ───────────────────────────

function ImagePlaceholder({ theme }: { theme: SlideTheme }) {
  return (
    <div
      className="relative flex h-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.colors.surface }}
    >
      {/* Shimmer animation */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme.colors.text}08 50%, transparent 100%)`,
          animation: "shimmer 2s infinite",
        }}
      />
      <div className="relative text-center">
        <div className="mx-auto mb-1 h-8 w-8 rounded-lg opacity-15" style={{ backgroundColor: theme.colors.text }}>
          <svg className="h-8 w-8 p-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <p className="text-[10px] opacity-20">Image</p>
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
}

// ── Surface Card wrapper ─────────────────────────────────────

function SurfaceCard({ theme, children, className }: { theme: SlideTheme; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border p-4 ${className ?? ""}`}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: `${theme.colors.text}08`,
        boxShadow: `0 1px 3px ${theme.colors.text}06`,
      }}
    >
      {children}
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
    <div className="flex h-full w-full flex-col p-12">
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
    <div className="flex h-full w-full flex-col items-center text-center p-12">
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
  const imagePanel = slide.imageUrl ? (
    <div className="h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.imageUrl}
        alt={slide.imagePrompt ?? "Slide image"}
        className="h-full w-full object-cover"
      />
    </div>
  ) : (
    <ImagePlaceholder theme={theme} />
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
      <div className="w-1/2">{imagePosition === "left" ? imagePanel : contentSide}</div>
      <div className="w-1/2">{imagePosition === "left" ? contentSide : imagePanel}</div>
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
    <div className="flex h-full w-full flex-col p-12">
      <div className="flex flex-1 flex-col justify-center">
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-5 flex flex-1 gap-4 text-base leading-relaxed">
          <SurfaceCard theme={theme} className="flex-1">
            <MarkdownRenderer content={left} style={{ color: theme.colors.text }} />
          </SurfaceCard>
          <SurfaceCard theme={theme} className="flex-1">
            <MarkdownRenderer content={right} style={{ color: theme.colors.text }} />
          </SurfaceCard>
        </div>
      </div>
      {footerText && <SlideFooter text={footerText} theme={theme} />}
    </div>
  );
}

function ImageFullLayout({
  slide,
  theme,
  hasBlocks,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
}) {
  const { bodyContent, footerText } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };

  return (
    <div className="relative h-full w-full">
      {/* Background image or placeholder */}
      {slide.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={slide.imageUrl}
          alt={slide.imagePrompt ?? "Slide image"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          <ImagePlaceholder theme={theme} />
        </div>
      )}

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content positioned at bottom */}
      <div className="relative flex h-full flex-col justify-end p-12">
        <h2
          className="text-5xl font-bold leading-tight tracking-tight text-white"
          style={{
            fontFamily: theme.typography.headingFont,
            fontWeight: theme.typography.headingWeight,
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {slide.title}
          <div
            className="mt-3 h-1 w-24 rounded-full"
            style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
          />
        </h2>
        {bodyContent.trim() && (
          <div className="mt-4 max-w-[70%] text-base leading-relaxed text-white/80">
            <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
          </div>
        )}
        {footerText && (
          <div className="mt-auto pt-2 text-[10px] leading-tight text-white/30">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageTopLayout({
  slide,
  theme,
  hasBlocks,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
}) {
  const { bodyContent, footerText } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Image area — top 40% */}
      <div className="relative h-[40%] w-full shrink-0">
        {slide.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slide.imageUrl}
            alt={slide.imagePrompt ?? "Slide image"}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlaceholder theme={theme} />
        )}
      </div>

      {/* Content area — bottom 60% */}
      <div className="flex flex-1 flex-col p-8">
        <SlideTitle slide={slide} theme={theme} />
        <div className="mt-3 flex-1 text-base leading-relaxed">
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
        </div>
        {footerText && <SlideFooter text={footerText} theme={theme} />}
      </div>
    </div>
  );
}

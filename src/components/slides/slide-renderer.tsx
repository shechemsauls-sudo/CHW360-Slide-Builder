"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback, type ReactNode } from "react";
import type { SlideData } from "~/lib/ai/types";
import type { SlideTheme } from "~/lib/themes";
import { MarkdownRenderer } from "./markdown-renderer";
import { BlockRenderer } from "./blocks/block-renderer";

/** Fixed internal slide resolution — all content is laid out at this size */
const SLIDE_W = 960;
const SLIDE_H = 540;

/** Count internal items within block directives for density scoring */
function countBlockItems(body: string): number {
  let score = 0;
  const blockRegex = /:::(\w[\w-]*)\s*[^\n]*\n([\s\S]*?):::/g;
  let match;
  while ((match = blockRegex.exec(body)) !== null) {
    const type = match[1]!;
    const content = match[2]!;
    const lines = content.split("\n").filter((l) => l.trim()).length;
    // Weight items by block type — these take more vertical space per item
    if (type === "checklist" || type === "numbered-steps" || type === "accent-list") {
      score += lines * 2;
    } else if (type === "timeline" || type === "card-grid" || type === "icon-grid") {
      score += lines * 2.5;
    } else if (type === "info-box" || type === "highlight-box") {
      score += lines + 4; // box chrome adds padding
    } else {
      score += lines;
    }
  }
  return score;
}

/** Estimate content density and return a smaller text class for dense slides */
function getContentScale(body: string, layout?: string): string {
  const lineCount = body.split("\n").filter((l) => l.trim()).length;
  const blockCount = (body.match(/:::/g) ?? []).length / 2;
  const blockItemScore = countBlockItems(body);
  const density = lineCount + blockCount * 3 + blockItemScore;

  // Split layouts have half the width — much more aggressive scaling
  const isCompact = layout === "split-left" || layout === "split-right";
  if (isCompact) {
    if (density > 12) return "text-xs";
    if (density > 6) return "text-sm";
    return "text-sm";
  }

  if (density > 22) return "text-xs";
  if (density > 12) return "text-sm";
  return "text-base";
}

/** Check if content is dense enough to need compact layout adjustments */
function isDenseContent(body: string): boolean {
  const lineCount = body.split("\n").filter((l) => l.trim()).length;
  const blockCount = (body.match(/:::/g) ?? []).length / 2;
  const blockItemScore = countBlockItems(body);
  return lineCount + blockCount * 3 + blockItemScore > 7;
}

/** Safety-net wrapper: shrinks content via CSS scale if it overflows its container.
 *  Measures at natural width (no width compensation) to avoid oscillation loops.
 *  When content fits, applies flex centering for balanced vertical placement. */
function ContentFitter({ children, className }: { children: ReactNode; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const stableRef = useRef(1);

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const available = outer.clientHeight;
    if (available <= 0) return;

    // Temporarily reset to natural layout for accurate measurement
    const prevTransform = inner.style.transform;
    const prevWidth = inner.style.width;
    const prevOrigin = inner.style.transformOrigin;
    inner.style.transform = "none";
    inner.style.width = "100%";
    inner.style.transformOrigin = "";

    const needed = inner.scrollHeight;

    // Restore
    inner.style.transform = prevTransform;
    inner.style.width = prevWidth;
    inner.style.transformOrigin = prevOrigin;

    let target: number;
    if (needed > available) {
      // Content overflows — scale DOWN to fit
      const raw = available / needed;
      const snapped = Math.floor(raw * 20) / 20;
      target = Math.max(0.4, snapped);
    } else if (needed > 0) {
      // Content fits — gently scale up ONLY if there's significant spare room.
      // This fills dead space on sparse slides without overflowing dense ones.
      const ratio = available / needed;
      if (ratio > 1.3) {
        // Lots of spare room (content uses <77% of space) — scale up to fill ~85%
        const upscale = Math.min(ratio * 0.85, 1.2);
        target = upscale;
      } else {
        // Content already fills most of the space — just center it, don't scale
        target = 1;
      }
    } else {
      target = 1;
    }

    // Snap to 0.05 increments, only update if meaningfully different
    const snapped = Math.round(target * 20) / 20;
    if (Math.abs(snapped - stableRef.current) > 0.02) {
      stableRef.current = snapped;
      setScale(snapped);
    }
  }, []);

  // Measure synchronously before first paint to prevent visible layout shift
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // ResizeObserver handles any later layout changes (container resize, dynamic content)
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div ref={outerRef} className={`overflow-hidden ${className ?? ""}`} style={{ flex: "1 1 0%", minHeight: 0 }}>
      <div
        ref={innerRef}
        style={
          scale !== 1
            ? {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: `${100 / scale}%`,
              }
            : { minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }
        }
      >
        {children}
      </div>
    </div>
  );
}

interface SlideRendererProps {
  slide: SlideData;
  theme: SlideTheme;
  className?: string;
  footerText?: string;
}

/**
 * Renders a single slide at a fixed 960×540 internal resolution,
 * then CSS-scales to fit the container. This ensures identical
 * spatial rendering in preview, deck viewer, and presentation mode.
 */
export function SlideRenderer({ slide, theme, className, footerText }: SlideRendererProps) {
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
          {renderLayout(slide, theme, hasBlocks, footerText)}
        </div>
      </div>
    </div>
  );
}

function renderLayout(
  slide: SlideData,
  theme: SlideTheme,
  hasBlocks: boolean,
  footerText?: string,
): React.ReactNode {
  switch (slide.layout) {
    case "split-left":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="left" footerText={footerText} />;
    case "split-right":
      return <SplitLayout slide={slide} theme={theme} hasBlocks={hasBlocks} imagePosition="right" footerText={footerText} />;
    case "two-column":
      return <TwoColumnLayout slide={slide} theme={theme} footerText={footerText} />;
    case "image-full":
      return <ImageFullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} footerText={footerText} />;
    case "image-top":
      return <ImageTopLayout slide={slide} theme={theme} hasBlocks={hasBlocks} footerText={footerText} />;
    case "centered": // Legacy — map to full layout for backward compat
    default:
      return <FullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} footerText={footerText} />;
  }
}

// ── Slide Type Renderers ──────────────────────────────────────

function SlideTitle({ slide, theme }: { slide: SlideData; theme: SlideTheme }) {
  const isTitle = slide.type === "title";
  const isSection = slide.type === "section";
  const isClosing = slide.type === "closing";
  const isReferences = slide.type === "references";

  const titleSize = isTitle
    ? "text-5xl tracking-tight"
    : isSection
      ? "text-4xl tracking-tight"
      : isReferences
        ? "text-xl"
        : "text-2xl";

  return (
    <h2
      className={`${titleSize} font-bold leading-tight`}
      style={{
        fontFamily: theme.typography.headingFont,
        fontWeight: theme.typography.headingWeight,
        color: theme.colors.text,
        textWrap: "balance",
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
  dense,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  dense?: boolean;
}) {
  if (hasBlocks) {
    return <BlockRenderer content={slide.body} theme={theme} layout={slide.layout} dense={dense} />;
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

/** Split body into two columns on --- separator, but only outside ::: block fences */
function splitTwoColumns(body: string): { left: string; right: string; hasSplit: boolean } {
  const lines = body.split("\n");
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();
    if (trimmed.startsWith(":::") && trimmed.length > 3) {
      depth++;
    } else if (trimmed === ":::") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && (trimmed === "---" || trimmed === "")) {
      // Check for --- at top level or triple newline
      if (trimmed === "---") {
        const left = lines.slice(0, i).join("\n");
        const right = lines.slice(i + 1).join("\n");
        if (right.trim().length > 0) {
          return { left, right, hasSplit: true };
        }
      }
    }
  }
  return { left: body, right: "", hasSplit: false };
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
  footerText,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  footerText?: string;
}) {
  const isActivity = slide.type === "activity";
  const isReferences = slide.type === "references";
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);
  const contentScale = isReferences ? "text-[11px]" : getContentScale(slide.body);

  const dense = isDenseContent(slide.body) || isReferences;

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden ${isReferences ? "p-8" : "p-12"}`}>
      <div className={`flex flex-1 flex-col ${isReferences ? "justify-start" : "justify-center"} min-h-0`}>
        {isActivity && (
          <div
            className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shrink-0"
            style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
          >
            Activity
          </div>
        )}
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`${dense ? "mt-2" : "mt-5"} ${contentScale} ${isReferences ? "leading-snug" : "leading-relaxed"}`}>
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} dense={dense} />
        </ContentFitter>
      </div>
      {resolvedFooter && <SlideFooter text={resolvedFooter} theme={theme} />}
    </div>
  );
}

function SplitLayout({
  slide,
  theme,
  hasBlocks,
  imagePosition,
  footerText,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  imagePosition: "left" | "right";
  footerText?: string;
}) {
  const focalStyle = slide.imageFocalPoint
    ? { objectPosition: `${slide.imageFocalPoint.x}% ${slide.imageFocalPoint.y}%` }
    : undefined;

  const imagePanel = slide.imageUrl ? (
    <div className="h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.imageUrl}
        alt={slide.imagePrompt ?? "Slide image"}
        className="h-full w-full object-cover"
        style={focalStyle}
      />
    </div>
  ) : (
    <ImagePlaceholder theme={theme} />
  );

  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);

  const dense = isDenseContent(slide.body);
  const contentScale = getContentScale(slide.body, slide.layout);

  const contentSide = (
    <div className={`flex h-full flex-col overflow-hidden ${dense ? "p-6" : "p-10"}`}>
      <div className="flex flex-1 flex-col justify-center min-h-0">
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`${dense ? "mt-3" : "mt-5"} ${contentScale} leading-relaxed`}>
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} dense={dense} />
        </ContentFitter>
      </div>
      {resolvedFooter && <SlideFooter text={resolvedFooter} theme={theme} />}
    </div>
  );

  return (
    <>
      <div className="w-1/2">{imagePosition === "left" ? imagePanel : contentSide}</div>
      <div className="w-1/2">{imagePosition === "left" ? contentSide : imagePanel}</div>
    </>
  );
}

function TwoColumnContent({ content, theme, layout }: { content: string; theme: SlideTheme; layout: string }) {
  if (content.includes(":::")) {
    return <BlockRenderer content={content} theme={theme} layout={layout} />;
  }
  return <MarkdownRenderer content={content} style={{ color: theme.colors.text }} />;
}

function TwoColumnLayout({
  slide,
  theme,
  footerText,
}: {
  slide: SlideData;
  theme: SlideTheme;
  footerText?: string;
}) {
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);
  const contentScale = getContentScale(slide.body);

  // Split body by --- or triple newline for two columns, respecting ::: block fences
  const { left, right, hasSplit } = splitTwoColumns(bodyContent);

  const dense = isDenseContent(slide.body);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-12">
      <div className="flex flex-1 flex-col justify-center min-h-0">
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`${dense ? "mt-3" : "mt-5"} ${contentScale} leading-relaxed`}>
          {hasSplit ? (
            <div className="flex gap-4">
              <SurfaceCard theme={theme} className="flex-1 overflow-hidden">
                <TwoColumnContent content={left} theme={theme} layout={slide.layout} />
              </SurfaceCard>
              <SurfaceCard theme={theme} className="flex-1 overflow-hidden">
                <TwoColumnContent content={right} theme={theme} layout={slide.layout} />
              </SurfaceCard>
            </div>
          ) : (
            <TwoColumnContent content={bodyContent} theme={theme} layout={slide.layout} />
          )}
        </ContentFitter>
      </div>
      {resolvedFooter && <SlideFooter text={resolvedFooter} theme={theme} />}
    </div>
  );
}

function ImageFullLayout({
  slide,
  theme,
  hasBlocks,
  footerText,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  footerText?: string;
}) {
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);

  // Override theme colors for white-on-dark readability inside the frosted card
  const imageFullTheme: SlideTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: "#FFFFFF",
      secondary: "rgba(255,255,255,0.8)",
      text: "#FFFFFF",
      textMuted: "rgba(255,255,255,0.75)",
      accent: "#FFFFFF",
      surface: "rgba(255,255,255,0.1)",
      background: "transparent",
    },
    palette: ["#FFFFFF", "rgba(255,255,255,0.85)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.55)"],
  };

  return (
    <div className="relative h-full w-full">
      {/* Background image or placeholder */}
      {slide.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={slide.imageUrl}
          alt={slide.imagePrompt ?? "Slide image"}
          className="absolute inset-0 h-full w-full object-cover"
          style={slide.imageFocalPoint ? { objectPosition: `${slide.imageFocalPoint.x}% ${slide.imageFocalPoint.y}%` } : undefined}
        />
      ) : (
        <div className="absolute inset-0">
          <ImagePlaceholder theme={theme} />
        </div>
      )}

      {/* Softened gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

      {/* Content positioned at bottom with frosted-glass card */}
      <div className="relative flex h-full flex-col justify-end overflow-hidden p-10">
        <div className="flex max-h-full flex-col rounded-xl bg-black/60 p-8 ring-1 ring-white/10 backdrop-blur-md">
          <h2
            className={`shrink-0 ${slide.type === "title" ? "text-5xl" : slide.type === "section" ? "text-4xl" : "text-2xl"} font-bold leading-tight tracking-tight text-white`}
            style={{
              fontFamily: theme.typography.headingFont,
              fontWeight: theme.typography.headingWeight,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              textWrap: "balance",
            }}
          >
            {slide.title}
            {(slide.type === "title" || slide.type === "closing") && (
              <div
                className="mt-3 h-1 w-24 rounded-full"
                style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
              />
            )}
            {slide.type === "section" && (
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
          {bodyContent.trim() && (
            <ContentFitter className="mt-4 max-w-[85%] text-base leading-relaxed text-white/85">
              <SlideBody slide={bodySlide} theme={imageFullTheme} hasBlocks={hasBlocks} />
            </ContentFitter>
          )}
          {resolvedFooter && (
            <div className="shrink-0 mt-4 pt-2 text-[10px] leading-tight text-white/40">
              {resolvedFooter}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageTopLayout({
  slide,
  theme,
  hasBlocks,
  footerText,
}: {
  slide: SlideData;
  theme: SlideTheme;
  hasBlocks: boolean;
  footerText?: string;
}) {
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);
  const contentScale = getContentScale(slide.body);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Image area — top 35% */}
      <div className="relative h-[35%] w-full shrink-0">
        {slide.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slide.imageUrl}
            alt={slide.imagePrompt ?? "Slide image"}
            className="h-full w-full object-cover"
            style={slide.imageFocalPoint ? { objectPosition: `${slide.imageFocalPoint.x}% ${slide.imageFocalPoint.y}%` } : undefined}
          />
        ) : (
          <ImagePlaceholder theme={theme} />
        )}
        {/* Gradient divider */}
        <div
          className="absolute bottom-0 left-0 right-0 h-4"
          style={{
            background: `linear-gradient(to top, ${theme.colors.background}, transparent)`,
          }}
        />
      </div>

      {/* Content area — bottom 65% */}
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`mt-3 ${contentScale} leading-relaxed`}>
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} dense={isDenseContent(slide.body)} />
        </ContentFitter>
        {resolvedFooter && <SlideFooter text={resolvedFooter} theme={theme} />}
      </div>
    </div>
  );
}

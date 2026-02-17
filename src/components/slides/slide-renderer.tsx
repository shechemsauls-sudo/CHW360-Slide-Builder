"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
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
    if (density > 15) return "text-xs";
    if (density > 8) return "text-sm";
    return "text-sm";
  }

  if (density > 30) return "text-xs";
  if (density > 18) return "text-sm";
  return "text-base";
}

/** Check if content is dense enough to need compact layout adjustments */
function isDenseContent(body: string): boolean {
  const lineCount = body.split("\n").filter((l) => l.trim()).length;
  const blockCount = (body.match(/:::/g) ?? []).length / 2;
  const blockItemScore = countBlockItems(body);
  return lineCount + blockCount * 3 + blockItemScore > 10;
}

/** Safety-net wrapper: shrinks content via CSS scale if it overflows its container.
 *  Uses flex: 1 to fill available space (so it can detect overflow), and when
 *  content fits, applies internal flex centering for balanced vertical placement. */
function ContentFitter({ children, className }: { children: ReactNode; className?: string }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [shrink, setShrink] = useState(1);

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const available = outer.clientHeight;
    const needed = inner.scrollHeight;
    if (needed > available && available > 0) {
      setShrink(Math.max(0.55, available / needed));
    } else {
      setShrink(1);
    }
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    // Measure after first paint + delayed for late-rendering content (SVGs, fonts)
    requestAnimationFrame(measure);
    const timer = setTimeout(measure, 300);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, [measure]);

  return (
    <div ref={outerRef} className={`overflow-hidden ${className ?? ""}`} style={{ flex: "1 1 0%", minHeight: 0 }}>
      <div
        ref={innerRef}
        style={
          shrink < 1
            ? { transform: `scale(${shrink})`, transformOrigin: "top left", width: `${100 / shrink}%` }
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
    case "centered":
      return <CenteredLayout slide={slide} theme={theme} hasBlocks={hasBlocks} footerText={footerText} />;
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
    default:
      return <FullLayout slide={slide} theme={theme} hasBlocks={hasBlocks} footerText={footerText} />;
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
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);
  const contentScale = getContentScale(slide.body);

  const dense = isDenseContent(slide.body);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-12">
      <div className="flex flex-1 flex-col justify-center min-h-0">
        {isActivity && (
          <div
            className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shrink-0"
            style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}
          >
            Activity
          </div>
        )}
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`${dense ? "mt-3" : "mt-5"} ${contentScale} leading-relaxed`}>
          <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} dense={dense} />
        </ContentFitter>
      </div>
      {resolvedFooter && <SlideFooter text={resolvedFooter} theme={theme} />}
    </div>
  );
}

function CenteredLayout({
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
  const isQuote = slide.type === "quote";
  const { bodyContent, footerText: extractedFooter } = extractFooter(slide.body);
  const bodySlide = { ...slide, body: bodyContent };
  const resolvedFooter = extractedFooter ?? (slide.type !== "title" ? footerText : undefined);
  const contentScale = getContentScale(slide.body);

  const dense = isDenseContent(slide.body);

  return (
    <div className="flex h-full w-full flex-col items-center overflow-hidden text-center p-12">
      <div className="flex flex-1 flex-col items-center justify-center min-h-0">
        {isQuote && (
          <span className="mb-2 text-5xl shrink-0" style={{ color: theme.colors.accent }}>
            &ldquo;
          </span>
        )}
        <SlideTitle slide={slide} theme={theme} />
        <ContentFitter className={`${dense ? "mt-3" : "mt-5"} max-w-[80%] ${contentScale} leading-relaxed`}>
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

      {/* Softened gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

      {/* Content positioned at bottom with frosted-glass card */}
      <div className="relative flex h-full flex-col justify-end p-10">
        <div className="rounded-xl bg-black/50 p-8 ring-1 ring-white/10 backdrop-blur-md">
          <h2
            className="text-4xl font-bold leading-tight tracking-tight text-white"
            style={{
              fontFamily: theme.typography.headingFont,
              fontWeight: theme.typography.headingWeight,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {slide.title}
            <div
              className="mt-3 h-1 w-24 rounded-full"
              style={{ background: theme.gradient?.accent ?? theme.colors.accent }}
            />
          </h2>
          {bodyContent.trim() && (
            <div className="mt-4 max-w-[85%] text-base leading-relaxed text-white/85">
              <SlideBody slide={bodySlide} theme={theme} hasBlocks={hasBlocks} />
            </div>
          )}
          {resolvedFooter && (
            <div className="mt-4 pt-2 text-[10px] leading-tight text-white/40">
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

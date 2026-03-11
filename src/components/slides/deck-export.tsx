"use client";

import { useState, useRef, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { getTheme } from "~/lib/themes";
import { exportSlidesToPdf } from "~/lib/export/pdf";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";

interface DeckExportButtonProps {
  title: string;
  slides: SlideData[];
  themeId: string;
  variant?: "button" | "icon" | "ghost";
  className?: string;
}

export function DeckExportButton({
  title,
  slides,
  themeId,
  variant = "ghost",
  className,
}: DeckExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderSlides, setRenderSlides] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting || slides.length === 0) return;
    setExporting(true);
    setRenderSlides(true);
    const toastId = toast.loading("Preparing slides for export...");

    // Wait for fonts + render to settle before capturing
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const container = containerRef.current;
      if (!container) throw new Error("Render container not found");

      // Get all rendered slide elements
      const slideEls = Array.from(
        container.querySelectorAll("[data-slide-export]"),
      ) as HTMLElement[];

      if (slideEls.length === 0) throw new Error("No slides rendered");

      await exportSlidesToPdf(title, slideEls, (current, total) => {
        toast.loading(`Exporting slide ${current} of ${total}...`, { id: toastId });
      });

      toast.success("PDF exported!", { id: toastId });
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
      setRenderSlides(false);
    }
  }, [exporting, slides, title]);

  const theme = getTheme(themeId);

  return (
    <>
      <Button
        variant={variant === "button" ? "default" : "ghost"}
        size="sm"
        className={
          className ??
          "gap-1.5 text-xs text-gray-400 hover:text-white"
        }
        onClick={handleExport}
        disabled={exporting || slides.length === 0}
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {exporting ? "Exporting..." : "Export PDF"}
      </Button>

      {/* Offscreen render container */}
      {renderSlides && (
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: 960,
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              data-slide-export
              style={{ width: 960, height: 540 }}
            >
              <SlideRenderer slide={slide} theme={theme} footerText={`\u00A9 CHW360 | ${title} | Educational Use Only | Not Medical Advice`} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

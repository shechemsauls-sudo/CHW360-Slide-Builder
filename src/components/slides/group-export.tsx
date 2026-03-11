"use client";

import { useState, useRef, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { getTheme } from "~/lib/themes";
import { exportSlidesToPdf } from "~/lib/export/pdf";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";

interface GroupExportButtonProps {
  groupId: string;
  groupName: string;
}

export function GroupExportButton({ groupId, groupName }: GroupExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [slidesForExport, setSlidesForExport] = useState<{ slides: SlideData[]; themeId: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const { data: groupDecks } = api.deck.list.useQuery({
    groupId,
    sortBy: "updatedAt",
    sortDir: "asc",
    pageSize: 100,
  });

  const handleExport = useCallback(async () => {
    if (exporting) return;
    const deckIds = groupDecks?.items.map((d) => d.id) ?? [];
    if (deckIds.length === 0) {
      toast.error("No decks in this group");
      return;
    }

    setExporting(true);
    const toastId = toast.loading("Loading decks...");

    try {
      const allDecks = await Promise.all(
        deckIds.map((id) => utils.deck.getById.fetch({ id })),
      );

      const deckSlides = allDecks
        .filter((d) => d && d.slides)
        .map((d) => ({
          slides: (d!.slides as SlideData[]) ?? [],
          themeId: d!.themeId ?? "chw-cream",
        }));

      if (deckSlides.every((d) => d.slides.length === 0)) {
        toast.error("No slides to export", { id: toastId });
        setExporting(false);
        return;
      }

      setSlidesForExport(deckSlides);
      toast.loading("Rendering slides...", { id: toastId });

      // Wait for fonts + render to settle before capturing
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const container = containerRef.current;
      if (!container) throw new Error("Render container not found");

      const slideEls = Array.from(
        container.querySelectorAll("[data-slide-export]"),
      ) as HTMLElement[];

      if (slideEls.length === 0) throw new Error("No slides rendered");

      await exportSlidesToPdf(groupName, slideEls, (current, total) => {
        toast.loading(`Exporting slide ${current} of ${total}...`, { id: toastId });
      });

      toast.success(`Exported ${slideEls.length} slides from ${allDecks.length} decks`, { id: toastId });
    } catch (err) {
      console.error("Group PDF export failed:", err);
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
      setSlidesForExport([]);
    }
  }, [exporting, groupDecks, groupName, utils.deck.getById]);

  const deckCount = groupDecks?.items.length ?? 0;

  return (
    <>
      <button
        onClick={handleExport}
        disabled={exporting || deckCount === 0}
        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30"
        title="Export group as PDF"
      >
        {exporting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
      </button>

      {slidesForExport.length > 0 && (
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
          {slidesForExport.map((deck, di) => {
            const theme = getTheme(deck.themeId);
            return deck.slides.map((slide) => (
              <div
                key={`${di}-${slide.id}`}
                data-slide-export
                style={{ width: 960, height: 540 }}
              >
                <SlideRenderer slide={slide} theme={theme} footerText={`\u00A9 CHW360 | ${groupName} | Educational Use Only | Not Medical Advice`} />
              </div>
            ));
          })}
        </div>
      )}
    </>
  );
}

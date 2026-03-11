"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { getTheme } from "~/lib/themes";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import type { SlideData } from "~/lib/ai/types";

export default function AudiencePage() {
  const params = useParams();
  const deckId = params.deckId as string;

  const { data: deck, isLoading } = api.deck.getById.useQuery({ id: deckId });
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = (deck?.slides ?? []) as SlideData[];
  const currentSlide = slides[currentIndex];
  const theme = getTheme(deck?.themeId ?? "chw-cream");
  const storageKey = `presenter-slide-${deckId}`;

  // Read initial value from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setCurrentIndex(Number(stored));
    }
  }, [storageKey]);

  // Listen for slide changes from presenter window
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        setCurrentIndex(Number(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {});
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!deck || slides.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <p className="text-white/50">Waiting for presenter...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-black">
      {/* Slide */}
      <div className="relative w-full max-w-[calc(100vh*16/9)] px-4">
        {currentSlide && (
          <SlideRenderer
            slide={currentSlide}
            theme={theme}
            footerText={deck ? `\u00A9 CHW360 | ${deck.title} | Educational Use Only | Not Medical Advice` : undefined}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / slides.length) * 100}%`,
            backgroundColor: theme.colors.accent,
          }}
        />
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-3 right-4 text-xs text-white/30">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}

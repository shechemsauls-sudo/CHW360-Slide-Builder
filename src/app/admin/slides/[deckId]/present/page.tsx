"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { getTheme } from "~/lib/themes";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { MarkdownRenderer } from "~/components/slides/markdown-renderer";
import type { SlideData } from "~/lib/ai/types";

export default function PresentPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const { data: deck, isLoading } = api.deck.getById.useQuery({ id: deckId });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  const slides = (deck?.slides ?? []) as SlideData[];
  const currentSlide = slides[currentIndex];
  const theme = getTheme(deck?.themeId ?? "chw-teal");

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const exitPresent = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    router.push(`/admin/slides/${deckId}`);
  }, [router, deckId]);

  // Request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {
        // Fullscreen may be blocked by browser — that's OK
      });
    }

    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          exitPresent();
          break;
        case "n":
        case "N":
          setShowNotes((v) => !v);
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, exitPresent]);

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
        <p className="text-white/50">No slides to present</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-screen w-screen cursor-none items-center justify-center bg-black"
      onClick={goNext}
    >
      {/* Slide */}
      <div className="relative w-full max-w-[calc(100vh*16/9)] px-4">
        {currentSlide && (
          <SlideRenderer
            slide={currentSlide}
            theme={theme}
            scale={1}
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

      {/* Slide counter (bottom right, subtle) */}
      <div className="absolute bottom-3 right-4 text-xs text-white/30">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Speaker notes panel (toggle with N) */}
      {showNotes && currentSlide?.speakerNotes && (
        <div className="absolute bottom-8 left-4 right-4 z-10 max-h-[25vh] overflow-auto rounded-lg border border-white/10 bg-black/90 p-4 backdrop-blur">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
            Speaker Notes
          </div>
          <MarkdownRenderer
            content={currentSlide.speakerNotes}
            className="text-sm leading-relaxed text-white/70"
          />
        </div>
      )}

      {/* Navigation hint (fades after 3s) */}
      <NavigationHint />

      {/* Exit button (top-right, appears on hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          exitPresent();
        }}
        className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/50 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
      >
        ESC to exit
      </button>
    </div>
  );
}

function NavigationHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-pulse text-xs text-white/30">
      Arrow keys or click to navigate &middot; N for notes &middot; ESC to exit
    </div>
  );
}

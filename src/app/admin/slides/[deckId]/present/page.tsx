"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [presenterMode, setPresenterMode] = useState(false);
  const isExiting = useRef(false);
  const audienceWindow = useRef<Window | null>(null);

  const slides = (deck?.slides ?? []) as SlideData[];
  const currentSlide = slides[currentIndex];
  const theme = getTheme(deck?.themeId ?? "chw-teal");
  const storageKey = `presenter-slide-${deckId}`;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Sync slide index to localStorage for audience window
  useEffect(() => {
    if (presenterMode) {
      localStorage.setItem(storageKey, String(currentIndex));
    }
  }, [currentIndex, presenterMode, storageKey]);

  const exitPresent = useCallback(() => {
    if (isExiting.current) return;
    isExiting.current = true;

    // Close audience window if open
    if (audienceWindow.current && !audienceWindow.current.closed) {
      audienceWindow.current.close();
    }
    audienceWindow.current = null;
    localStorage.removeItem(storageKey);

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
    router.push(`/admin/slides/${deckId}`);
  }, [router, deckId, storageKey]);

  const togglePresenterMode = useCallback(() => {
    if (presenterMode) {
      // Close audience window
      if (audienceWindow.current && !audienceWindow.current.closed) {
        audienceWindow.current.close();
      }
      audienceWindow.current = null;
      localStorage.removeItem(storageKey);
      setPresenterMode(false);
    } else {
      // Open audience window and sync current index
      localStorage.setItem(storageKey, String(currentIndex));
      const popup = window.open(
        `/admin/slides/${deckId}/audience`,
        `audience-${deckId}`,
        "width=1280,height=720,menubar=no,toolbar=no",
      );
      audienceWindow.current = popup;
      setPresenterMode(true);
      setShowNotes(true);
    }
  }, [presenterMode, deckId, currentIndex, storageKey]);

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

  // Exit when fullscreen ends (handles browser ESC natively)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        exitPresent();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [exitPresent]);

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
        case "n":
        case "N":
          setShowNotes((v) => !v);
          break;
        case "p":
        case "P":
          togglePresenterMode();
          break;
        // ESC handled by browser fullscreen exit → fullscreenchange listener
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, togglePresenterMode]);

  // Check if audience window was closed externally
  useEffect(() => {
    if (!presenterMode) return;
    const interval = setInterval(() => {
      if (audienceWindow.current?.closed) {
        audienceWindow.current = null;
        localStorage.removeItem(storageKey);
        setPresenterMode(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [presenterMode, storageKey]);

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
      {/* Presenter mode badge */}
      {presenterMode && (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-[#2D5A5A] px-3 py-1 text-xs font-medium text-white/90">
          Presenter Mode Active
        </div>
      )}

      {/* Slide */}
      <div className="relative w-full max-w-[calc(100vh*16/9)] px-4">
        {currentSlide && (
          <SlideRenderer
            slide={currentSlide}
            theme={theme}
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
      Arrow keys or click to navigate &middot; N for notes &middot; P for presenter mode &middot; ESC to exit
    </div>
  );
}

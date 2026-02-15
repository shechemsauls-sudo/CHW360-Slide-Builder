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
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/10"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={slides.length}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / slides.length) * 100}%`,
            backgroundColor: theme.colors.accent,
          }}
        />
      </div>

      {/* Slide counter (bottom right, subtle) */}
      <div className="absolute bottom-3 right-4 text-xs text-white/60">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* Speaker notes panel (toggle with N) */}
      {showNotes && currentSlide?.speakerNotes && (
        <PresenterNotesPanel notes={currentSlide.speakerNotes} />
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

/** Parse structured speaker notes into sections */
function parseSpeakerNotes(notes: string): {
  talkingPoints: string[];
  presenterTips: string[];
  transition: string | null;
  isStructured: boolean;
} {
  const hasTalkingPoints = notes.includes("**Talking Points**");
  if (!hasTalkingPoints) {
    return { talkingPoints: [], presenterTips: [], transition: null, isStructured: false };
  }

  const sections = notes.split(/\*\*(Talking Points|Presenter Tips|Transition)\*\*/);
  const talkingPoints: string[] = [];
  const presenterTips: string[] = [];
  let transition: string | null = null;

  for (let i = 0; i < sections.length; i++) {
    const header = sections[i]?.trim();
    const content = sections[i + 1]?.trim();
    if (!content) continue;

    const lines = content
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    if (header === "Talking Points") {
      talkingPoints.push(...lines);
    } else if (header === "Presenter Tips") {
      presenterTips.push(...lines);
    } else if (header === "Transition") {
      transition = lines.join(" ").replace(/^[""]|[""]$/g, "").trim() || null;
    }
  }

  return { talkingPoints, presenterTips, transition, isStructured: true };
}

function PresenterNotesPanel({ notes }: { notes: string }) {
  const parsed = parseSpeakerNotes(notes);

  // Fallback for unstructured notes
  if (!parsed.isStructured) {
    return (
      <div className="absolute bottom-8 left-4 right-4 z-10 max-h-[25vh] overflow-auto rounded-lg border border-white/10 bg-black/90 p-4 backdrop-blur">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
          Speaker Notes
        </div>
        <MarkdownRenderer
          content={notes}
          className="text-sm leading-relaxed text-white/70"
        />
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-4 right-4 z-10 max-h-[30vh] overflow-auto rounded-lg border border-white/10 bg-black/90 p-4 backdrop-blur">
      <div className="flex gap-6">
        {/* Talking Points — primary */}
        <div className="flex-1">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
            Talking Points
          </div>
          <ul className="space-y-1">
            {parsed.talkingPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Presenter Tips — secondary */}
        {parsed.presenterTips.length > 0 && (
          <div className="w-64 shrink-0 rounded-md border border-[#2D5A5A]/30 bg-[#2D5A5A]/10 p-3">
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#5B8A8A]/80">
              Tips
            </div>
            <ul className="space-y-1">
              {parsed.presenterTips.map((tip, i) => (
                <li key={i} className="text-xs leading-relaxed text-[#5B8A8A]/70">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transition */}
      {parsed.transition && (
        <div className="mt-2 border-t border-white/5 pt-2 text-xs italic text-white/40">
          → &ldquo;{parsed.transition}&rdquo;
        </div>
      )}
    </div>
  );
}

function NavigationHint() {
  const [visible, setVisible] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Show full overlay on first launch, then just the hint bar
    const hasSeenOverlay = localStorage.getItem("chw360-present-intro");
    if (!hasSeenOverlay) {
      setShowOverlay(true);
      localStorage.setItem("chw360-present-intro", "1");
    }

    const timer = setTimeout(() => {
      setVisible(false);
      setShowOverlay(false);
    }, showOverlay ? 5000 : 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showOverlay) {
    return (
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
        role="dialog"
        aria-label="Keyboard shortcuts"
        onClick={() => setShowOverlay(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShowOverlay(false);
        }}
      >
        <div className="max-w-sm rounded-xl border border-white/10 bg-[#1a1a2e] p-6 text-center shadow-2xl">
          <p className="mb-4 text-sm font-medium text-white">Keyboard Controls</p>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center justify-between gap-6">
              <span>Next slide</span>
              <span className="font-mono text-gray-500">→ / Space / Click</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Previous slide</span>
              <span className="font-mono text-gray-500">←</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Speaker notes</span>
              <span className="font-mono text-gray-500">N</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Audience view</span>
              <span className="font-mono text-gray-500">P</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span>Exit</span>
              <span className="font-mono text-gray-500">ESC</span>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-600">Click anywhere to dismiss</p>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-pulse text-xs text-white/30">
      Arrow keys or click to navigate &middot; N for notes &middot; P for presenter mode &middot; ESC to exit
    </div>
  );
}

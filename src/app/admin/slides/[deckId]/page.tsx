"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Sparkles,
  Clock,
  MessageSquare,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  Play,
  Palette,
  Keyboard,
  Image as ImageIcon,
  Pencil,
  Lightbulb,
  ArrowRightCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { SlideList } from "~/components/slides/slide-list";
import { MarkdownRenderer } from "~/components/slides/markdown-renderer";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { SlideEditPanel } from "~/components/slides/slide-edit-panel";
import { SlideImageControls } from "~/components/slides/slide-image-controls";
import { ThemeSelector } from "~/components/slides/theme-selector";
import { getTheme } from "~/lib/themes";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";
import type { FidelityLevel } from "~/lib/ai/types";

const FIDELITY_OPTIONS: { value: FidelityLevel; label: string }[] = [
  { value: "verbatim", label: "Verbatim" },
  { value: "balanced", label: "Balanced" },
  { value: "creative", label: "Creative" },
];

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

export default function DeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const utils = api.useUtils();
  const { data: deck, isLoading } = api.deck.getById.useQuery({ id: deckId });
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showRegenOptions, setShowRegenOptions] = useState(false);
  const [regenFidelity, setRegenFidelity] = useState<FidelityLevel>("balanced");
  const [regenSlideCount, setRegenSlideCount] = useState<number>(20);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState({ done: 0, total: 0 });

  // Sync slide count default from current deck when data loads
  useEffect(() => {
    if (deck?.slideCount) setRegenSlideCount(deck.slideCount);
  }, [deck?.slideCount]);

  const deleteDeck = api.deck.delete.useMutation({
    onSuccess: () => {
      toast.success("Deck deleted");
      router.push("/admin/slides");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateDeck = api.deck.update.useMutation({
    onSuccess: () => {
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const regenerateDeck = api.deck.regenerate.useMutation({
    onSuccess: () => {
      toast.success("Deck regenerated!");
      setShowRegenOptions(false);
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const generateSlideImage = api.deck.generateSlideImage.useMutation();

  const handleDelete = () => {
    if (window.confirm(`Delete "${deck?.title ?? "this deck"}"?`)) {
      deleteDeck.mutate({ id: deckId });
    }
  };

  const handleRegenerate = () => {
    if (!deck?.sourceContent) {
      toast.error("No source content to regenerate from");
      return;
    }
    regenerateDeck.mutate({
      id: deckId,
      fidelity: regenFidelity,
      slideCount: regenSlideCount,
    });
  };

  const handleBatchGenerateImages = useCallback(async () => {
    if (!deck) return;
    const slides = (deck.slides ?? []) as SlideData[];
    const needsImages = slides.filter((s) => s.imagePrompt && !s.imageUrl);

    if (needsImages.length === 0) {
      toast.info("All slides with image prompts already have images");
      return;
    }

    setIsGeneratingImages(true);
    setImageGenProgress({ done: 0, total: needsImages.length });

    for (let i = 0; i < needsImages.length; i++) {
      const slide = needsImages[i]!;
      try {
        await generateSlideImage.mutateAsync({
          deckId,
          slideId: slide.id,
        });
        setImageGenProgress({ done: i + 1, total: needsImages.length });
        // Refresh deck data to show newly generated image
        await utils.deck.getById.invalidate({ id: deckId });
      } catch {
        toast.error(`Failed to generate image for slide ${slide.order}`);
      }
    }

    setIsGeneratingImages(false);
    toast.success(`Generated ${needsImages.length} images`);
  }, [deck, deckId, generateSlideImage, utils.deck.getById]);

  const handleSlideUpdated = useCallback(() => {
    void utils.deck.getById.invalidate({ id: deckId });
  }, [utils.deck.getById, deckId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <div className="h-64 animate-pulse rounded bg-white/5" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="space-y-6">
        <Link href="/admin/slides">
          <Button variant="ghost" className="gap-1.5 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Decks
          </Button>
        </Link>
        <Card className="border-0 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-400">Deck not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slides = (deck.slides ?? []) as SlideData[];
  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? slides[0] ?? null;
  const isRegenerating = regenerateDeck.isPending;
  const slidesNeedingImages = slides.filter((s) => s.imagePrompt && !s.imageUrl).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/slides">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
            {deck.description && (
              <p className="mt-1 text-sm text-gray-400">{deck.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {slides.length} slides
              </span>
              {deck.llmProvider && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {deck.llmProvider === "openai" ? "GPT-4o" : "Claude Sonnet"}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(deck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <>
              {/* Batch generate images */}
              {slidesNeedingImages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
                  onClick={handleBatchGenerateImages}
                  disabled={isGeneratingImages}
                >
                  {isGeneratingImages ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  Images
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    {slidesNeedingImages}
                  </span>
                </Button>
              )}

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                >
                  <Keyboard className="h-4 w-4" />
                  Shortcuts
                </Button>
                {showShortcuts && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-white/10 bg-[#1a1a2e] p-3 shadow-xl">
                    <p className="mb-2 text-xs font-medium text-gray-300">Presentation Shortcuts</p>
                    <div className="space-y-1.5 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Next slide</span>
                        <span className="font-mono text-gray-500">→ / Space</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Previous slide</span>
                        <span className="font-mono text-gray-500">←</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Toggle notes</span>
                        <span className="font-mono text-gray-500">N</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Presenter mode</span>
                        <span className="font-mono text-gray-500">P</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exit presentation</span>
                        <span className="font-mono text-gray-500">ESC</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link href={`/admin/slides/${deckId}/present`}>
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{ backgroundColor: "#C9725B" }}
                >
                  <Play className="h-3.5 w-3.5" />
                  Present
                </Button>
              </Link>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
            onClick={() => setShowThemePicker(!showThemePicker)}
          >
            <Palette className="h-4 w-4" />
            Theme
          </Button>

          {deck.sourceContent && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
                onClick={() => setShowRegenOptions(!showRegenOptions)}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </Button>

              {showRegenOptions && !isRegenerating && (
                <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-white/10 bg-[#1a1a2e] p-4 shadow-xl">
                  <p className="mb-3 text-xs font-medium text-gray-300">
                    Fidelity Level
                  </p>
                  <div className="mb-3 space-y-1.5">
                    {FIDELITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegenFidelity(opt.value)}
                        className={`w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                          regenFidelity === opt.value
                            ? "bg-[#2D5A5A]/30 text-[#5B8A8A]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <p className="mb-2 text-xs font-medium text-gray-300">
                      Max Slides
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={120}
                        value={regenSlideCount}
                        onChange={(e) => setRegenSlideCount(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#2D5A5A]"
                      />
                      <span className="w-8 text-center text-xs font-medium text-white tabular-nums">
                        {regenSlideCount}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1.5"
                    style={{ backgroundColor: "#C9725B" }}
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate Deck
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Theme Picker */}
      {showThemePicker && (
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <ThemeSelector
              selected={deck.themeId}
              onSelect={(id) => {
                updateDeck.mutate({ id: deckId, themeId: id });
                setShowThemePicker(false);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Regenerating state */}
      {isRegenerating && (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#5B8A8A]" />
            <div>
              <p className="text-sm font-medium text-white">Regenerating slides...</p>
              <p className="text-xs text-gray-400">
                Using {regenFidelity} fidelity with {deck.llmProvider === "openai" ? "GPT-4o" : "Claude Sonnet"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image generation progress */}
      {isGeneratingImages && (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#5B8A8A]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                Generating images... ({imageGenProgress.done}/{imageGenProgress.total})
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${imageGenProgress.total > 0 ? (imageGenProgress.done / imageGenProgress.total) * 100 : 0}%`,
                    backgroundColor: "#5B8A8A",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Document Panel */}
      {deck.sourceContent && (
        <Card className="border-0 bg-white/5">
          <button
            type="button"
            onClick={() => setShowSource(!showSource)}
            className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            Source Document
            {deck.sourceFormat && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
                {deck.sourceFormat}
              </span>
            )}
            <span className="ml-auto">
              {showSource ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </span>
          </button>
          {showSource && (
            <CardContent className="border-t border-white/5 px-4 pb-4 pt-3">
              <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-gray-300 font-mono">
                {deck.sourceContent}
              </pre>
            </CardContent>
          )}
        </Card>
      )}

      {deck.status === "error" && (
        <Card className="border-0 border-l-2 border-l-[#C9725B] bg-[#C9725B]/10">
          <CardContent className="p-4">
            <p className="text-sm text-[#C9725B]">
              Generation failed:{" "}
              {(deck.generationLog as Record<string, string> | null)?.error ?? "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {slides.length === 0 && deck.status !== "error" && !isRegenerating && (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-400">This deck has no slides yet.</p>
          </CardContent>
        </Card>
      )}

      {slides.length > 0 && !isRegenerating && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Slide list sidebar */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg">
            <SlideList
              slides={slides}
              activeSlideId={activeSlide?.id ?? null}
              onSelectSlide={setActiveSlideId}
            />
          </div>

          {/* Active slide detail */}
          {activeSlide && (
            <Card className="border-0 bg-white/5">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#2D5A5A]/20 px-2 py-0.5 text-xs font-medium text-[#5B8A8A]">
                      {activeSlide.type}
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                      {activeSlide.layout}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-gray-400 hover:text-[#5B8A8A]"
                      onClick={() => setEditPanelOpen(true)}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <span className="text-xs text-gray-500">
                      Slide {activeSlide.order} of {slides.length}
                    </span>
                  </div>
                </div>

                {/* Slide content preview */}
                <SlideRenderer
                  slide={activeSlide}
                  theme={getTheme(deck.themeId)}
                  className="mb-6"
                />

                {/* Speaker notes */}
                {activeSlide.speakerNotes && (
                  <SpeakerNotesDisplay notes={activeSlide.speakerNotes} />
                )}

                {/* Image controls */}
                <SlideImageControls
                  slide={activeSlide}
                  deckId={deckId}
                  onUpdated={handleSlideUpdated}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Slide edit panel */}
      <SlideEditPanel
        open={editPanelOpen}
        onOpenChange={setEditPanelOpen}
        slide={activeSlide}
        deckId={deckId}
        onSlideUpdated={handleSlideUpdated}
      />
    </div>
  );
}

function SpeakerNotesDisplay({ notes }: { notes: string }) {
  const parsed = parseSpeakerNotes(notes);

  // Fallback for unstructured notes
  if (!parsed.isStructured) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <MessageSquare className="h-3.5 w-3.5" />
          Speaker Notes
        </div>
        <MarkdownRenderer
          content={notes}
          className="text-sm leading-relaxed text-gray-300"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <MessageSquare className="h-3.5 w-3.5" />
        Speaker Notes
      </div>

      <div className="space-y-3">
        {/* Talking Points */}
        {parsed.talkingPoints.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#5B8A8A]">
              <MessageSquare className="h-3 w-3" />
              Talking Points
            </div>
            <ul className="space-y-1">
              {parsed.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5B8A8A]/50" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Presenter Tips */}
        {parsed.presenterTips.length > 0 && (
          <div className="rounded-md border border-[#2D5A5A]/20 bg-[#2D5A5A]/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#5B8A8A]">
              <Lightbulb className="h-3 w-3" />
              Presenter Tips
            </div>
            <ul className="space-y-1">
              {parsed.presenterTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#5B8A8A]/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5B8A8A]/30" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transition */}
        {parsed.transition && (
          <div className="flex items-start gap-2 border-t border-white/5 pt-2">
            <ArrowRightCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9725B]/60" />
            <p className="text-sm italic text-gray-400">
              &ldquo;{parsed.transition}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

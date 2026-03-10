"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Image as ImageIcon,
  Pencil,
  Lightbulb,
  ArrowRightCircle,
  Settings,
  List,
  Info,
  X,
  Copy,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { SlideList } from "~/components/slides/slide-list";
import { MarkdownRenderer } from "~/components/slides/markdown-renderer";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { GenerationStatus } from "~/components/slides/generation-status";
import { SlideEditPanel } from "~/components/slides/slide-edit-panel";
import { SlideImageControls } from "~/components/slides/slide-image-controls";
import { DeckSettingsPanel } from "~/components/slides/deck-settings-panel";
import { DeckExportButton } from "~/components/slides/deck-export";
import { VideoRecsPanel } from "~/components/slides/video-recs-panel";
import { ReviewPanel } from "~/components/slides/review-panel";
import { getTheme } from "~/lib/themes";
import { parseSpeakerNotes } from "~/lib/slides/parse-speaker-notes";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";

export default function DeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = params.deckId as string;

  const utils = api.useUtils();
  const [isGeneratingImagesBg, setIsGeneratingImagesBg] = useState(false);
  const { data: deck, isLoading } = api.deck.getById.useQuery(
    { id: deckId },
    {
      refetchInterval: (query) => {
        const d = query.state.data;
        if (!d) return false;
        if (d.status === "generating") return 3000;
        // Poll while any slide has background image generation in progress
        const slides = (d.slides ?? []) as SlideData[];
        if (slides.some((s) => s.imageGenerating)) return 3000;
        // Poll while batch image gen is running in background
        if (isGeneratingImagesBg) return 4000;
        return false;
      },
    },
  );
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState({ done: 0, total: 0 });
  const [showSlideList, setShowSlideList] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { data: prefs } = api.deck.getPreferences.useQuery();

  // Track previous deck status to detect generation completion
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const autoImageTriggered = useRef(false);

  // Auto-start image generation when deck transitions to "ready"
  useEffect(() => {
    if (!deck || isLoading) return;

    const currentStatus = deck.status;

    // Detect transition: generating → ready, or fresh page load with ?new=1
    const justFinished = prevStatus === "generating" && currentStatus === "ready";
    const isNewDeck = searchParams.get("new") === "1";

    if ((justFinished || isNewDeck) && !autoImageTriggered.current && !isGeneratingImages) {
      const slides = (deck.slides ?? []) as SlideData[];
      const needsImages = slides.filter((s) => s.imagePrompt && !s.imageUrl).length;
      if (needsImages > 0) {
        autoImageTriggered.current = true;
        void handleBatchGenerateImages();
      }
      // Clean the URL param
      if (isNewDeck) {
        router.replace(`/admin/slides/${deckId}`, { scroll: false });
      }
    }

    setPrevStatus(currentStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, isLoading]);

  const deleteDeck = api.deck.delete.useMutation({
    onSuccess: () => {
      toast.success("Deck deleted");
      router.push("/admin/slides");
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateDeck = api.deck.duplicateDeck.useMutation({
    onSuccess: (copy) => {
      if (copy) {
        toast.success("Deck duplicated!");
        router.push(`/admin/slides/${copy.id}`);
      }
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
      setShowRegenConfirm(false);
      autoImageTriggered.current = false; // Allow auto-image-gen for the new slides
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const generateSlideImage = api.deck.generateSlideImage.useMutation();

  const deleteSlide = api.deck.deleteSlide.useMutation({
    onSuccess: () => {
      toast.success("Slide deleted");
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateSlide = api.deck.duplicateSlide.useMutation({
    onSuccess: () => {
      toast.success("Slide duplicated");
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const reorderSlides = api.deck.reorderSlides.useMutation({
    onSuccess: () => {
      void utils.deck.getById.invalidate({ id: deckId });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      if (!window.confirm("Delete this slide?")) return;
      deleteSlide.mutate({ deckId, slideId });
      // If we deleted the active slide, clear selection
      if (activeSlideId === slideId) setActiveSlideId(null);
    },
    [deckId, deleteSlide, activeSlideId],
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      duplicateSlide.mutate({ deckId, slideId });
    },
    [deckId, duplicateSlide],
  );

  const handleReorderSlides = useCallback(
    (slideIds: string[]) => {
      reorderSlides.mutate({ deckId, slideIds });
    },
    [deckId, reorderSlides],
  );

  const handleAddSlide = useCallback(() => {
    // Open edit panel for creating a new slide via AI
    setEditPanelOpen(true);
  }, []);

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
      fidelity: (prefs?.fidelity as "verbatim" | "balanced" | "creative") ?? "balanced",
      slideCount: (deck.slideCount && deck.slideCount >= 5) ? deck.slideCount : 70,
      llmProvider: (prefs?.llmProvider ?? deck?.llmProvider ?? "anthropic") as "openai" | "anthropic" | "xai",
      tone: (prefs?.tone as "professional" | "conversational" | "academic" | "training") ?? "training",
      customInstructions: prefs?.customInstructions || undefined,
    });
  };

  const batchGenerateImages = api.deck.batchGenerateImages.useMutation({
    onSuccess: (data) => {
      if (data.started === 0) {
        toast.info("All slides with image prompts already have images");
      } else {
        toast.success(`Generating ${data.started} images in the background — you can navigate away safely`);
        setIsGeneratingImages(true);
        setIsGeneratingImagesBg(true);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Detect when background image gen finishes (all prompts have URLs)
  useEffect(() => {
    if (!isGeneratingImagesBg || !deck) return;
    const slides = (deck.slides ?? []) as SlideData[];
    const stillNeeded = slides.filter((s) => s.imagePrompt && !s.imageUrl).length;
    if (stillNeeded === 0) {
      setIsGeneratingImagesBg(false);
      setIsGeneratingImages(false);
      toast.success("All images generated");
    }
  }, [deck, isGeneratingImagesBg]);

  const handleBatchGenerateImages = useCallback(async () => {
    if (!deck) return;
    batchGenerateImages.mutate({
      deckId,
      imageProvider: prefs?.imageProvider ?? "multi",
    });
  }, [deck, deckId, batchGenerateImages, prefs?.imageProvider]);

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

  // Show generating state when deck is still being built
  if (deck.status === "generating") {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/admin/slides">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 text-gray-400 hover:text-white" aria-label="Back to decks">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
            {deck.description && (
              <p className="mt-1 text-sm text-gray-400">{deck.description}</p>
            )}
          </div>
        </div>
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <GenerationStatus status="generating" provider={deck.llmProvider ?? undefined} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry
  if (deck.status === "error") {
    const errorLog = deck.generationLog as { error?: string } | null;
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Link href="/admin/slides">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 text-gray-400 hover:text-white" aria-label="Back to decks">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
          </div>
        </div>
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <GenerationStatus status="error" error={errorLog?.error ?? "Generation failed"} />
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                className="gap-1.5"
                style={{ backgroundColor: "#C9725B" }}
                onClick={handleRegenerate}
                disabled={regenerateDeck.isPending}
              >
                {regenerateDeck.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Try Again
              </Button>
              <Link href="/admin/slides">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Back to Decks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slides = (deck.slides ?? []) as SlideData[];
  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? slides[0] ?? null;
  const isRegenerating = regenerateDeck.isPending;
  const slidesNeedingImages = slides.filter((s) => s.imagePrompt && !s.imageUrl).length;
  const contentSlides = slides.filter((s) => s.type !== "references");
  const referenceSlides = slides.filter((s) => s.type === "references");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/slides">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 text-gray-400 hover:text-white" aria-label="Back to decks">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{deck.title}</h1>
            {deck.description && (
              <p className="mt-1 text-sm text-gray-400">{deck.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {contentSlides.length} slides{referenceSlides.length > 0 && ` + ${referenceSlides.length} ref`}
              </span>
              {deck.llmProvider && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {deck.llmProvider === "openai" ? "GPT-4o" : deck.llmProvider === "xai" ? "Grok" : "Claude Sonnet"}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(deck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {slides.length > 0 && (
            <>
              {/* Batch generate images (quick access) */}
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

              <Link href={`/admin/slides/${deckId}/present`}>
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{ backgroundColor: "#C9725B" }}
                  title="P for audience view, N for notes"
                >
                  <Play className="h-3.5 w-3.5" />
                  Present
                </Button>
              </Link>

              <DeckExportButton
                title={deck.title}
                slides={slides}
                themeId={deck.themeId}
              />
            </>
          )}

          {deck.sourceContent && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
              onClick={() => setShowRegenConfirm(!showRegenConfirm)}
              disabled={isRegenerating}
              title="Regenerate deck"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts"
          >
            <Info className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
            onClick={() => setShowSettingsPanel(true)}
            title="Deck settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-gray-400 hover:text-white"
            onClick={() => duplicateDeck.mutate({ id: deckId })}
            disabled={duplicateDeck.isPending}
            title="Duplicate deck"
          >
            {duplicateDeck.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Duplicate</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-red-400"
            onClick={handleDelete}
            title="Delete deck"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Regeneration Confirmation */}
      {showRegenConfirm && !isRegenerating && (
        <Card className="border-0 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-white">Regenerate this deck?</h3>
                <p className="mt-1 text-xs text-gray-400">
                  This will replace all slides using your current{" "}
                  <button
                    type="button"
                    onClick={() => { setShowRegenConfirm(false); setShowSettingsPanel(true); }}
                    className="font-medium text-[#5B8A8A] underline decoration-dotted hover:text-[#7AACAC]"
                  >
                    settings
                  </button>.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowRegenConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  style={{ backgroundColor: "#C9725B" }}
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
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
                Using {prefs?.fidelity ?? "balanced"} fidelity with {(prefs?.llmProvider ?? deck.llmProvider) === "openai" ? "GPT-4o" : "Claude Sonnet"}
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

      {/* Video Resources */}
      {deck.status === "ready" && slides.length > 0 && (
        <VideoRecsPanel
          deckId={deckId}
          videoRecs={deck.videoRecs as Array<{ videoId: string; title: string; channelName: string; thumbnail: string; publishedAt: string }> | null}
          onUpdated={handleSlideUpdated}
        />
      )}

      {/* Quality Review */}
      {deck.status === "ready" && slides.length > 0 && (
        <ReviewPanel
          deckId={deckId}
          slideCount={slides.length}
          onNavigateSlide={(order) => {
            const slide = slides.find((s) => s.order === order);
            if (slide) setActiveSlideId(slide.id);
          }}
        />
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
          {/* Slide list — toggle on mobile, always visible on lg+ */}
          <div>
            <button
              type="button"
              onClick={() => setShowSlideList(!showSlideList)}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 lg:hidden"
            >
              <List className="h-4 w-4" />
              Slide {activeSlide ? activeSlide.order : 1} of {slides.length}
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showSlideList ? "rotate-180" : ""}`} />
            </button>
            <div className={`max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg ${showSlideList ? "block" : "hidden"} lg:block`}>
              <SlideList
                slides={slides}
                activeSlideId={activeSlide?.id ?? null}
                onSelectSlide={(id) => {
                  setActiveSlideId(id);
                  setShowSlideList(false);
                }}
                onReorder={handleReorderSlides}
                onDuplicate={handleDuplicateSlide}
                onDelete={handleDeleteSlide}
                onAddSlide={handleAddSlide}
              />
            </div>
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
                <div className="group/slide relative mb-6">
                  <SlideRenderer
                    slide={activeSlide}
                    theme={getTheme(deck.themeId)}
                    footerText={`\u00A9 CHW360 | ${deck.title} | Educational Use Only`}
                  />
                  {/* Quick-access reposition button on image slides */}
                  {activeSlide.imageUrl && ["split-left", "split-right", "image-full", "image-top"].includes(activeSlide.layout) && (
                    <button
                      type="button"
                      onClick={() => {
                        // Scroll to the focal point editor in image controls below
                        const el = document.getElementById("focal-point-section");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          // Trigger the reposition editor open
                          const btn = el.querySelector<HTMLButtonElement>("button");
                          if (btn) setTimeout(() => btn.click(), 400);
                        }
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/slide:opacity-100 hover:bg-black/80"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
                      Reposition Image
                    </button>
                  )}
                </div>

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

      {/* Deck settings panel */}
      <DeckSettingsPanel
        open={showSettingsPanel}
        onOpenChange={setShowSettingsPanel}
        currentThemeId={deck.themeId}
        onThemeChange={(id) => {
          updateDeck.mutate({ id: deckId, themeId: id });
        }}
        onBatchGenerateImages={handleBatchGenerateImages}
        slidesNeedingImages={slidesNeedingImages}
        isGeneratingImages={isGeneratingImages}
      />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
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

const SHORTCUT_GROUPS = [
  {
    title: "Presenter Mode",
    shortcuts: [
      { keys: "→ / Space / Click", action: "Next slide" },
      { keys: "←", action: "Previous slide" },
      { keys: "N", action: "Toggle speaker notes" },
      { keys: "P", action: "Open audience view" },
      { keys: "ESC", action: "Exit presentation" },
    ],
  },
  {
    title: "Audience View",
    shortcuts: [
      { keys: "P", action: "Open audience popup (drag to external display)" },
    ],
  },
];

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#1a2e2e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
          <Info className="h-4 w-4 text-[#5B8A8A]" />
          Keyboard Shortcuts
        </h2>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#5B8A8A]">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-300">{s.action}</span>
                    <span className="shrink-0 font-mono text-xs text-gray-500">{s.keys}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
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
  MessageSquareText,
  List,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { SlideList } from "~/components/slides/slide-list";
import { MarkdownRenderer } from "~/components/slides/markdown-renderer";
import { SlideRenderer } from "~/components/slides/slide-renderer";
import { SlideEditPanel } from "~/components/slides/slide-edit-panel";
import { SlideImageControls } from "~/components/slides/slide-image-controls";
import { DeckSettingsPanel } from "~/components/slides/deck-settings-panel";
import { getTheme } from "~/lib/themes";
import { parseSpeakerNotes } from "~/lib/slides/parse-speaker-notes";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData, FidelityLevel, ToneOption } from "~/lib/ai/types";

const FIDELITY_OPTIONS: { value: FidelityLevel; label: string }[] = [
  { value: "verbatim", label: "Verbatim" },
  { value: "balanced", label: "Balanced" },
  { value: "creative", label: "Creative" },
];

export default function DeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = params.deckId as string;

  const utils = api.useUtils();
  const { data: deck, isLoading } = api.deck.getById.useQuery({ id: deckId });
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showRegenOptions, setShowRegenOptions] = useState(false);
  const [regenFidelity, setRegenFidelity] = useState<FidelityLevel>("balanced");
  const [regenSlideCount, setRegenSlideCount] = useState<number>(20);
  const [regenTone, setRegenTone] = useState<ToneOption>("professional");
  const [regenInstructions, setRegenInstructions] = useState("");
  const [regenLlmProvider, setRegenLlmProvider] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenProgress, setImageGenProgress] = useState({ done: 0, total: 0 });
  const [showImageGenDialog, setShowImageGenDialog] = useState(false);
  const [showSlideList, setShowSlideList] = useState(false);

  const { data: prefs } = api.deck.getPreferences.useQuery();
  const { data: providers } = api.deck.providers.useQuery();

  // Sync regen defaults from deck + preferences
  useEffect(() => {
    if (deck?.slideCount) setRegenSlideCount(deck.slideCount);
    if (deck?.llmProvider) setRegenLlmProvider(deck.llmProvider);
  }, [deck?.slideCount, deck?.llmProvider]);

  useEffect(() => {
    if (prefs?.tone) setRegenTone(prefs.tone as ToneOption);
    if (prefs?.customInstructions) setRegenInstructions(prefs.customInstructions);
  }, [prefs]);

  // Auto-show image generation dialog for newly created decks
  useEffect(() => {
    if (searchParams.get("new") !== "1" || !deck || isLoading) return;
    const slides = (deck.slides ?? []) as SlideData[];
    const needsImages = slides.filter((s) => s.imagePrompt && !s.imageUrl).length;
    if (needsImages > 0) {
      setShowImageGenDialog(true);
    }
    // Clean the URL param
    router.replace(`/admin/slides/${deckId}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, isLoading]);

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
      fidelity: regenFidelity,
      slideCount: regenSlideCount,
      llmProvider: (regenLlmProvider ?? deck?.llmProvider ?? "openai") as "openai" | "anthropic",
      tone: regenTone,
      customInstructions: regenInstructions || undefined,
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

    // Use saved image provider preference (default to dalle3)
    const savedProvider = prefs?.imageProvider;
    const provider: "dalle3" | "gpt-image-1" =
      savedProvider === "gpt-image-1" ? "gpt-image-1" : "dalle3";

    for (let i = 0; i < needsImages.length; i++) {
      const slide = needsImages[i]!;
      try {
        await generateSlideImage.mutateAsync({
          deckId,
          slideId: slide.id,
          imageProvider: provider,
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
  }, [deck, deckId, generateSlideImage, utils.deck.getById, prefs?.imageProvider]);

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
            </>
          )}

          {deck.sourceContent && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-400 hover:text-[#5B8A8A]"
              onClick={() => setShowRegenOptions(!showRegenOptions)}
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
            onClick={() => setShowSettingsPanel(true)}
            title="Deck settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
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

      {/* Inline Regeneration Card */}
      {showRegenOptions && !isRegenerating && (
        <Card className="border-0 bg-white/5">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Regenerate Deck</h3>
              <button
                type="button"
                onClick={() => setShowRegenOptions(false)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            </div>

            {/* LLM Provider */}
            {providers && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">AI Provider</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {providers.llm.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRegenLlmProvider(p.id)}
                      className={`rounded-lg border p-2 text-left transition-all ${
                        (regenLlmProvider ?? deck.llmProvider ?? "openai") === p.id
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium text-white">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fidelity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Fidelity</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {FIDELITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRegenFidelity(opt.value)}
                    className={`rounded-lg border p-2 text-center text-xs transition-all ${
                      regenFidelity === opt.value
                        ? "border-[#5B8A8A] bg-[#2D5A5A]/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Count */}
            <div className="space-y-2">
              <label htmlFor="regen-slide-count" className="text-xs font-medium text-gray-400">Max Slides</label>
              <div className="flex items-center gap-3">
                <input
                  id="regen-slide-count"
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

            {/* Tone */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <MessageSquareText className="h-3.5 w-3.5 text-gray-400" />
                <label className="text-xs font-medium text-gray-400">Tone</label>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["professional", "conversational", "academic", "training"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRegenTone(t)}
                    className={`rounded-lg border p-2 text-center text-xs capitalize transition-all ${
                      regenTone === t
                        ? "border-[#5B8A8A] bg-[#2D5A5A]/15 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <label htmlFor="regen-instructions" className="text-xs font-medium text-gray-400">Custom Instructions</label>
              <textarea
                id="regen-instructions"
                value={regenInstructions}
                onChange={(e) => {
                  if (e.target.value.length <= 500) setRegenInstructions(e.target.value);
                }}
                placeholder="Optional: specific instructions for this regeneration..."
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#2D5A5A]/50 focus:outline-none focus:ring-1 focus:ring-[#2D5A5A]/50"
              />
              <div className="text-right text-[10px] text-gray-500">
                {regenInstructions.length}/500
              </div>
            </div>

            <Button
              className="w-full gap-1.5"
              style={{ backgroundColor: "#C9725B" }}
              onClick={handleRegenerate}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate with these settings
            </Button>
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

      {/* Auto image generation dialog */}
      {showImageGenDialog && !isGeneratingImages && (
        <Card className="border-0 border-l-2 border-l-[#5B8A8A] bg-[#2D5A5A]/10">
          <CardContent className="flex items-center gap-4 p-5">
            <ImageIcon className="h-8 w-8 shrink-0 text-[#5B8A8A]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                {slidesNeedingImages} slide{slidesNeedingImages !== 1 ? "s" : ""} ha{slidesNeedingImages !== 1 ? "ve" : "s"} image prompts
              </p>
              <p className="text-xs text-gray-400">
                Generate AI images now to make your slides visually rich
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-[#C9725B] hover:bg-[#b5634e]"
                onClick={() => {
                  setShowImageGenDialog(false);
                  void handleBatchGenerateImages();
                }}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Generate All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowImageGenDialog(false)}
              >
                Skip
              </Button>
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

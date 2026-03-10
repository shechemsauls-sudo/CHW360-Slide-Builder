"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  Pencil,
  Sparkles,
  PanelLeft,
  PanelRight,
  Square,
  RectangleHorizontal,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { ImageFocalPointEditor } from "~/components/slides/image-focal-point";
import type { SlideData } from "~/lib/ai/types";

const IMAGE_ENGINES = [
  { id: "gpt-image-1", label: "GPT Image" },
  { id: "replicate", label: "FLUX" },
  { id: "dalle3", label: "DALL-E 3" },
  { id: "stability", label: "Stability" },
  { id: "leonardo", label: "Leonardo" },
] as const;

const IMAGE_LAYOUTS = [
  { id: "split-left", label: "Left", icon: PanelLeft },
  { id: "split-right", label: "Right", icon: PanelRight },
  { id: "image-top", label: "Top", icon: RectangleHorizontal },
  { id: "image-full", label: "Full", icon: Square },
] as const;

interface SlideImageControlsProps {
  slide: SlideData;
  deckId: string;
  onUpdated: () => void;
}

export function SlideImageControls({
  slide,
  deckId,
  onUpdated,
}: SlideImageControlsProps) {
  const utils = api.useUtils();
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(slide.imagePrompt ?? "");
  const [writingPrompt, setWritingPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("gpt-image-1");
  const [lastError, setLastError] = useState<string | null>(null);

  // Reset state when switching slides
  useEffect(() => {
    setEditingPrompt(false);
    setWritingPrompt(false);
    setCustomPrompt(slide.imagePrompt ?? "");
    setNewPrompt("");
    setLastError(null);
  }, [slide.id, slide.imagePrompt]);

  // Always read latest slide from query cache to avoid stale-data overwrites
  const getLatestSlide = useCallback((): SlideData => {
    const cached = utils.deck.getById.getData({ id: deckId });
    if (cached) {
      const slides = (cached.slides ?? []) as SlideData[];
      const found = slides.find((s) => s.id === slide.id);
      if (found) return found;
    }
    return slide;
  }, [utils.deck.getById, deckId, slide]);

  const generateImage = api.deck.generateSlideImage.useMutation({
    onSuccess: () => {
      toast.success("Image generating in background...");
      setLastError(null);
      onUpdated();
    },
    onError: (err) => {
      toast.error(err.message);
      setLastError(err.message);
    },
  });

  const generateImagePrompt = api.deck.generateImagePrompt.useMutation({
    onSuccess: () => {
      toast.success("Image prompt generated");
      onUpdated();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSlide = api.deck.updateSlide.useMutation({
    onSuccess: () => {
      onUpdated();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = (prompt?: string) => {
    setLastError(null);
    generateImage.mutate({
      deckId,
      slideId: slide.id,
      imageProvider: selectedEngine as "dalle3" | "gpt-image-1" | "stability" | "replicate" | "leonardo",
      ...(prompt ? { imagePrompt: prompt } : {}),
    });
    setEditingPrompt(false);
    setWritingPrompt(false);
  };

  const handleAutoGeneratePrompt = () => {
    generateImagePrompt.mutate({ deckId, slideId: slide.id });
  };

  const handleSavePrompt = () => {
    if (!newPrompt.trim()) return;
    updateSlide.mutate({
      deckId,
      slide: { ...getLatestSlide(), imagePrompt: newPrompt.trim() },
    });
    setWritingPrompt(false);
    setNewPrompt("");
  };

  const handleRemoveImage = () => {
    updateSlide.mutate({
      deckId,
      slide: { ...getLatestSlide(), imageUrl: null, layout: "full" },
    });
    toast.success("Image removed");
  };

  const handleLayoutChange = (layoutId: string) => {
    updateSlide.mutate({
      deckId,
      slide: { ...getLatestSlide(), layout: layoutId as SlideData["layout"] },
    });
  };

  const isMutating = generateImage.isPending;
  const isGenerating = isMutating || !!slide.imageGenerating;
  const isGeneratingPrompt = generateImagePrompt.isPending;
  const hasPrompt = !!slide.imagePrompt;
  const hasImage = !!slide.imageUrl;
  const isImageLayout = IMAGE_LAYOUTS.some((l) => l.id === slide.layout);
  const bgError = slide.imageError;

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <ImageIcon className="h-3.5 w-3.5" />
          Image
        </div>
        <div className="flex items-center gap-1">
          {hasImage ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-gray-400 hover:text-[#5B8A8A]"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-gray-400 hover:text-red-400"
                onClick={handleRemoveImage}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </>
          ) : hasPrompt ? (
            <div className="flex flex-col items-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-gray-400 hover:text-[#5B8A8A]"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                Generate
              </Button>
              {lastError && (
                <p className="mt-1 text-[11px] text-red-400">{lastError}</p>
              )}
            </div>
          ) : null}
          {hasPrompt && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-gray-400 hover:text-white"
              onClick={() => {
                setCustomPrompt(slide.imagePrompt ?? "");
                setEditingPrompt(!editingPrompt);
              }}
            >
              <Pencil className="h-3 w-3" />
              Edit Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Engine picker */}
      {hasPrompt && (
        <div className="mb-2">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Engine
          </label>
          <div className="flex flex-wrap gap-1">
            {IMAGE_ENGINES.map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => setSelectedEngine(eng.id)}
                className={`rounded-md border px-2 py-1 text-[10px] transition-all ${
                  selectedEngine === eng.id
                    ? "border-[#5B8A8A] bg-[#2D5A5A]/15 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* State 1: No prompt — offer to write one or auto-generate */}
      {!hasPrompt && !writingPrompt && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-[#5B8A8A]/40 bg-[#2D5A5A]/10 text-xs text-[#7AACAC] hover:border-[#5B8A8A] hover:bg-[#2D5A5A]/20 hover:text-white"
            onClick={() => setWritingPrompt(true)}
          >
            <Pencil className="h-3 w-3" />
            Write a prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-[#5B8A8A]/40 bg-[#2D5A5A]/10 text-xs text-[#7AACAC] hover:border-[#5B8A8A] hover:bg-[#2D5A5A]/20 hover:text-white"
            onClick={handleAutoGeneratePrompt}
            disabled={isGeneratingPrompt}
          >
            {isGeneratingPrompt ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Auto-generate prompt
          </Button>
        </div>
      )}

      {/* Writing a new prompt */}
      {!hasPrompt && writingPrompt && (
        <div className="space-y-2">
          <Textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Describe the image you want for this slide..."
            className="min-h-[60px] resize-none border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              style={{ backgroundColor: "#C9725B" }}
              onClick={handleSavePrompt}
              disabled={!newPrompt.trim()}
            >
              Save Prompt
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              style={{ backgroundColor: "#2D5A5A" }}
              onClick={() => handleGenerate(newPrompt)}
              disabled={!newPrompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ImageIcon className="h-3 w-3" />
              )}
              Save & Generate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400"
              onClick={() => { setWritingPrompt(false); setNewPrompt(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* State 2 & 3: Has prompt — show prompt text or edit form */}
      {hasPrompt && editingPrompt && (
        <div className="space-y-2">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[60px] resize-none border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              style={{ backgroundColor: "#C9725B" }}
              onClick={() => handleGenerate(customPrompt)}
              disabled={!customPrompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ImageIcon className="h-3 w-3" />
              )}
              Generate with Custom Prompt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-400"
              onClick={() => setEditingPrompt(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {hasPrompt && !editingPrompt && (
        <p className="text-sm italic text-gray-400">
          {slide.imagePrompt}
        </p>
      )}

      {/* Background generating indicator */}
      {slide.imageGenerating && !hasImage && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#2D5A5A]/30 bg-[#2D5A5A]/10 px-3 py-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-[#7AACAC]" />
          <span className="text-xs text-[#7AACAC]">Generating image in background...</span>
        </div>
      )}

      {/* Background error */}
      {bgError && !slide.imageGenerating && (
        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-red-400">{bgError}</p>
        </div>
      )}

      {/* Image preview */}
      {hasImage && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl!}
            alt={slide.imagePrompt ?? "Generated slide image"}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Focal point / reposition */}
      {hasImage && isImageLayout && (
        <div id="focal-point-section" className="mt-3 border-t border-white/5 pt-3">
          <ImageFocalPointEditor
            imageUrl={slide.imageUrl!}
            focalPoint={slide.imageFocalPoint}
            onSave={(point) => {
              updateSlide.mutate({
                deckId,
                slide: { ...getLatestSlide(), imageFocalPoint: point },
              });
              toast.success("Focal point updated");
            }}
            onReset={() => {
              const latest = getLatestSlide();
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { imageFocalPoint: _fp, ...rest } = latest;
              updateSlide.mutate({
                deckId,
                slide: rest as SlideData,
              });
              toast.success("Focal point reset to center");
            }}
          />
        </div>
      )}

      {/* Layout picker — show when there's a prompt or image */}
      {(hasPrompt || hasImage) && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Image Layout
          </label>
          <div className="flex gap-1.5">
            {IMAGE_LAYOUTS.map((layout) => {
              const Icon = layout.icon;
              const isActive = slide.layout === layout.id;
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-all ${
                    isActive
                      ? "border-[#5B8A8A] bg-[#2D5A5A]/15 text-white"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {layout.label}
                </button>
              );
            })}
            {isImageLayout && (
              <button
                type="button"
                onClick={() => handleLayoutChange("full")}
                className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-400 hover:border-red-400/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3 w-3" />
                No Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

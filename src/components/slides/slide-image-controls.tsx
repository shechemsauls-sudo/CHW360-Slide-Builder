"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, RefreshCw, Trash2, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";

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
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(slide.imagePrompt ?? "");

  const generateImage = api.deck.generateSlideImage.useMutation({
    onSuccess: () => {
      toast.success("Image generated");
      onUpdated();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSlide = api.deck.updateSlide.useMutation({
    onSuccess: () => {
      toast.success("Image removed");
      onUpdated();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = (prompt?: string) => {
    generateImage.mutate({
      deckId,
      slideId: slide.id,
      ...(prompt ? { imagePrompt: prompt } : {}),
    });
    setEditingPrompt(false);
  };

  const handleRemoveImage = () => {
    updateSlide.mutate({
      deckId,
      slide: { ...slide, imageUrl: null },
    });
  };

  const isGenerating = generateImage.isPending;

  // No image prompt at all — nothing to show
  if (!slide.imagePrompt && !slide.imageUrl) return null;

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <ImageIcon className="h-3.5 w-3.5" />
          Image
        </div>
        <div className="flex items-center gap-1">
          {slide.imageUrl ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[10px] text-gray-400 hover:text-[#5B8A8A]"
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
                className="h-6 gap-1 px-2 text-[10px] text-gray-400 hover:text-red-400"
                onClick={handleRemoveImage}
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] text-gray-400 hover:text-[#5B8A8A]"
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
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] text-gray-400 hover:text-white"
            onClick={() => {
              setCustomPrompt(slide.imagePrompt ?? "");
              setEditingPrompt(!editingPrompt);
            }}
          >
            <Pencil className="h-3 w-3" />
            Edit Prompt
          </Button>
        </div>
      </div>

      {/* Prompt display / edit */}
      {editingPrompt ? (
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
      ) : (
        <p className="text-sm italic text-gray-400">
          {slide.imagePrompt}
        </p>
      )}

      {/* Image preview */}
      {slide.imageUrl && (
        <div className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt={slide.imagePrompt ?? "Generated slide image"}
            className="w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import type { SlideData } from "~/lib/ai/types";
import { SlidePreview } from "./slide-preview";

interface SlideListProps {
  slides: SlideData[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
}

export function SlideList({ slides, activeSlideId, onSelectSlide }: SlideListProps) {
  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400">No slides generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slides.map((slide, i) => (
        <SlidePreview
          key={slide.id}
          slide={slide}
          index={i}
          isActive={activeSlideId === slide.id}
          onClick={() => onSelectSlide(slide.id)}
        />
      ))}
    </div>
  );
}

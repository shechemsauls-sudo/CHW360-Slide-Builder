"use client";

import type { SlideData } from "~/lib/ai/types";

interface SlidePreviewProps {
  slide: SlideData;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  title: "T",
  section: "S",
  content: "C",
  bullets: "B",
  comparison: "2",
  image: "I",
  activity: "A",
  quote: "Q",
  closing: "X",
};

export function SlidePreview({ slide, index, isActive, onClick }: SlidePreviewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-lg border p-3 text-left transition-all ${
        isActive
          ? "border-[#5B8A8A] bg-[#2D5A5A]/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-gray-400">
          {index + 1}
        </span>
        <span className="rounded bg-[#2D5A5A]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8A8A]">
          {slide.type}
        </span>
      </div>
      <h4 className="mb-1 truncate text-sm font-medium text-white">{slide.title}</h4>
      <p className="line-clamp-2 text-xs text-gray-400">{stripMarkdown(slide.body)}</p>
      {slide.speakerNotes && (
        <p className="mt-2 line-clamp-1 border-t border-white/5 pt-2 text-[10px] text-gray-500">
          Notes: {slide.speakerNotes}
        </p>
      )}
    </button>
  );
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/- /g, "")
    .replace(/\n/g, " ")
    .trim();
}

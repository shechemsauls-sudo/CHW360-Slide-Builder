"use client";

import { Copy, GripVertical, Trash2 } from "lucide-react";
import type { SlideData } from "~/lib/ai/types";

interface SlidePreviewProps {
  slide: SlideData;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function SlidePreview({
  slide,
  index,
  isActive,
  onClick,
  onDuplicate,
  onDelete,
  dragHandleProps,
}: SlidePreviewProps) {
  return (
    <div
      className={`group relative w-full rounded-lg border text-left transition-all ${
        isActive
          ? "border-[#5B8A8A] bg-[#2D5A5A]/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex">
        {/* Drag handle */}
        {dragHandleProps && (
          <button
            type="button"
            aria-label={`Reorder slide ${index + 1}`}
            className="flex w-6 shrink-0 cursor-grab items-center justify-center rounded-l-lg text-gray-600 opacity-0 transition-opacity hover:text-gray-400 active:cursor-grabbing group-hover:opacity-100 group-focus-within:opacity-100"
            {...dragHandleProps}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Content area — clickable */}
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 p-3 text-left"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-gray-400">
              {index + 1}
            </span>
            <span className="rounded bg-[#2D5A5A]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#5B8A8A]">
              {slide.type}
            </span>
            {slide.imagePrompt && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  slide.imageUrl
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {slide.imageUrl ? "IMG" : "IMG?"}
              </span>
            )}
          </div>
          <h4 className="mb-1 truncate text-sm font-medium text-white">{slide.title}</h4>
          <p className="line-clamp-2 text-xs text-gray-400">{stripMarkdown(slide.body)}</p>
          {slide.speakerNotes && (
            <p className="mt-2 line-clamp-1 border-t border-white/5 pt-2 text-[10px] text-gray-400">
              Notes: {slide.speakerNotes}
            </p>
          )}
        </button>
      </div>

      {/* Action buttons — top-right, visible on hover */}
      {(onDuplicate || onDelete) && (
        <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {onDuplicate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-[#5B8A8A]"
              title="Duplicate slide"
              aria-label="Duplicate slide"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Delete slide"
              aria-label="Delete slide"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
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

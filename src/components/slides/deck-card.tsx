"use client";

import Link from "next/link";
import { Layers, Clock, Sparkles, Trash2, Loader2, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";

interface DeckCardProps {
  deck: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    slideCount: number | null;
    llmProvider: string | null;
    themeId: string;
    groupId: string | null;
    updatedAt: Date;
  };
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "rgba(255, 255, 255, 0.1)", text: "#9CA3AF", label: "Draft" },
  generating: { bg: "rgba(45, 90, 90, 0.2)", text: "#5B8A8A", label: "Generating..." },
  ready: { bg: "rgba(45, 90, 90, 0.2)", text: "#5B8A8A", label: "Ready" },
  error: { bg: "rgba(201, 114, 91, 0.2)", text: "#C9725B", label: "Error" },
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "GPT-4o",
  anthropic: "Claude",
  xai: "Grok",
};

export function DeckCard({ deck, onDelete, onDuplicate, selected, onSelect }: DeckCardProps) {
  const status = STATUS_COLORS[deck.status] ?? STATUS_COLORS.draft;
  const timeAgo = getRelativeTime(deck.updatedAt);

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-white/[0.08] ${
        selected ? "border-[#5B8A8A]/50 bg-[#2D5A5A]/10" : "border-transparent bg-white/5"
      }`}
    >
      {onSelect && (
        <label className="flex h-8 w-8 shrink-0 items-center justify-center cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(deck.id)}
            className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-[#2D5A5A]"
          />
        </label>
      )}
      <Link href={`/admin/slides/${deck.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-white">
            {deck.title}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${deck.status === "generating" ? "animate-pulse" : ""}`}
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {deck.status === "generating" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status.label}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {deck.slideCount ?? 0}
          </span>
          {deck.llmProvider && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {PROVIDER_LABELS[deck.llmProvider] ?? deck.llmProvider}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>
      </Link>
      {onDuplicate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-gray-500 opacity-0 transition-opacity hover:text-[#5B8A8A] group-hover:opacity-100"
          onClick={(e) => { e.preventDefault(); onDuplicate(deck.id); }}
          aria-label={`Duplicate ${deck.title}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-gray-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        onClick={() => onDelete(deck.id)}
        aria-label={`Delete ${deck.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

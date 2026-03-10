"use client";

import { Loader2, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface GenerationStatusProps {
  status: "idle" | "generating" | "error";
  error?: string;
  provider?: string;
  slideCount?: number;
}

const LLM_LABELS: Record<string, string> = {
  anthropic: "Claude",
  openai: "GPT-4o",
  xai: "Grok",
};

export function GenerationStatus({ status, error, provider }: GenerationStatusProps) {
  if (status === "idle") return null;

  if (status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#C9725B]/30 bg-[#C9725B]/10 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-[#C9725B]" />
        <div>
          <p className="text-sm font-medium text-[#C9725B]">Generation Failed</p>
          <p className="text-xs text-gray-400">{error ?? "An unknown error occurred"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D5A5A]/20">
          <Sparkles className="h-8 w-8 text-[#5B8A8A]" />
        </div>
        <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-[#C9725B]" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">Generating Slides</h3>
      <p className="mb-6 text-sm text-gray-400">
        {LLM_LABELS[provider ?? "anthropic"] ?? "AI"} is creating your presentation...
      </p>

      {/* Safe to leave */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">
          This may take a minute. Safe to navigate away — your deck will be ready when you return.
        </p>
        <Link
          href="/admin/slides"
          className="flex items-center gap-1.5 text-xs font-medium text-[#5B8A8A] transition-colors hover:text-[#7AACAC]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Decks
        </Link>
      </div>
    </div>
  );
}

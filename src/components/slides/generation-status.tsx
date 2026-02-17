"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, AlertCircle, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

/** Estimate generation time range in minutes based on slide count and provider */
function estimateTime(slideCount: number, provider?: string): string {
  // Base: ~2s per slide for OpenAI, ~3s per slide for Anthropic (streaming)
  const perSlide = provider === "anthropic" ? 3 : 2;
  const baseSeconds = slideCount * perSlide;
  // Add overhead for prompt construction, retries, network
  const minSeconds = baseSeconds + 15;
  const maxSeconds = baseSeconds * 1.5 + 30;
  const minMin = Math.max(1, Math.round(minSeconds / 60));
  const maxMin = Math.max(minMin + 1, Math.round(maxSeconds / 60));
  return `${minMin} \u2013 ${maxMin} minutes`;
}

interface GenerationStatusProps {
  status: "idle" | "generating" | "error";
  error?: string;
  provider?: string;
  slideCount?: number;
}

export function GenerationStatus({ status, error, provider, slideCount }: GenerationStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "generating") {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

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

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

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
        {provider === "anthropic" ? "Claude" : "GPT-4o"} is creating your presentation...
      </p>

      {/* Estimated wait + elapsed timer */}
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white/5 px-8 py-5">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock className="h-4 w-4 text-[#5B8A8A]" />
          <span>Estimated wait: <strong className="text-white">{estimateTime(slideCount ?? 20, provider)}</strong></span>
        </div>
        <div className="text-xs text-gray-500">
          Elapsed: {formatTime(elapsed)}
        </div>
      </div>

      {/* Safe to leave */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-xs text-gray-500">
          You&apos;ll receive an email when it&apos;s done. Safe to close this page.
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

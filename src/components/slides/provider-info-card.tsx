"use client";

import { Check, Lock } from "lucide-react";

interface ProviderInfoCardProps {
  provider: {
    id: string;
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    costTier: string;
    configured: boolean;
  };
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const COST_LABELS: Record<string, string> = {
  low: "$",
  medium: "$$",
  high: "$$$",
};

export function ProviderInfoCard({
  provider,
  selected,
  onSelect,
  disabled,
}: ProviderInfoCardProps) {
  const isAvailable = provider.configured && !disabled;

  return (
    <button
      type="button"
      onClick={() => isAvailable && onSelect()}
      disabled={!isAvailable}
      className={`relative w-full rounded-lg border p-4 text-left transition-all ${
        selected
          ? "border-[#5B8A8A] bg-[#2D5A5A]/10"
          : isAvailable
            ? "border-white/10 bg-white/5 hover:border-white/20"
            : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D5A5A]">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      {!provider.configured && (
        <div className="absolute right-3 top-3">
          <Lock className="h-4 w-4 text-gray-600" />
        </div>
      )}

      <div className="mb-1 flex items-center gap-2">
        <span className="font-medium text-white">{provider.name}</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
          {COST_LABELS[provider.costTier] ?? "$"}
        </span>
      </div>

      <p className="mb-3 text-xs text-gray-400">{provider.description}</p>

      {!provider.configured && (
        <p className="text-xs font-medium text-[#C9725B]">API key not configured</p>
      )}

      {provider.configured && (
        <div className="space-y-1">
          {provider.pros.slice(0, 2).map((pro) => (
            <p key={pro} className="text-xs text-gray-400">
              <span className="text-[#5B8A8A]">+</span> {pro}
            </p>
          ))}
        </div>
      )}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Palette,
  Sparkles,
  Image as ImageIcon,
  SlidersHorizontal,
  Loader2,
  MessageSquareText,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { ThemeSelector } from "~/components/slides/theme-selector";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { ToneOption, FidelityLevel } from "~/lib/ai/types";

const TONE_OPTIONS: {
  value: ToneOption;
  label: string;
  description: string;
}[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal, clear, evidence-based. For clinical or policy audiences.",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Warm, direct, uses \"you\" and \"we\". Best for community settings.",
  },
  {
    value: "academic",
    label: "Academic",
    description: "Formal with citations-style references. Technical terminology preserved.",
  },
  {
    value: "training",
    label: "Training",
    description: "Step-by-step instruction with comprehension checks and activities.",
  },
];

const FIDELITY_OPTIONS: {
  value: FidelityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "verbatim",
    label: "Verbatim",
    description: "Preserve source text exactly. AI only assigns slide types and layouts.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Preserve key content. AI may improve formatting and add transitions.",
  },
  {
    value: "creative",
    label: "Creative",
    description: "AI restructures freely for maximum engagement and visual impact.",
  },
];

interface DeckSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  onBatchGenerateImages: () => void;
  slidesNeedingImages: number;
  isGeneratingImages: boolean;
}

export function DeckSettingsPanel({
  open,
  onOpenChange,
  currentThemeId,
  onThemeChange,
  onBatchGenerateImages,
  slidesNeedingImages,
  isGeneratingImages,
}: DeckSettingsPanelProps) {
  const { data: prefs, isLoading: prefsLoading } = api.deck.getPreferences.useQuery();
  const { data: providers } = api.deck.providers.useQuery();
  const utils = api.useUtils();

  const [llmProvider, setLlmProvider] = useState("anthropic");
  const [imageProvider, setImageProvider] = useState("gpt-image-1");
  const [fidelity, setFidelity] = useState<FidelityLevel>("balanced");
  const [tone, setTone] = useState<ToneOption>("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (prefs) {
      setLlmProvider(prefs.llmProvider ?? "anthropic");
      setImageProvider(prefs.imageProvider ?? "gpt-image-1");
      setFidelity((prefs.fidelity as FidelityLevel) ?? "balanced");
      setTone((prefs.tone as ToneOption) ?? "professional");
      setCustomInstructions(prefs.customInstructions ?? "");
      setIsDirty(false);
    }
  }, [prefs]);

  const setPreferences = api.deck.setPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved");
      setIsDirty(false);
      void utils.deck.getPreferences.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    setPreferences.mutate({
      llmProvider,
      imageProvider,
      fidelity,
      tone,
      customInstructions,
    });
  };

  const markDirty = () => setIsDirty(true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-white/10 bg-[#1a2e2e] sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader className="border-b border-white/10 pb-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-[#5B8A8A]" />
            Deck Settings
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Theme, generation preferences, and AI behavior
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 p-4">
          {/* Theme Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#5B8A8A]" />
              <h3 className="text-sm font-medium text-gray-200">Theme</h3>
            </div>
            <ThemeSelector
              selected={currentThemeId}
              onSelect={(id) => {
                onThemeChange(id);
              }}
            />
          </section>

          {/* Source Fidelity */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#5B8A8A]" />
              <h3 className="text-sm font-medium text-gray-200">Source Fidelity</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FIDELITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setFidelity(opt.value); markDirty(); }}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    fidelity === opt.value
                      ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-medium text-white">{opt.label}</div>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Generation Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#5B8A8A]" />
              <h3 className="text-sm font-medium text-gray-200">Generation</h3>
            </div>
            <div className="space-y-4">
              {/* LLM Provider */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">AI Text Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {(providers?.llm ?? []).filter((p) => p.configured).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setLlmProvider(p.id); markDirty(); }}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        llmProvider === p.id
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium text-white">{p.name}</div>
                      <p className="mt-0.5 text-[10px] text-gray-400">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Images Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#5B8A8A]" />
              <h3 className="text-sm font-medium text-gray-200">Images</h3>
            </div>
            <div className="space-y-4">
              {/* Image Provider */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Image Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {(providers?.image ?? []).filter((p) => p.configured).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setImageProvider(p.id); markDirty(); }}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        imageProvider === p.id
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium text-white">{p.name}</div>
                      <p className="mt-0.5 text-[10px] text-gray-400">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch Generate */}
              {slidesNeedingImages > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-white/10 text-gray-300 hover:border-[#5B8A8A] hover:text-white"
                  onClick={onBatchGenerateImages}
                  disabled={isGeneratingImages}
                >
                  {isGeneratingImages ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  Generate All Images
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    {slidesNeedingImages}
                  </span>
                </Button>
              )}
            </div>
          </section>

          {/* Advanced Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#5B8A8A]" />
              <h3 className="text-sm font-medium text-gray-200">Advanced</h3>
            </div>
            <div className="space-y-5">
              {/* Tone Selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquareText className="h-3.5 w-3.5 text-gray-400" />
                  <label className="text-xs font-medium text-gray-400">Writing Tone</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setTone(opt.value); markDirty(); }}
                      className={`rounded-lg border p-2.5 text-left transition-all ${
                        tone === opt.value
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium text-white">{opt.label}</div>
                      <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                        {opt.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-2">
                <label htmlFor="settings-custom-instructions" className="text-xs font-medium text-gray-400">
                  Custom Instructions
                </label>
                <textarea
                  id="settings-custom-instructions"
                  value={customInstructions}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setCustomInstructions(e.target.value);
                      markDirty();
                    }
                  }}
                  placeholder="e.g., Use simple language for low-literacy audiences. Include malaria prevention messaging."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#2D5A5A]/50 focus:outline-none focus:ring-1 focus:ring-[#2D5A5A]/50"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Applied to generation and regeneration</span>
                  <span>{customInstructions.length}/500</span>
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          {isDirty && (
            <Button
              className="w-full gap-1.5"
              style={{ backgroundColor: "#C9725B" }}
              onClick={handleSave}
              disabled={setPreferences.isPending || prefsLoading}
            >
              {setPreferences.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Save Preferences
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

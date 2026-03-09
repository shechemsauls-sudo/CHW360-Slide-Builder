"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { FidelityLevel, ToneOption } from "~/lib/ai/types";

const FIDELITY_OPTIONS: { value: FidelityLevel; label: string }[] = [
  { value: "verbatim", label: "Verbatim" },
  { value: "balanced", label: "Balanced" },
  { value: "creative", label: "Creative" },
];

const TONE_OPTIONS: { value: ToneOption; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "conversational", label: "Conversational" },
  { value: "academic", label: "Academic" },
  { value: "training", label: "Training" },
];

export function GenerationPreferencesCard() {
  const { data: prefs, isLoading } = api.deck.getPreferences.useQuery();
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
    setPreferences.mutate({ llmProvider, imageProvider, fidelity, tone, customInstructions });
  };

  const markDirty = () => setIsDirty(true);

  const configuredLlm = (providers?.llm ?? []).filter((p) => p.configured);
  const configuredImage = (providers?.image ?? []).filter((p) => p.configured);

  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-white/[0.07]">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-white/[0.07]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-[#5B8A8A]" />
          Generation Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* LLM Provider */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Default LLM Provider</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {configuredLlm.map((p) => (
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
              </button>
            ))}
          </div>
        </div>

        {/* Image Provider */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Default Image Provider</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {configuredImage.map((p) => (
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
              </button>
            ))}
          </div>
        </div>

        {/* Fidelity */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Default Fidelity</label>
          <div className="grid grid-cols-3 gap-2">
            {FIDELITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setFidelity(opt.value); markDirty(); }}
                className={`rounded-lg border p-2.5 text-center transition-all ${
                  fidelity === opt.value
                    ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-medium text-white">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#8AACAC" }}>Default Tone</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setTone(opt.value); markDirty(); }}
                className={`rounded-lg border p-2.5 text-center transition-all ${
                  tone === opt.value
                    ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-medium text-white">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="space-y-2">
          <label htmlFor="pref-instructions" className="text-sm font-medium" style={{ color: "#8AACAC" }}>
            Custom Instructions
          </label>
          <textarea
            id="pref-instructions"
            value={customInstructions}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setCustomInstructions(e.target.value);
                markDirty();
              }
            }}
            placeholder="e.g., Use simple language for low-literacy audiences."
            rows={2}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#2D5A5A]/50 focus:outline-none focus:ring-1 focus:ring-[#2D5A5A]/50"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Applied to all new generations</span>
            <span>{customInstructions.length}/500</span>
          </div>
        </div>

        {/* Save */}
        {isDirty && (
          <Button
            className="w-full gap-1.5"
            style={{ backgroundColor: "#C9725B" }}
            onClick={handleSave}
            disabled={setPreferences.isPending}
          >
            {setPreferences.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Preferences
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, SlidersHorizontal, MessageSquareText, ChevronDown, ChevronRight, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { ContentInput } from "~/components/slides/content-input";
import { ProviderSelector } from "~/components/slides/provider-selector";
import { BlockSelector } from "~/components/slides/block-selector";
import { GenerationStatus } from "~/components/slides/generation-status";
import { ThemeSelector } from "~/components/slides/theme-selector";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { FidelityLevel, ToneOption, VisualBlockType } from "~/lib/ai/types";

const FIDELITY_OPTIONS: {
  value: FidelityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "balanced",
    label: "Balanced",
    description:
      "Preserve key content and structure. AI may improve formatting and add transitions.",
  },
  {
    value: "verbatim",
    label: "Verbatim",
    description:
      "Preserve source text exactly. AI only assigns slide types, layouts, and speaker notes.",
  },
  {
    value: "creative",
    label: "Creative",
    description:
      "AI freely restructures and enhances for maximum presentation impact.",
  },
];

export default function NewDeckPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [sourceFormat, setSourceFormat] = useState<"plaintext" | "markdown" | "pdf" | "docx">("plaintext");
  const [slideCount, setSlideCount] = useState(70);
  const [llmProvider, setLlmProvider] = useState("anthropic");
  const [imageProvider, setImageProvider] = useState("multi");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [themeId, setThemeId] = useState("chw-cream");
  const [fidelity, setFidelity] = useState<FidelityLevel>("balanced");
  const [detectedFidelity, setDetectedFidelity] = useState<FidelityLevel | null>(null);
  const [userOverrodeFidelity, setUserOverrodeFidelity] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; format: string } | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<VisualBlockType[]>([]);
  const [tone, setTone] = useState<ToneOption>("training");
  const [customInstructions, setCustomInstructions] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "error">("idle");
  const [genError, setGenError] = useState("");

  const { data: providers } = api.deck.providers.useQuery();

  const detectFidelityMut = api.deck.detectFidelity.useMutation({
    onSuccess: (data) => {
      setDetectedFidelity(data.level);
      if (!userOverrodeFidelity) {
        setFidelity(data.level);
      }
    },
  });

  // Auto-detect fidelity when content changes (debounced)
  useEffect(() => {
    if (!content.trim() || content.length < 50) {
      setDetectedFidelity(null);
      return;
    }

    const timer = setTimeout(() => {
      detectFidelityMut.mutate({ content });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const parseFile = api.deck.parseFile.useMutation({
    onSuccess: (data) => {
      setContent(data.text);
      setSourceFormat(data.format as typeof sourceFormat);
    },
    onError: (err) => toast.error(err.message),
  });

  const generate = api.deck.generate.useMutation({
    onSuccess: (deck) => {
      if (deck) {
        toast.success("Deck creation started!");
        router.push(`/admin/slides/${deck.id}?new=1`);
      }
    },
    onError: (err) => {
      setGenStatus("error");
      setGenError(err.message);
    },
  });

  const handleFileUpload = (base64: string, filename: string) => {
    setUploadedFile({ name: filename, format: filename.split(".").pop() ?? "unknown" });
    parseFile.mutate({ base64, filename });
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setContent("");
    setSourceFormat("plaintext");
  };

  const handleFidelityChange = useCallback((level: FidelityLevel) => {
    setFidelity(level);
    setUserOverrodeFidelity(true);
  }, []);

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error("Please enter a deck title");
      return;
    }
    if (!content.trim()) {
      toast.error("Please provide some content");
      return;
    }

    setGenStatus("generating");
    setGenError("");

    generate.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      content,
      sourceFormat,
      slideCount,
      llmProvider: llmProvider as "openai" | "anthropic" | "xai",
      imageProvider: imageProvider as "dalle3" | "gpt-image-1" | "stability" | "replicate" | "leonardo" | "multi" | "disabled",
      themeId,
      fidelity,
      selectedBlocks: selectedBlocks.length > 0 ? selectedBlocks : undefined,
      tone,
      customInstructions: customInstructions.trim() || undefined,
    });
  };

  const isGenerating = genStatus === "generating";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/slides">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" aria-label="Back to decks">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">New Deck</h1>
      </div>

      {isGenerating ? (
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <GenerationStatus status="generating" provider={llmProvider} slideCount={slideCount} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {genStatus === "error" && (
            <GenerationStatus status="error" error={genError} />
          )}

          <Card className="border-0 bg-white/5">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <label htmlFor="deck-title" className="text-sm font-medium text-gray-300">
                  Deck Title
                </label>
                <Input
                  id="deck-title"
                  placeholder="e.g., CHW Malaria Prevention Training"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:border-[#2D5A5A]/50 focus-visible:ring-[#2D5A5A]/50"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="deck-description" className="text-sm font-medium text-gray-300">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <Input
                  id="deck-description"
                  placeholder="Brief description of the training content"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus-visible:border-[#2D5A5A]/50 focus-visible:ring-[#2D5A5A]/50"
                />
              </div>

              <ContentInput
                value={content}
                onChange={(v) => {
                  setContent(v);
                  if (!uploadedFile) setSourceFormat("plaintext");
                }}
                onFileUpload={handleFileUpload}
                isUploading={parseFile.isPending}
                uploadedFile={uploadedFile}
                onClearFile={handleClearFile}
              />

              {/* Fidelity Slider */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Source Fidelity
                  </label>
                  {detectedFidelity && (
                    <span className="rounded-full bg-[#2D5A5A]/20 px-2 py-0.5 text-[10px] font-medium text-[#5B8A8A]">
                      Auto-detected: {detectedFidelity}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {FIDELITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFidelityChange(opt.value)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        fidelity === opt.value
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="mb-1 text-sm font-medium text-white">
                        {opt.label}
                      </div>
                      <p className="text-[11px] leading-snug text-gray-400">
                        {opt.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="new-slide-count" className="text-sm font-medium text-gray-300">
                  Max Slides
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="new-slide-count"
                    type="range"
                    min={5}
                    max={200}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#2D5A5A]"
                  />
                  <span className="w-12 text-center text-sm font-medium text-white">
                    {slideCount}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Maximum slides to generate (fewer if content is shorter)
                </p>
              </div>

              {/* Tone */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Writing Tone
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    { value: "training" as const, label: "Training", desc: "Step-by-step, pedagogical" },
                    { value: "academic" as const, label: "Academic", desc: "Formal, citations-style" },
                    { value: "professional" as const, label: "Professional", desc: "Formal, evidence-based" },
                    { value: "conversational" as const, label: "Conversational", desc: "Warm, direct" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTone(opt.value)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        tone === opt.value
                          ? "border-[#5B8A8A] bg-[#2D5A5A]/15"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-medium text-white">{opt.label}</div>
                      <p className="mt-0.5 text-[10px] text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-3">
                <label htmlFor="new-custom-instructions" className="text-sm font-medium text-gray-300">
                  Custom Instructions <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="new-custom-instructions"
                  value={customInstructions}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) setCustomInstructions(e.target.value);
                  }}
                  placeholder="e.g., Use simple language for low-literacy audiences. Include malaria prevention messaging."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#2D5A5A]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2D5A5A]/50"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Extra guidance for the AI when generating slides</span>
                  <span>{customInstructions.length}/1000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings — collapsed by default */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center gap-2 px-6 py-4 text-left text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Advanced Settings
              {showAdvanced ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>
            {showAdvanced && providers && (
              <div className="space-y-6 border-t border-white/5 px-6 pb-6 pt-4">
                <ProviderSelector
                  label="AI Text Provider"
                  providers={providers.llm.filter((p) => p.configured)}
                  selected={llmProvider}
                  onSelect={setLlmProvider}
                />

                <ProviderSelector
                  label="Image Generation"
                  providers={[
                    {
                      id: "multi",
                      name: "Auto Mix",
                      description: "Rotate across engines with mixed realistic & abstract styles",
                      pros: ["Visual variety", "Best of each engine", "Alternating styles"],
                      cons: [],
                      costTier: "medium",
                      configured: true,
                    },
                    {
                      id: "disabled",
                      name: "No Images",
                      description: "Generate slides without AI images",
                      pros: ["Fastest generation", "No extra cost"],
                      cons: [],
                      costTier: "low",
                      configured: true,
                    },
                    ...providers.image.filter((p) => p.configured),
                  ]}
                  selected={imageProvider}
                  onSelect={setImageProvider}
                />

                <BlockSelector
                  selected={selectedBlocks}
                  onSelect={setSelectedBlocks}
                  disabled={fidelity === "verbatim"}
                />
                {fidelity === "verbatim" && (
                  <p className="text-xs text-gray-500">
                    Visual blocks are disabled in verbatim mode
                  </p>
                )}
              </div>
            )}
          </div>

          <Card className="border-0 bg-white/5">
            <CardContent className="p-6">
              <ThemeSelector selected={themeId} onSelect={setThemeId} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!title.trim() || !content.trim() || isGenerating}
              className="gap-1.5 px-6"
              style={{ backgroundColor: "#C9725B" }}
            >
              <Sparkles className="h-4 w-4" />
              Generate Deck
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

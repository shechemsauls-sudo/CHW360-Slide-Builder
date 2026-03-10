"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  X,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  MessageSquareText,
  Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { ProviderSelector } from "~/components/slides/provider-selector";
import { ThemeSelector } from "~/components/slides/theme-selector";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { FidelityLevel, ToneOption } from "~/lib/ai/types";

interface BulkItem {
  id: string;
  title: string;
  content: string;
  sourceFormat: "plaintext" | "markdown" | "pdf" | "docx";
  filename?: string;
}

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

export default function BulkUploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [llmProvider, setLlmProvider] = useState("anthropic");
  const [imageProvider, setImageProvider] = useState("multi");
  const [themeId, setThemeId] = useState("chw-cream");
  const [slideCount, setSlideCount] = useState(70);
  const [fidelity, setFidelity] = useState<FidelityLevel>("balanced");
  const [tone, setTone] = useState<ToneOption>("training");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  const { data: providers } = api.deck.providers.useQuery();
  const { data: groups } = api.deck.listGroups.useQuery();
  const utils = api.useUtils();

  const parseFile = api.deck.parseFile.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const createGroup = api.deck.createGroup.useMutation({
    onSuccess: (group) => {
      if (group) {
        setGroupId(group.id);
        setShowNewGroupInput(false);
        setNewGroupName("");
        toast.success(`Group "${group.name}" created`);
        void utils.deck.listGroups.invalidate();
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkGenerate = api.deck.bulkGenerate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} deck${data.count !== 1 ? "s" : ""} queued for generation!`);
      router.push("/admin/slides");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).slice(0, 10 - items.length);
    await processFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - items.length);
    await processFiles(files);
    e.target.value = "";
  };

  const processFiles = async (files: File[]) => {
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "txt" || ext === "md") {
        const text = await file.text();
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        setItems((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            title,
            content: text,
            sourceFormat: ext === "md" ? "markdown" : "plaintext",
            filename: file.name,
          },
        ]);
      } else if (ext === "pdf" || ext === "docx" || ext === "doc") {
        const base64 = await fileToBase64(file);
        try {
          const result = await parseFile.mutateAsync({ base64, filename: file.name });
          const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          setItems((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              title,
              content: result.text,
              sourceFormat: result.format as "pdf" | "docx",
              filename: file.name,
            },
          ]);
        } catch {
          // error already toasted
        }
      } else {
        toast.error(`Unsupported file type: .${ext}`);
      }
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateTitle = (id: string, title: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const handleFidelityChange = useCallback((level: FidelityLevel) => {
    setFidelity(level);
  }, []);

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    createGroup.mutate({ name });
  };

  const handleGenerate = () => {
    if (items.length === 0) {
      toast.error("Add at least one file");
      return;
    }
    bulkGenerate.mutate({
      items: items.map((item) => ({
        title: item.title.trim(),
        content: item.content,
        sourceFormat: item.sourceFormat,
      })),
      llmProvider: llmProvider as "openai" | "anthropic" | "xai",
      imageProvider: imageProvider as "dalle3" | "gpt-image-1" | "stability" | "replicate" | "leonardo" | "multi" | "disabled",
      themeId,
      slideCount,
      fidelity,
      tone,
      customInstructions: customInstructions.trim() || undefined,
      groupId,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/slides">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" aria-label="Back to decks">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Upload</h1>
          <p className="text-sm text-gray-400">Upload multiple files to generate decks in batch</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Drop zone */}
        <Card className="border-0 bg-white/5">
          <CardContent className="p-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-white/10 py-10 transition-colors hover:border-[#5B8A8A]/40"
            >
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">
                Drop files here or{" "}
                <label className="cursor-pointer font-medium text-[#5B8A8A] hover:underline">
                  browse
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.md"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOCX, TXT, MD -- up to 10 files ({10 - items.length} remaining)
              </p>
            </div>

            {/* File list */}
            {items.length > 0 && (
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                    <Input
                      value={item.title}
                      onChange={(e) => updateTitle(item.id, e.target.value)}
                      className="h-7 flex-1 border-white/10 bg-transparent text-sm text-white"
                    />
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
                      {item.sourceFormat}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-500">
                      {Math.round(item.content.length / 1000)}k chars
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-gray-500 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generation Settings (main form) */}
        <Card className="border-0 bg-white/5">
          <CardContent className="space-y-5 p-6">
            {/* Fidelity Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-300">
                  Source Fidelity
                </label>
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

            {/* Slide Count */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Max Slides per Deck</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#2D5A5A]"
                />
                <span className="w-12 text-center text-sm font-medium text-white">{slideCount}</span>
              </div>
              <p className="text-xs text-gray-400">
                Maximum slides to generate per deck (fewer if content is shorter)
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
              <label className="text-sm font-medium text-gray-300">
                Custom Instructions <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
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

            {/* Group selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Add to Group</label>
              {!showNewGroupInput ? (
                <div className="flex items-center gap-2">
                  <select
                    value={groupId ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setShowNewGroupInput(true);
                      } else {
                        setGroupId(e.target.value || undefined);
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-gray-300"
                  >
                    <option value="">No group</option>
                    {groups?.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    <option disabled>---</option>
                    <option value="__new__">+ Create new group...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name"
                    className="h-9 flex-1 border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateGroup();
                      if (e.key === "Escape") {
                        setShowNewGroupInput(false);
                        setNewGroupName("");
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-green-400 hover:text-green-300"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || createGroup.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-gray-400 hover:text-white"
                    onClick={() => {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings -- collapsed by default */}
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
            <div className="space-y-5 border-t border-white/5 px-6 pb-6 pt-4">
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
            disabled={items.length === 0 || bulkGenerate.isPending}
            className="gap-1.5 px-6"
            style={{ backgroundColor: "#C9725B" }}
          >
            <Sparkles className="h-4 w-4" />
            Generate {items.length} Deck{items.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

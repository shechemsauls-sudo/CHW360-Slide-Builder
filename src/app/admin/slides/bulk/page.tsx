"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
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

export default function BulkUploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [llmProvider, setLlmProvider] = useState("anthropic");
  const [imageProvider, setImageProvider] = useState("disabled");
  const [themeId, setThemeId] = useState("chw-teal");
  const [slideCount, setSlideCount] = useState(20);
  const [fidelity, setFidelity] = useState<FidelityLevel>("balanced");
  const [tone, setTone] = useState<ToneOption>("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "done" | "error">("idle");

  const { data: providers } = api.deck.providers.useQuery();
  const { data: prefs } = api.deck.getPreferences.useQuery();
  const { data: groups } = api.deck.listGroups.useQuery();
  const [groupId, setGroupId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (prefs?.llmProvider) setLlmProvider(prefs.llmProvider);
    if (prefs?.fidelity) setFidelity(prefs.fidelity as FidelityLevel);
    if (prefs?.tone) setTone(prefs.tone as ToneOption);
    if (prefs?.customInstructions) setCustomInstructions(prefs.customInstructions);
  }, [prefs]);

  const parseFile = api.deck.parseFile.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const bulkGenerate = api.deck.bulkGenerate.useMutation({
    onSuccess: (data) => {
      setGenStatus("done");
      toast.success(`${data.count} deck${data.count !== 1 ? "s" : ""} generated!`);
      setTimeout(() => router.push("/admin/slides"), 2000);
    },
    onError: (err) => {
      setGenStatus("error");
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

  const handleGenerate = () => {
    if (items.length === 0) {
      toast.error("Add at least one file");
      return;
    }
    setGenStatus("generating");
    bulkGenerate.mutate({
      items: items.map((item) => ({
        title: item.title.trim(),
        content: item.content,
        sourceFormat: item.sourceFormat,
      })),
      llmProvider: llmProvider as "openai" | "anthropic" | "xai",
      imageProvider: imageProvider as "dalle3" | "gpt-image-1" | "stability" | "replicate" | "leonardo" | "disabled",
      themeId,
      slideCount,
      fidelity,
      tone,
      customInstructions: customInstructions.trim() || undefined,
      groupId,
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
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Upload</h1>
          <p className="text-sm text-gray-400">Upload multiple files to generate decks in batch</p>
        </div>
      </div>

      {isGenerating ? (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5B8A8A]" />
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Generating {items.length} deck{items.length !== 1 ? "s" : ""}...
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Processing sequentially to avoid rate limits. This may take a few minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : genStatus === "done" ? (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
            <p className="text-sm font-medium text-white">All decks generated! Redirecting...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {genStatus === "error" && (
            <Card className="border-0 border-l-2 border-l-[#C9725B] bg-[#C9725B]/10">
              <CardContent className="flex items-center gap-2 p-4">
                <AlertCircle className="h-4 w-4 text-[#C9725B]" />
                <p className="text-sm text-[#C9725B]">Some decks may have failed. Check the deck list.</p>
              </CardContent>
            </Card>
          )}

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
                  PDF, DOCX, TXT, MD — up to 10 files ({10 - items.length} remaining)
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

          {/* Settings */}
          {providers && (
            <Card className="border-0 bg-white/5">
              <CardContent className="space-y-5 p-6">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Slide Count (per deck)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={5}
                      max={120}
                      value={slideCount}
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-[#2D5A5A]"
                    />
                    <span className="w-12 text-center text-sm font-medium text-white">{slideCount}</span>
                  </div>
                </div>

                {groups && groups.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Add to Group</label>
                    <select
                      value={groupId ?? ""}
                      onChange={(e) => setGroupId(e.target.value || undefined)}
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-gray-300"
                    >
                      <option value="">No group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 bg-white/5">
            <CardContent className="p-6">
              <ThemeSelector selected={themeId} onSelect={setThemeId} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={items.length === 0 || isGenerating}
              className="gap-1.5 px-6"
              style={{ backgroundColor: "#C9725B" }}
            >
              <Sparkles className="h-4 w-4" />
              Generate {items.length} Deck{items.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
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

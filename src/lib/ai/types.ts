export interface SlideData {
  id: string;
  order: number;
  type:
    | "title"
    | "section"
    | "content"
    | "bullets"
    | "comparison"
    | "image"
    | "activity"
    | "quote"
    | "closing";
  title: string;
  body: string;
  speakerNotes: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  layout: "full" | "split-left" | "split-right" | "centered" | "two-column";
}

export type FidelityLevel = "verbatim" | "balanced" | "creative";

export const VISUAL_BLOCK_TYPES = [
  "info-box",
  "key-stat",
  "numbered-steps",
  "flow-diagram",
  "comparison-table",
  "checklist",
  "quote-block",
  "highlight-box",
  "timeline",
  "icon-grid",
  "bar-chart",
  "pie-chart",
  "line-chart",
  "area-chart",
  "radar-chart",
  "progress-bars",
  "metric-row",
] as const;

export type VisualBlockType = (typeof VISUAL_BLOCK_TYPES)[number];

export interface GenerateInput {
  content: string;
  title: string;
  description?: string;
  slideCount?: number;
  fidelity?: FidelityLevel;
  selectedBlocks?: VisualBlockType[];
}

export interface RegenerateInput {
  slide: SlideData;
  feedback: string;
  context: {
    prevSlide?: SlideData;
    nextSlide?: SlideData;
    deckTitle: string;
  };
}

export interface GenerationResult {
  slides: SlideData[];
  tokensUsed: number;
  model: string;
}

export interface LLMProvider {
  id: string;
  generateSlides(input: GenerateInput): Promise<GenerationResult>;
  regenerateSlide(input: RegenerateInput): Promise<SlideData>;
}

export interface ImageProvider {
  id: string;
  generateImage(prompt: string): Promise<Buffer>;
}

export interface ProviderMeta {
  id: string;
  name: string;
  description: string;
  type: "llm" | "image";
  envVar: string;
  pros: string[];
  cons: string[];
  costTier: "low" | "medium" | "high";
}

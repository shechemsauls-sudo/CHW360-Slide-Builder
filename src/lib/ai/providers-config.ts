import type { ProviderMeta } from "./types";

export const LLM_PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    name: "OpenAI GPT-4o",
    description: "Fast, reliable structured output with JSON mode",
    type: "llm",
    envVar: "OPENAI_API_KEY",
    pros: ["Reliable JSON output", "Fast generation", "Good at structured content"],
    cons: ["Higher cost per token"],
    costTier: "medium",
  },
  {
    id: "anthropic",
    name: "Claude Sonnet",
    description: "Excellent writing quality and nuanced content",
    type: "llm",
    envVar: "ANTHROPIC_API_KEY",
    pros: ["Superior writing quality", "Nuanced speaker notes", "Great at health content"],
    cons: ["No native JSON mode"],
    costTier: "medium",
  },
  {
    id: "xai",
    name: "Grok (xAI)",
    description: "Fast reasoning model from xAI",
    type: "llm",
    envVar: "XAI_API_KEY",
    pros: ["Fast generation", "Strong reasoning", "Good at structured output"],
    cons: ["Newer model, less tested"],
    costTier: "medium",
  },
];

export const IMAGE_PROVIDERS: ProviderMeta[] = [
  {
    id: "dalle3",
    name: "DALL-E 3",
    description: "High-quality image generation from OpenAI",
    type: "image",
    envVar: "OPENAI_API_KEY",
    pros: ["High quality", "Good text rendering", "Consistent style"],
    cons: ["~$0.04 per image"],
    costTier: "medium",
  },
  {
    id: "gpt-image-1",
    name: "GPT Image 1",
    description: "Latest OpenAI image model with improved quality",
    type: "image",
    envVar: "OPENAI_API_KEY",
    pros: ["Best quality", "Latest model", "Better prompt following"],
    cons: ["Higher cost per image"],
    costTier: "high",
  },
  {
    id: "stability",
    name: "Stability AI",
    description: "Stable Diffusion 3 — high-quality open-source model",
    type: "image",
    envVar: "STABILITY_API_KEY",
    pros: ["High quality", "Good diversity", "Competitive pricing"],
    cons: ["Slower than DALL-E"],
    costTier: "medium",
  },
  {
    id: "replicate",
    name: "FLUX (Replicate)",
    description: "FLUX 1.1 Pro — state-of-the-art open model via Replicate",
    type: "image",
    envVar: "REPLICATE_API_TOKEN",
    pros: ["Excellent quality", "Great prompt following", "Photorealistic"],
    cons: ["Async generation (polling)"],
    costTier: "medium",
  },
  {
    id: "leonardo",
    name: "Leonardo AI",
    description: "Leonardo Phoenix — creative AI with PhotoReal mode",
    type: "image",
    envVar: "LEONARDO_API_KEY",
    pros: ["Photorealistic", "Creative styles", "Good at scenes"],
    cons: ["Async generation (polling)"],
    costTier: "medium",
  },
];

export function isProviderConfigured(envVar: string): boolean {
  return !!process.env[envVar];
}

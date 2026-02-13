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
    id: "gemini",
    name: "Google Gemini",
    description: "Google's multimodal AI model",
    type: "llm",
    envVar: "GEMINI_API_KEY",
    pros: ["Multimodal capabilities", "Competitive pricing"],
    cons: ["API key not configured"],
    costTier: "low",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Cost-effective open-source model",
    type: "llm",
    envVar: "DEEPSEEK_API_KEY",
    pros: ["Very low cost", "Good reasoning"],
    cons: ["API key not configured"],
    costTier: "low",
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
    description: "Stable Diffusion based generation",
    type: "image",
    envVar: "STABILITY_API_KEY",
    pros: ["Wide style range", "Fast"],
    cons: ["API key not configured"],
    costTier: "low",
  },
  {
    id: "replicate",
    name: "Replicate",
    description: "Access to various open-source image models",
    type: "image",
    envVar: "REPLICATE_API_TOKEN",
    pros: ["Model variety", "Pay per use"],
    cons: ["API key not configured"],
    costTier: "low",
  },
];

export function isProviderConfigured(envVar: string): boolean {
  return !!process.env[envVar];
}

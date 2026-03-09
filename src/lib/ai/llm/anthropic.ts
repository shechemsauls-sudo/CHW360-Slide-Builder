import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type {
  LLMProvider,
  GenerateInput,
  RegenerateInput,
  GenerationResult,
  SlideData,
} from "../types";
import { buildGeneratePrompt, buildRegeneratePrompt } from "./prompts";

const slideSchema = z.object({
  id: z.string(),
  order: z.number(),
  type: z.enum([
    "title", "section", "content", "bullets", "comparison",
    "image", "activity", "quote", "closing", "references",
  ]),
  title: z.string(),
  body: z.string(),
  speakerNotes: z.string(),
  imageUrl: z.string().nullable().default(null),
  imagePrompt: z.string().nullable().default(null),
  layout: z.enum(["full", "split-left", "split-right", "centered", "two-column", "image-full", "image-top"]).default("full"),
});

const slidesResponseSchema = z.object({
  slides: z.array(slideSchema),
});

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  return new Anthropic({ apiKey });
}

function extractJSON(text: string): string {
  // Try to find JSON in the response (Anthropic may wrap it in text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  throw new Error("No JSON found in response");
}

/**
 * Attempt to repair truncated JSON from LLM responses.
 * When max_tokens is hit, the JSON gets cut off mid-slide.
 * This finds the last complete slide object and closes the JSON.
 */
function repairTruncatedJSON(json: string): string {
  try {
    JSON.parse(json);
    return json;
  } catch {
    const lastComplete = json.lastIndexOf('},');
    if (lastComplete === -1) {
      throw new Error("Could not repair truncated JSON — no complete slides found");
    }

    const repaired = json.substring(0, lastComplete + 1) + ']}';

    JSON.parse(repaired);
    console.warn(`[anthropic] Repaired truncated JSON — kept content up to position ${lastComplete}`);
    return repaired;
  }
}

async function parseWithRetry(
  client: Anthropic,
  prompt: string,
  retries = 2,
): Promise<{ slides: SlideData[]; tokensUsed: number }> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 32000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt + "\n\nRespond with ONLY the JSON object. No other text." }],
    });

    const response = await stream.finalMessage();

    const content = response.content[0];
    if (content?.type !== "text" || !content.text) {
      lastError = new Error("Empty response from Anthropic");
      continue;
    }

    try {
      const jsonStr = extractJSON(content.text);
      const repaired = repairTruncatedJSON(jsonStr);
      const parsed = JSON.parse(repaired);
      const validated = slidesResponseSchema.parse(parsed);
      const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
      return { slides: validated.slides as SlideData[], tokensUsed };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Parse error");
    }
  }

  throw lastError ?? new Error("Failed to generate slides");
}

export const anthropicProvider: LLMProvider = {
  id: "anthropic",

  async generateSlides(input: GenerateInput): Promise<GenerationResult> {
    const client = getClient();
    const prompt = buildGeneratePrompt(input);
    const { slides, tokensUsed } = await parseWithRetry(client, prompt);

    return { slides, tokensUsed, model: "claude-sonnet-4-5-20250929" };
  },

  async regenerateSlide(input: RegenerateInput): Promise<SlideData> {
    const client = getClient();
    const prompt = buildRegeneratePrompt(input);

    const stream = client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt + "\n\nRespond with ONLY the JSON object. No other text." }],
    });

    const response = await stream.finalMessage();

    const content = response.content[0];
    if (content?.type !== "text" || !content.text) throw new Error("Empty response from Anthropic");

    const jsonStr = extractJSON(content.text);
    const parsed = JSON.parse(jsonStr);
    return slideSchema.parse(parsed) as SlideData;
  },

  async chat(prompt: string): Promise<string> {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    return block?.type === "text" ? block.text : "";
  },
};

import OpenAI from "openai";
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

function getClient(): OpenAI {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");
  return new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
}

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
    console.warn(`[xai] Repaired truncated JSON — kept content up to position ${lastComplete}`);
    return repaired;
  }
}

async function parseWithRetry(
  client: OpenAI,
  prompt: string,
  retries = 2,
): Promise<{ slides: SlideData[]; tokensUsed: number }> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    const response = await client.chat.completions.create({
      model: "grok-3",
      messages: [
        { role: "system", content: "You are a JSON-only assistant. Respond with valid JSON only, no other text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      lastError = new Error("Empty response from xAI");
      continue;
    }

    try {
      // Extract JSON if wrapped in text or markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const repaired = repairTruncatedJSON(jsonStr);
      const parsed = JSON.parse(repaired);
      const validated = slidesResponseSchema.parse(parsed);
      return {
        slides: validated.slides as SlideData[],
        tokensUsed: response.usage?.total_tokens ?? 0,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Parse error");
    }
  }

  throw lastError ?? new Error("Failed to generate slides");
}

export const xaiProvider: LLMProvider = {
  id: "xai",

  async generateSlides(input: GenerateInput): Promise<GenerationResult> {
    const client = getClient();
    const prompt = buildGeneratePrompt(input);
    const { slides, tokensUsed } = await parseWithRetry(client, prompt);

    return { slides, tokensUsed, model: "grok-3" };
  },

  async generateRaw(prompt: string): Promise<GenerationResult> {
    const client = getClient();
    const { slides, tokensUsed } = await parseWithRetry(client, prompt);
    return { slides, tokensUsed, model: "grok-3" };
  },

  async regenerateSlide(input: RegenerateInput): Promise<SlideData> {
    const client = getClient();
    const prompt = buildRegeneratePrompt(input);

    const response = await client.chat.completions.create({
      model: "grok-3",
      messages: [
        { role: "system", content: "You are a JSON-only assistant. Respond with valid JSON only, no other text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from xAI");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr);
    return slideSchema.parse(parsed) as SlideData;
  },

  async chat(prompt: string): Promise<string> {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: "grok-3-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });
    return response.choices[0]?.message?.content ?? "";
  },
};

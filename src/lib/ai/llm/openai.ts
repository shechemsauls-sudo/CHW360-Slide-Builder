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
    "image", "activity", "quote", "closing",
  ]),
  title: z.string(),
  body: z.string(),
  speakerNotes: z.string(),
  imageUrl: z.string().nullable().default(null),
  imagePrompt: z.string().nullable().default(null),
  layout: z.enum(["full", "split-left", "split-right", "centered", "two-column"]).default("full"),
});

const slidesResponseSchema = z.object({
  slides: z.array(slideSchema),
});

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

async function parseWithRetry(
  client: OpenAI,
  prompt: string,
  retries = 2,
): Promise<{ slides: SlideData[]; tokensUsed: number }> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      lastError = new Error("Empty response from OpenAI");
      continue;
    }

    try {
      const parsed = JSON.parse(content);
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

export const openaiProvider: LLMProvider = {
  id: "openai",

  async generateSlides(input: GenerateInput): Promise<GenerationResult> {
    const client = getClient();
    const prompt = buildGeneratePrompt(input);
    const { slides, tokensUsed } = await parseWithRetry(client, prompt);

    return { slides, tokensUsed, model: "gpt-4o" };
  },

  async regenerateSlide(input: RegenerateInput): Promise<SlideData> {
    const client = getClient();
    const prompt = buildRegeneratePrompt(input);

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content);
    return slideSchema.parse(parsed) as SlideData;
  },
};

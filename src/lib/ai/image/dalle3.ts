import OpenAI from "openai";
import type { ImageProvider } from "../types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

export const dalle3Provider: ImageProvider = {
  id: "dalle3",

  async generateImage(prompt: string): Promise<Buffer> {
    const client = getClient();

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      response_format: "b64_json",
      quality: "hd",
      style: "natural",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned from DALL-E 3");

    return Buffer.from(b64, "base64");
  },
};

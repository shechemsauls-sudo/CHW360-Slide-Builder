import OpenAI from "openai";
import type { ImageProvider } from "../types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

export const gptImage1Provider: ImageProvider = {
  id: "gpt-image-1",

  async generateImage(prompt: string): Promise<Buffer> {
    const client = getClient();

    // gpt-image-1 returns b64_json by default
    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",
    } as OpenAI.ImageGenerateParams);

    const data = (response as OpenAI.ImagesResponse).data;
    const b64 = data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned from gpt-image-1");

    return Buffer.from(b64, "base64");
  },
};

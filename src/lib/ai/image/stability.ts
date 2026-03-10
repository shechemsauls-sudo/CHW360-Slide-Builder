import type { ImageProvider } from "../types";

/**
 * Stability AI image provider — uses Stable Diffusion 3 via REST API.
 * Env: STABILITY_API_KEY
 */
export const stabilityProvider: ImageProvider = {
  id: "stability",

  async generateImage(prompt: string): Promise<Buffer> {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) throw new Error("STABILITY_API_KEY not configured");

    const body = new FormData();
    body.append("prompt", prompt);
    body.append("output_format", "png");
    body.append("aspect_ratio", "16:9");
    body.append("negative_prompt", "low quality, blurry, text, watermark, clipart, cartoon, abstract, dark, moody, clinical, staged, artificial, religious symbols, crosses");

    const res = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body,
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Stability AI error (${res.status}): ${errText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  },
};

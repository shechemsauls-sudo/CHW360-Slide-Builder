import type { ImageProvider } from "../types";

/**
 * Replicate image provider — uses FLUX 1.1 Pro via predictions API.
 * Env: REPLICATE_API_TOKEN
 */
export const replicateProvider: ImageProvider = {
  id: "replicate",

  async generateImage(prompt: string): Promise<Buffer> {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new Error("REPLICATE_API_TOKEN not configured");

    // Create prediction
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-1.1-pro",
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: "png",
          output_quality: 90,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "Unknown error");
      throw new Error(`Replicate create error (${createRes.status}): ${errText}`);
    }

    const prediction = (await createRes.json()) as {
      id: string;
      status: string;
      output?: string | string[];
      error?: string;
      urls: { get: string };
    };

    // Poll for completion (max 60s)
    const deadline = Date.now() + 60_000;
    let result = prediction;

    while (result.status !== "succeeded" && result.status !== "failed") {
      if (Date.now() > deadline) throw new Error("Replicate prediction timed out");
      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(result.urls.get, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      result = (await pollRes.json()) as typeof prediction;
    }

    if (result.status === "failed") {
      throw new Error(`Replicate prediction failed: ${result.error ?? "Unknown error"}`);
    }

    // Output is a URL string or array of URLs
    const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    if (!outputUrl) throw new Error("No output from Replicate");

    const imageRes = await fetch(outputUrl);
    if (!imageRes.ok) throw new Error("Failed to download Replicate image");

    const arrayBuf = await imageRes.arrayBuffer();
    return Buffer.from(arrayBuf);
  },
};

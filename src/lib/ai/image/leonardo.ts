import type { ImageProvider } from "../types";

/**
 * Leonardo AI image provider — uses Leonardo Phoenix via REST API.
 * Env: LEONARDO_API_KEY
 */
export const leonardoProvider: ImageProvider = {
  id: "leonardo",

  async generateImage(prompt: string): Promise<Buffer> {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) throw new Error("LEONARDO_API_KEY not configured");

    // Create generation
    const createRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Leonardo Phoenix
        width: 1472,
        height: 832,
        num_images: 1,
        alchemy: true,
        photoReal: true,
        photoRealVersion: "v2",
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text().catch(() => "Unknown error");
      throw new Error(`Leonardo create error (${createRes.status}): ${errText}`);
    }

    const createData = (await createRes.json()) as {
      sdGenerationJob?: { generationId: string };
    };

    const generationId = createData.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("No generation ID from Leonardo");

    // Poll for completion (max 60s)
    const deadline = Date.now() + 60_000;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );

      if (!pollRes.ok) continue;

      const pollData = (await pollRes.json()) as {
        generations_by_pk?: {
          status: string;
          generated_images?: Array<{ url: string }>;
        };
      };

      const gen = pollData.generations_by_pk;
      if (gen?.status === "COMPLETE" && gen.generated_images?.[0]?.url) {
        const imageRes = await fetch(gen.generated_images[0].url);
        if (!imageRes.ok) throw new Error("Failed to download Leonardo image");
        const arrayBuf = await imageRes.arrayBuffer();
        return Buffer.from(arrayBuf);
      }

      if (gen?.status === "FAILED") {
        throw new Error("Leonardo generation failed");
      }
    }

    throw new Error("Leonardo generation timed out");
  },
};

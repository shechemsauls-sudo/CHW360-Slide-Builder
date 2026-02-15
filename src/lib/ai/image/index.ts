import type { ImageProvider } from "../types";
import { IMAGE_PROVIDERS, isProviderConfigured } from "../providers-config";
import { dalle3Provider } from "./dalle3";
import { gptImage1Provider } from "./gpt-image-1";

const providers: Record<string, ImageProvider> = {
  dalle3: dalle3Provider,
  "gpt-image-1": gptImage1Provider,
};

export function getImageProvider(id: string): ImageProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Image provider "${id}" not available`);

  const meta = IMAGE_PROVIDERS.find((p) => p.id === id);
  if (meta && !isProviderConfigured(meta.envVar)) {
    throw new Error(`${meta.name} API key not configured`);
  }

  return provider;
}

export function getAvailableImageProviders() {
  return IMAGE_PROVIDERS.map((meta) => ({
    ...meta,
    configured: isProviderConfigured(meta.envVar),
  }));
}

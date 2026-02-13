import type { ImageProvider } from "../types";
import { IMAGE_PROVIDERS, isProviderConfigured } from "../providers-config";

// Image providers are stubbed for Phase 2a — wired in Phase 2c
const providers: Record<string, ImageProvider> = {};

export function getImageProvider(id: string): ImageProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Image provider "${id}" not yet implemented`);

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

import type { LLMProvider } from "../types";
import { LLM_PROVIDERS, isProviderConfigured } from "../providers-config";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";

const providers: Record<string, LLMProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
};

export function getLLMProvider(id: string): LLMProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Unknown LLM provider: ${id}`);

  const meta = LLM_PROVIDERS.find((p) => p.id === id);
  if (meta && !isProviderConfigured(meta.envVar)) {
    throw new Error(`${meta.name} API key not configured`);
  }

  return provider;
}

export function getAvailableLLMProviders() {
  return LLM_PROVIDERS.map((meta) => ({
    ...meta,
    configured: isProviderConfigured(meta.envVar),
  }));
}

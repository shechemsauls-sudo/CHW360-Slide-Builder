"use client";

import { ProviderInfoCard } from "./provider-info-card";

interface ProviderItem {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  costTier: string;
  configured: boolean;
}

interface ProviderSelectorProps {
  label: string;
  providers: ProviderItem[];
  selected: string;
  onSelect: (id: string) => void;
}

export function ProviderSelector({
  label,
  providers,
  selected,
  onSelect,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <ProviderInfoCard
            key={provider.id}
            provider={provider}
            selected={selected === provider.id}
            onSelect={() => onSelect(provider.id)}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { getAllThemes, type SlideTheme } from "~/lib/themes";
import { Palette } from "lucide-react";

interface ThemeSelectorProps {
  selected: string;
  onSelect: (themeId: string) => void;
}

export function ThemeSelector({ selected, onSelect }: ThemeSelectorProps) {
  const themes = getAllThemes();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-gray-400" />
        <label className="text-sm font-medium text-gray-300">Theme</label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selected === theme.id}
            onSelect={() => onSelect(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: SlideTheme;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-2 text-left transition-all ${
        isSelected
          ? "border-[#5B8A8A] ring-1 ring-[#5B8A8A]/50"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Mini slide preview */}
      <div
        className="mb-2 overflow-hidden rounded"
        style={{
          aspectRatio: "16 / 9",
          background: theme.gradient?.background ?? theme.colors.background,
        }}
      >
        <div className="flex h-full flex-col justify-center px-3 py-2">
          <div
            className="mb-1 h-1 w-8 rounded"
            style={{ backgroundColor: theme.colors.accent }}
          />
          <div
            className="mb-1 text-[7px] font-bold leading-tight"
            style={{ color: theme.colors.text, fontFamily: theme.typography.headingFont }}
          >
            Slide Title
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 w-full rounded" style={{ backgroundColor: `${theme.colors.text}20` }} />
            <div className="h-0.5 w-3/4 rounded" style={{ backgroundColor: `${theme.colors.text}20` }} />
            <div className="h-0.5 w-5/6 rounded" style={{ backgroundColor: `${theme.colors.text}20` }} />
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-white">{theme.name}</p>
      <p className="text-[10px] text-gray-500">{theme.description}</p>
    </button>
  );
}

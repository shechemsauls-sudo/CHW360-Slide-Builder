import { Layers } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export default function SlidesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Slide Builder</h1>

      <Card className="border-0 bg-white/5">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#2D5A5A20" }}
          >
            <Layers className="h-8 w-8" style={{ color: "#2D5A5A" }} />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Coming Soon</h2>
          <p className="max-w-md text-center text-gray-400">
            The AI-powered slide builder will let you create professional CHW training
            presentations from text input, complete with brand-consistent themes and
            PDF/PPTX export.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["AI Content Generation", "Brand Themes", "PDF Export", "PPTX Export", "Template Library"].map((feature) => (
              <span
                key={feature}
                className="rounded-full px-3 py-1 text-xs text-gray-400"
                style={{ backgroundColor: "rgba(45, 90, 90, 0.15)" }}
              >
                {feature}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

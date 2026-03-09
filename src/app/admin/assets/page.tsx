"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

function DownloadButton({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={label ?? `Download ${href}`}
    >
      <Download className="h-3 w-3" />
      Download
    </a>
  );
}

function CanvasDownloadButton({
  variant,
  label,
}: {
  variant: "light" | "dark";
  label: string;
}) {
  const download = useCallback(async () => {
    const W = 800;
    const H = 320;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = variant === "light" ? "#F5EDE6" : "#2D5A5A";
    ctx.fillRect(0, 0, W, H);

    // Load logo
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = "/chw/logo.png";
    });

    const logoSize = 64;
    const textX = W / 2 + 10;
    const centerY = H / 2;

    // Draw logo
    ctx.drawImage(img, textX - logoSize - 24 - 60, centerY - logoSize / 2, logoSize, logoSize);

    // Draw "CHW" bold
    ctx.font = "600 42px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = variant === "light" ? "#2D5A5A" : "#FFFFFF";
    ctx.textBaseline = "middle";
    const chwWidth = ctx.measureText("CHW").width;
    ctx.fillText("CHW", textX - 60, centerY);

    // Draw "360" light
    ctx.font = "300 42px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = variant === "light" ? "#6B8A8A" : "rgba(255,255,255,0.7)";
    ctx.fillText("360", textX - 60 + chwWidth, centerY);

    // Trigger download
    const link = document.createElement("a");
    link.download = `chw360-logo-${variant}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [variant]);

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={label}
    >
      <Download className="h-3 w-3" />
      Download
    </button>
  );
}

const serif = "var(--font-libre-baskerville)";

const colors = [
  { name: "Dark Teal", hex: "#2D5A5A", usage: "Nav, Footer, Headings" },
  { name: "Coral", hex: "#C9725B", usage: "CTAs, Accents" },
  { name: "Cream", hex: "#F5EDE6", usage: "Hero & Section Backgrounds" },
  { name: "Light Cream", hex: "#FAF7F4", usage: "Core Supports Background" },
  { name: "Container", hex: "#EDE4DA", usage: "Form Containers" },
  { name: "White", hex: "#FFFFFF", usage: "Cards, Form Fields" },
  { name: "Text Gray", hex: "#4A5568", usage: "Body Text" },
  { name: "Light Gray", hex: "#6B7280", usage: "Secondary Text" },
];

const heroImages = [
  { src: "/chw/hero-1.png", name: "Hero - Community Outreach" },
  { src: "/chw/hero-2.png", name: "Hero - Home Visit" },
  { src: "/chw/hero-3.png", name: "Hero - Field Engagement" },
  { src: "/chw/hero-4.png", name: "Hero - Wellness Coaching" },
  { src: "/chw/hero-5.png", name: "Hero - Training Workshop" },
];

const icons = [
  { src: "/chw/icon-chw.png", name: "Community Health Workers" },
  { src: "/chw/icon-health.png", name: "Public Health Departments" },
  { src: "/chw/icon-training.png", name: "Training Programs" },
];

export default function BrandAssetsPage() {
  useEffect(() => { document.title = "Brand Assets — CHW360"; }, []);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Brand Assets</h1>
        <p className="text-gray-400">Logo, colors, typography, and imagery for CHW360</p>
      </div>

      {/* Logo Section */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Logo</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="flex h-40 items-center justify-center" style={{ backgroundColor: "#F5EDE6" }}>
                <div className="flex items-center gap-3">
                  <Image src="/chw/logo.png" alt="CHW360 Logo" width={50} height={50} />
                  <span className="text-3xl tracking-tight" style={{ color: "#2D5A5A" }}>
                    <span className="font-semibold">CHW</span>
                    <span className="font-light" style={{ color: "#6B8A8A" }}>360</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/10 p-4">
                <p className="text-sm text-gray-400">On Light Background</p>
                <CanvasDownloadButton variant="light" label="Download logo on light background" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="flex h-40 items-center justify-center" style={{ backgroundColor: "#2D5A5A" }}>
                <div className="flex items-center gap-3">
                  <Image src="/chw/logo.png" alt="CHW360 Logo" width={50} height={50} />
                  <span className="text-3xl tracking-tight text-white">
                    <span className="font-semibold">CHW</span>
                    <span className="font-light text-white/70">360</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/10 p-4">
                <p className="text-sm text-gray-400">On Dark Background</p>
                <CanvasDownloadButton variant="dark" label="Download logo on dark background" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="flex items-center gap-8 bg-white/5 p-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-xl" style={{ backgroundColor: "#F5EDE6" }}>
                  <Image src="/chw/logo.png" alt="CHW360 Logo Icon" width={60} height={60} />
                </div>
                <div>
                  <p className="mb-2 font-medium text-white">Logo Icon</p>
                  <p className="text-sm text-gray-400">5-petal pinwheel design representing community, diversity, and health</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="font-mono text-xs text-gray-500">File: /chw/logo.png</p>
                    <DownloadButton href="/chw/logo.png" label="Download logo icon" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Typography</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-white/5">
            <CardContent className="p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">Headings</p>
              <p className="mb-2 text-3xl" style={{ fontFamily: serif, color: "#2D5A5A" }}>Libre Baskerville</p>
              <p className="mb-4 text-sm text-gray-400">Classic serif font for headings and titles</p>
              <div className="rounded-lg p-4" style={{ backgroundColor: "#F5EDE6" }}>
                <p className="text-2xl" style={{ fontFamily: serif, color: "#2D5A5A" }}>
                  Empowering Community<br />Health Workers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-white/5">
            <CardContent className="p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">Body Text</p>
              <p className="mb-2 text-3xl" style={{ color: "#4A5568" }}>System Sans-Serif</p>
              <p className="mb-4 text-sm text-gray-400">Clean, readable font for body copy</p>
              <div className="rounded-lg p-4" style={{ backgroundColor: "#F5EDE6" }}>
                <p className="text-[15px] leading-relaxed" style={{ color: "#4A5568" }}>
                  CHW360 provides training, resources, and support to help Community Health Workers learn, grow, and make a difference.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Color Palette */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Color Palette</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colors.map((color) => (
            <Card key={color.hex} className="overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="h-24" style={{ backgroundColor: color.hex }} />
                <div className="bg-white/10 p-4">
                  <p className="font-medium text-white">{color.name}</p>
                  <p className="font-mono text-sm text-gray-400">{color.hex}</p>
                  <p className="mt-1 text-xs text-gray-500">{color.usage}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Hero Images */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Hero Images</h2>
        <p className="mb-6 text-gray-400">Rotating carousel images showcasing diverse healthcare workers</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroImages.map((image) => (
            <Card key={image.src} className="overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="relative h-40 bg-white/5">
                  <Image src={image.src} alt={image.name} fill className="object-cover" />
                </div>
                <div className="flex items-center justify-between bg-white/10 p-3">
                  <div>
                    <p className="text-sm text-white">{image.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">{image.src}</p>
                  </div>
                  <DownloadButton href={image.src} label={`Download ${image.name}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Icons */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Audience Icons</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {icons.map((icon) => (
            <Card key={icon.src} className="overflow-hidden border-0">
              <CardContent className="p-0">
                <div className="flex h-32 items-center justify-center" style={{ backgroundColor: "#F5EDE6" }}>
                  <div className="relative h-20 w-24">
                    <Image src={icon.src} alt={icon.name} fill className="object-contain" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/10 p-4">
                  <div>
                    <p className="font-medium text-white">{icon.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">{icon.src}</p>
                  </div>
                  <DownloadButton href={icon.src} label={`Download ${icon.name}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Usage Guidelines */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Usage Guidelines</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-0 bg-white/5">
            <CardContent className="p-6">
              <h3 className="mb-3 font-semibold text-white">Do&apos;s</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>&#10003; Use Dark Teal for primary headings</li>
                <li>&#10003; Use Coral for CTAs and interactive elements</li>
                <li>&#10003; Maintain contrast between CHW (bold) and 360 (light)</li>
                <li>&#10003; Use cream backgrounds for warm, welcoming feel</li>
                <li>&#10003; Keep imagery diverse and inclusive</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/5">
            <CardContent className="p-6">
              <h3 className="mb-3 font-semibold text-white">Don&apos;ts</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>&#10007; Don&apos;t use logo without the pinwheel icon</li>
                <li>&#10007; Don&apos;t alter the color palette drastically</li>
                <li>&#10007; Don&apos;t use italic styling on headings</li>
                <li>&#10007; Don&apos;t place dark teal text on dark backgrounds</li>
                <li>&#10007; Don&apos;t crop the logo icon</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

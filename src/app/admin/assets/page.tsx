"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { brand } from "~/lib/brand";

// --- Constants ---

const LOGO_RATIO = 550 / 454; // natural width/height

const serif = "var(--font-libre-baskerville)";

const colors = [
  { name: "Dark Teal", hex: brand.teal, usage: "Nav, Footer, Headings" },
  { name: "Coral", hex: brand.coral, usage: "CTAs, Accents" },
  { name: "Cream", hex: brand.cream, usage: "Hero & Section Backgrounds" },
  { name: "Light Cream", hex: brand.creamLight, usage: "Core Supports Background" },
  { name: "Container", hex: brand.container, usage: "Form Containers" },
  { name: "White", hex: "#FFFFFF", usage: "Cards, Form Fields" },
  { name: "Text Gray", hex: brand.textGray, usage: "Body Text" },
  { name: "Light Gray", hex: brand.textLight, usage: "Secondary Text" },
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

// --- Helpers ---

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  focusY = 0.5,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) * focusY;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawWordmark(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  fontSize: number,
  tealColor: string, lightColor: string,
) {
  // Nudge down slightly — "middle" baseline aligns to typographic center
  // which sits high for all-caps text. Shift by ~5% of font size to
  // optically center the cap-height against the icon.
  const nudge = fontSize * -0.0375;
  ctx.textBaseline = "middle";
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = tealColor;
  const chwW = ctx.measureText("CHW").width;
  ctx.fillText("CHW", x, y + nudge);
  ctx.font = `300 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = lightColor;
  ctx.fillText("360", x + chwW, y + nudge);
}

function DownloadBtn({ onClick, loading, label }: { onClick?: () => void; loading?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      aria-label={label}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      Download
    </button>
  );
}

function DownloadLink({ href, label }: { href: string; label?: string }) {
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

// --- Logo Variant Download ---

type LogoVariant = "transparent" | "cream" | "teal";

const logoVariantConfig: Record<LogoVariant, {
  label: string;
  bgColor: string | null;
  tealColor: string;
  lightColor: string;
  previewBg: string;
  previewPattern?: boolean;
}> = {
  transparent: {
    label: "Transparent",
    bgColor: null,
    tealColor: brand.teal,
    lightColor: "#6B8A8A",
    previewBg: "transparent",
    previewPattern: true,
  },
  cream: {
    label: "On Cream",
    bgColor: brand.cream,
    tealColor: brand.teal,
    lightColor: "#6B8A8A",
    previewBg: brand.cream,
  },
  teal: {
    label: "On Dark Teal",
    bgColor: brand.teal,
    tealColor: "#FFFFFF",
    lightColor: "rgba(255,255,255,0.7)",
    previewBg: brand.teal,
  },
};

function LogoVariantCard({ variant }: { variant: LogoVariant }) {
  const cfg = logoVariantConfig[variant];

  const download = useCallback(async () => {
    const scale = 3;
    const W = 800;
    const H = 320;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    if (cfg.bgColor) {
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    const img = await loadImg("/chw/logo.png?v=2");

    const logoH = 96;
    const logoW = logoH * LOGO_RATIO;
    const centerY = H / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Measure text to center the whole lockup
    ctx.font = "600 80px system-ui, -apple-system, sans-serif";
    const chwWidth = ctx.measureText("CHW").width;
    ctx.font = "300 80px system-ui, -apple-system, sans-serif";
    const threeWidth = ctx.measureText("360").width;
    const gap = 20;
    const totalW = logoW + gap + chwWidth + threeWidth;
    const startX = (W - totalW) / 2;

    ctx.drawImage(img, startX, centerY - logoH / 2, logoW, logoH);
    drawWordmark(ctx, startX + logoW + gap, centerY, 80, cfg.tealColor, cfg.lightColor);

    const link = document.createElement("a");
    link.download = `chw360-logo-${variant}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }, [variant, cfg]);

  return (
    <Card className="overflow-hidden border-0">
      <CardContent className="p-0">
        <div
          className="flex h-40 items-center justify-center"
          style={cfg.previewPattern ? {
            backgroundImage: "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            backgroundColor: "#222",
          } : { backgroundColor: cfg.previewBg }}
        >
          <div className="flex items-center gap-4">
            <Image src="/chw/logo.png?v=2" alt="CHW360 Logo" width={550} height={454} className="h-16 w-auto" />
            <span className="-translate-y-0.5 text-[4rem] leading-none tracking-tight" style={{ color: cfg.tealColor }}>
              <span className="font-semibold">CHW</span>
              <span className="font-light" style={{ color: cfg.lightColor }}>360</span>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/10 p-4">
          <p className="text-sm text-gray-400">{cfg.label}</p>
          <DownloadBtn onClick={download} label={`Download logo ${cfg.label.toLowerCase()}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Icon Only Variant ---

function IconVariantCard({ variant }: { variant: LogoVariant }) {
  const cfg = logoVariantConfig[variant];

  const download = useCallback(async () => {
    const scale = 3;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    if (cfg.bgColor) {
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    const img = await loadImg("/chw/logo.png?v=2");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const pad = 64;
    const iconH = size - pad * 2;
    const iconW = iconH * LOGO_RATIO;
    ctx.drawImage(img, (size - iconW) / 2, pad, iconW, iconH);

    const link = document.createElement("a");
    link.download = `chw360-icon-${variant}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }, [variant, cfg]);

  return (
    <Card className="overflow-hidden border-0">
      <CardContent className="p-0">
        <div
          className="flex h-32 items-center justify-center"
          style={cfg.previewPattern ? {
            backgroundImage: "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            backgroundColor: "#222",
          } : { backgroundColor: cfg.previewBg }}
        >
          <Image src="/chw/logo.png?v=2" alt="CHW360 Icon" width={550} height={454} className="h-20 w-auto" />
        </div>
        <div className="flex items-center justify-between bg-white/10 p-4">
          <p className="text-sm text-gray-400">{cfg.label}</p>
          <DownloadBtn onClick={download} label={`Download icon ${cfg.label.toLowerCase()}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Social Banner Generator ---

type BannerType = "linkedin" | "facebook" | "og-image" | "email-sig";

const bannerConfig: Record<BannerType, {
  label: string;
  w: number;
  h: number;
  filename: string;
  description: string;
}> = {
  linkedin: { label: "LinkedIn Banner", w: 1584, h: 396, filename: "chw360-linkedin-banner.png", description: "1584 × 396 · Personal & Company pages" },
  facebook: { label: "Facebook Cover", w: 820, h: 312, filename: "chw360-facebook-cover.png", description: "820 × 312 · Page & Profile cover" },
  "og-image": { label: "Social Share (OG Image)", w: 1200, h: 630, filename: "chw360-og-share.png", description: "1200 × 630 · Link previews on all platforms" },
  "email-sig": { label: "Email Signature Banner", w: 600, h: 100, filename: "chw360-email-signature.png", description: "600 × 100 · Gmail, Outlook, Apple Mail" },
};

function SocialBanner({ type }: { type: BannerType }) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cfg = bannerConfig[type];

  const generate = useCallback(async () => {
    const W = cfg.w;
    const H = cfg.h;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Cream background
    ctx.fillStyle = brand.cream;
    ctx.fillRect(0, 0, W, H);

    const [logo, hero] = await Promise.all([
      loadImg("/chw/logo.png?v=2"),
      loadImg("/chw/hero-1.png"),
    ]);

    if (type === "email-sig") {
      // Compact horizontal layout: logo + wordmark + tagline
      const logoH = 60;
      const logoW = logoH * LOGO_RATIO;
      const pad = 20;

      // Teal left accent bar
      ctx.fillStyle = brand.teal;
      ctx.fillRect(0, 0, 6, H);

      ctx.drawImage(logo, pad + 6, (H - logoH) / 2, logoW, logoH);
      drawWordmark(ctx, pad + 6 + logoW + 14, H / 2 - 8, 36, brand.teal, "#6B8A8A");

      ctx.font = "400 14px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#5A6A6A";
      ctx.textBaseline = "top";
      ctx.fillText("Empowering Community Health Workers Across Texas", pad + 6 + logoW + 14, H / 2 + 16);

      // Coral accent dot
      ctx.fillStyle = brand.coral;
      ctx.beginPath();
      ctx.arc(W - 30, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      return canvas;
    }

    // --- Standard banner layout (LinkedIn, Facebook, OG) ---
    // Adjust proportions based on aspect ratio
    const isWide = W / H > 3; // very wide like LinkedIn
    const isTall = W / H < 2; // more square like OG image

    const imgStartPct = isTall ? 0.45 : isWide ? 0.42 : 0.44;
    const imgX = W * imgStartPct;
    const imgW = W - imgX;

    // Draw hero image
    coverDraw(ctx, hero, imgX, 0, imgW, H, 0.15);

    // Fade gradient
    const fadeW = isTall ? W * 0.25 : 320;
    const fadeGrad = ctx.createLinearGradient(imgX - 20, 0, imgX + fadeW, 0);
    fadeGrad.addColorStop(0, brand.cream);
    fadeGrad.addColorStop(0.35, brand.cream);
    fadeGrad.addColorStop(1, "rgba(245,237,230,0)");
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(imgX - 20, 0, fadeW + 20, H);

    // Top/bottom edge fades
    const edgeFade = 40;
    const topGrad = ctx.createLinearGradient(0, 0, 0, edgeFade);
    topGrad.addColorStop(0, "rgba(245,237,230,0.5)");
    topGrad.addColorStop(1, "rgba(245,237,230,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(imgX + fadeW, 0, W - imgX - fadeW, edgeFade);

    const botGrad = ctx.createLinearGradient(0, H - edgeFade, 0, H);
    botGrad.addColorStop(0, "rgba(245,237,230,0)");
    botGrad.addColorStop(1, "rgba(245,237,230,0.5)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(imgX + fadeW, H - edgeFade, W - imgX - fadeW, edgeFade);

    // --- Left branding ---
    const leftPad = isTall ? 56 : 72;

    // Scale text relative to canvas height
    const scale0 = H / 396; // normalize against LinkedIn height
    const logoH = Math.round(52 * scale0);
    const logoW2 = logoH * LOGO_RATIO;
    const wordmarkSize = Math.round(44 * scale0);
    const headingSize = Math.round(40 * scale0);
    const taglineSize = Math.round(16 * scale0);

    const logoY = Math.round(H * 0.16);
    ctx.drawImage(logo, leftPad, logoY, logoW2, logoH);
    drawWordmark(ctx, leftPad + logoW2 + 14, logoY + logoH / 2, wordmarkSize, brand.teal, "#6B8A8A");

    // Coral accent line
    const accentY = logoY + logoH + Math.round(24 * scale0);
    ctx.fillStyle = brand.coral;
    ctx.beginPath();
    ctx.roundRect(leftPad, accentY, 48, 3, 2);
    ctx.fill();

    // Heading
    ctx.textBaseline = "top";
    ctx.font = `normal ${headingSize}px 'Libre Baskerville', Georgia, serif`;
    ctx.fillStyle = brand.teal;
    const headingY = accentY + Math.round(18 * scale0);
    const lineH = Math.round(headingSize * 1.3);

    if (isTall) {
      // OG has more vertical space — 3 lines
      ctx.fillText("Empowering", leftPad, headingY);
      ctx.fillText("Community", leftPad, headingY + lineH);
      ctx.fillText("Health Workers", leftPad, headingY + lineH * 2);
    } else {
      ctx.fillText("Empowering Community", leftPad, headingY);
      ctx.fillText("Health Workers", leftPad, headingY + lineH);
    }

    // Tagline
    ctx.font = `400 ${taglineSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#5A6A6A";
    ctx.fillText("Training · Resources · Support", leftPad, H - Math.round(48 * scale0));

    return canvas;
  }, [type, cfg]);

  useEffect(() => {
    generate().then((c) => setPreviewUrl(c.toDataURL("image/png", 1.0)));
  }, [generate]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const canvas = await generate();
      const link = document.createElement("a");
      link.download = cfg.filename;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } finally {
      setGenerating(false);
    }
  }, [generate, cfg.filename]);

  return (
    <Card className="overflow-hidden border-0">
      <CardContent className="p-0">
        <div className="relative w-full overflow-hidden rounded-t-lg" style={{ aspectRatio: `${cfg.w}/${cfg.h}` }}>
          {previewUrl ? (
            <img src={previewUrl} alt={`${cfg.label} Preview`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[60px] items-center justify-center bg-white/5">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between bg-white/10 p-4">
          <div>
            <p className="text-sm text-white">{cfg.label}</p>
            <p className="mt-0.5 font-mono text-xs text-gray-500">{cfg.description}</p>
          </div>
          <DownloadBtn onClick={handleDownload} loading={generating} label={`Download ${cfg.label}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Page ---

export default function BrandAssetsPage() {
  useEffect(() => { document.title = "Brand Assets — CHW360"; }, []);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Brand Assets</h1>
        <p className="text-gray-400">Logo, colors, typography, and imagery for CHW360</p>
      </div>

      {/* Logo Variants */}
      <section>
        <h2 className="mb-2 text-xl font-semibold text-white">Logo</h2>
        <p className="mb-6 text-sm text-gray-400">Full lockup with icon + wordmark. Each variant downloads at 3x (2400 × 960) for print quality.</p>
        <div className="grid gap-6 sm:grid-cols-3">
          <LogoVariantCard variant="transparent" />
          <LogoVariantCard variant="cream" />
          <LogoVariantCard variant="teal" />
        </div>

        <h3 className="mb-2 mt-8 text-base font-medium text-white">Icon Only</h3>
        <p className="mb-4 text-sm text-gray-400">5-petal pinwheel — use when wordmark is already established nearby. Downloads at 3x (1536 × 1536).</p>
        <div className="grid gap-6 sm:grid-cols-3">
          <IconVariantCard variant="transparent" />
          <IconVariantCard variant="cream" />
          <IconVariantCard variant="teal" />
        </div>
      </section>

      {/* Social Media & Marketing */}
      <section>
        <h2 className="mb-2 text-xl font-semibold text-white">Social Media & Marketing</h2>
        <p className="mb-6 text-sm text-gray-400">Ready-to-use banners and share images. All export at 2x retina.</p>
        <div className="space-y-6">
          <SocialBanner type="linkedin" />
          <SocialBanner type="facebook" />
          <SocialBanner type="og-image" />
          <SocialBanner type="email-sig" />
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Typography</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="overflow-hidden border-0 bg-white/5">
            <CardContent className="p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">Headings</p>
              <p className="mb-2 text-3xl" style={{ fontFamily: serif, color: brand.teal }}>Libre Baskerville</p>
              <p className="mb-4 text-sm text-gray-400">Classic serif font for headings and titles</p>
              <div className="rounded-lg p-4" style={{ backgroundColor: brand.cream }}>
                <p className="text-2xl" style={{ fontFamily: serif, color: brand.teal }}>
                  Empowering Community<br />Health Workers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-white/5">
            <CardContent className="p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">Body Text</p>
              <p className="mb-2 text-3xl" style={{ color: brand.textGray }}>System Sans-Serif</p>
              <p className="mb-4 text-sm text-gray-400">Clean, readable font for body copy</p>
              <div className="rounded-lg p-4" style={{ backgroundColor: brand.cream }}>
                <p className="text-[15px] leading-relaxed" style={{ color: brand.textGray }}>
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
                  <DownloadLink href={image.src} label={`Download ${image.name}`} />
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
                <div className="flex h-32 items-center justify-center" style={{ backgroundColor: brand.cream }}>
                  <div className="relative h-20 w-24">
                    <Image src={icon.src} alt={icon.name} fill className="object-contain" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/10 p-4">
                  <div>
                    <p className="font-medium text-white">{icon.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-gray-500">{icon.src}</p>
                  </div>
                  <DownloadLink href={icon.src} label={`Download ${icon.name}`} />
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

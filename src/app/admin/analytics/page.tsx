"use client";

import { useState, useEffect } from "react";
import { Eye, MousePointerClick, Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const PAGE_LABELS: Record<string, string> = {
  landing: "Landing Page",
};

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

function pageLabel(page: string) {
  return PAGE_LABELS[page] ?? page.charAt(0).toUpperCase() + page.slice(1);
}

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-600">No view data yet</p>;
  }

  const W = 600;
  const H = 180;
  const PAD = { top: 20, right: 16, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const gridMax = Math.ceil(maxCount / (maxCount > 10 ? 5 : 1)) * (maxCount > 10 ? 5 : 1);
  const gridLines = maxCount > 10 ? 4 : Math.min(gridMax, 4);

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - (d.count / gridMax) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${PAD.top + chartH} L ${points[0]!.x} ${PAD.top + chartH} Z`;

  const labelInterval = data.length > 14 ? 7 : data.length > 7 ? 3 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const y = PAD.top + chartH - (i / gridLines) * chartH;
        const val = Math.round((i / gridLines) * gridMax);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="fill-gray-600" fontSize={9}>
              {val}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D5A5A" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#2D5A5A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#analyticsAreaGrad)" />
      <path d={linePath} fill="none" stroke="#2D5A5A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r={data.length <= 14 ? 3 : 0} fill="#2D5A5A" stroke="#1a1a2e" strokeWidth={1.5} />
          <circle cx={p.x} cy={p.y} r={8} fill="transparent" className="cursor-pointer">
            <title>{`${new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${p.count} views`}</title>
          </circle>
        </g>
      ))}
      {data.map((d, i) => {
        const show = i === 0 || i === data.length - 1 || (i % labelInterval === 0 && i < data.length - 2);
        if (!show) return null;
        return (
          <text key={d.date} x={points[i]!.x} y={H - 4} textAnchor="middle" className="fill-gray-600" fontSize={9}>
            {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  useEffect(() => { document.title = "Analytics — CHW360"; }, []);

  const [page, setPage] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState(30);

  const { data: pagesData } = api.analytics.pages.useQuery();
  const { data: overview, isPlaceholderData: chartLoading } = api.analytics.overview.useQuery(
    { page, days: period },
    { placeholderData: (prev) => prev },
  );
  const { data: formStats } = api.analytics.formStats.useQuery(
    page ? { page } : undefined,
    { placeholderData: (prev) => prev },
  );

  const pages = pagesData ?? [];

  const stats = [
    { label: "Total Views", value: (overview?.totalViews ?? 0).toLocaleString(), icon: Eye, color: "#2D5A5A" },
    { label: "Today", value: (overview?.todayViews ?? 0).toLocaleString(), icon: Eye, color: "#5B8A8A" },
    { label: "Form Views", value: (formStats?.formViews ?? 0).toLocaleString(), icon: MousePointerClick, color: "#C9725B" },
    { label: "Submissions", value: (formStats?.formSubmits ?? 0).toLocaleString(), icon: Send, color: "#C9725B" },
  ];

  const viewsData = overview?.viewsPerDay ?? [];

  const funnelSteps = [
    { label: "Form Views", value: formStats?.formViews ?? 0, pct: 100 },
    {
      label: "Interactions",
      value: formStats?.formInteractions ?? 0,
      pct: (formStats?.formViews ?? 0) > 0
        ? ((formStats?.formInteractions ?? 0) / (formStats?.formViews ?? 1)) * 100
        : 0,
    },
    {
      label: "Submissions",
      value: formStats?.formSubmits ?? 0,
      pct: (formStats?.formViews ?? 0) > 0
        ? ((formStats?.formSubmits ?? 0) / (formStats?.formViews ?? 1)) * 100
        : 0,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Page filter */}
      {pages.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(undefined)}
            className={`h-7 px-2.5 text-xs ${
              !page
                ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All Pages
          </Button>
          {pages.map((p) => (
            <Button
              key={p.page}
              variant="ghost"
              size="sm"
              onClick={() => setPage(p.page)}
              className={`h-7 px-2.5 text-xs ${
                page === p.page
                  ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {pageLabel(p.page)}
              <span className="ml-1 text-[10px] text-gray-500">{p.count.toLocaleString()}</span>
            </Button>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="h-4.5 w-4.5" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-white">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Line Chart */}
        <div className="rounded-lg bg-white/5 p-4 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">
              Page Views{page ? ` · ${pageLabel(page)}` : ""}
            </h2>
            <div className="flex gap-0.5 rounded-md bg-white/5 p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriod(p.days)}
                  className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                    period === p.days
                      ? "bg-[#2D5A5A]/30 text-[#5B8A8A]"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`transition-opacity ${chartLoading ? "opacity-50" : ""}`}>
            <LineChart data={viewsData} />
          </div>
        </div>

        {/* Form Funnel */}
        <div className="rounded-lg bg-white/5 p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-gray-300">
            Form Funnel{page ? ` · ${pageLabel(page)}` : ""}
          </h2>
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{step.label}</span>
                  <span className="text-xs text-gray-500">
                    {step.value.toLocaleString()} ({step.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(step.pct, 1)}%`, backgroundColor: "#2D5A5A" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

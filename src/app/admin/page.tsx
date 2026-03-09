"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Eye, TrendingUp, Mail } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { useAdminSidebar } from "~/components/admin/admin-sidebar-context";

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

function LineChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-600">No view data yet</p>;
  }

  const W = 600;
  const H = 160;
  const PAD = { top: 20, right: 16, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  // Round up to nice grid line
  const gridMax = Math.ceil(maxCount / (maxCount > 10 ? 5 : 1)) * (maxCount > 10 ? 5 : 1);
  const gridLines = maxCount > 10 ? 4 : Math.min(gridMax, 4);

  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - (d.count / gridMax) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${PAD.top + chartH} L ${points[0]!.x} ${PAD.top + chartH} Z`;

  // Date labels: first, last, and evenly spaced
  const labelInterval = data.length > 14 ? 7 : data.length > 7 ? 3 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
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

      {/* Gradient fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D5A5A" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#2D5A5A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#2D5A5A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r={data.length <= 14 ? 3 : 0} fill="#2D5A5A" stroke="#1a1a2e" strokeWidth={1.5} />
          {/* Hover target */}
          <circle cx={p.x} cy={p.y} r={8} fill="transparent" className="cursor-pointer">
            <title>{`${new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${p.count} views`}</title>
          </circle>
        </g>
      ))}

      {/* Date labels */}
      {data.map((d, i) => {
        const show = i === 0 || i === data.length - 1 || (i % labelInterval === 0 && i < data.length - 2);
        if (!show) return null;
        return (
          <text
            key={d.date}
            x={points[i]!.x}
            y={H - 4}
            textAnchor="middle"
            className="fill-gray-600"
            fontSize={9}
          >
            {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        );
      })}
    </svg>
  );
}

export default function AdminOverview() {
  const { userRole } = useAdminSidebar();
  const router = useRouter();
  const [period, setPeriod] = useState(30);

  useEffect(() => { document.title = "Overview — CHW360"; }, []);

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/admin/slides");
    }
  }, [userRole, router]);

  const { data: contactStats } = api.contact.stats.useQuery(undefined, {
    enabled: userRole === "admin",
    placeholderData: (prev) => prev,
  });
  const { data: analyticsOverview, isPlaceholderData: chartLoading } = api.analytics.overview.useQuery(
    { days: period },
    {
      enabled: userRole === "admin",
      placeholderData: (prev) => prev,
    },
  );
  const { data: formStats } = api.analytics.formStats.useQuery(undefined, {
    enabled: userRole === "admin",
    placeholderData: (prev) => prev,
  });
  const { data: recentSubmissions } = api.contact.recent.useQuery({ limit: 5 }, {
    enabled: userRole === "admin",
    placeholderData: (prev) => prev,
  });

  if (userRole !== "admin") return null;

  const kpis = [
    { label: "Submissions", value: (contactStats?.total ?? 0).toLocaleString(), icon: Inbox, color: "#C9725B" },
    { label: "Unread", value: (contactStats?.unread ?? 0).toLocaleString(), icon: Mail, color: "#2D5A5A" },
    { label: "Views Today", value: (analyticsOverview?.todayViews ?? 0).toLocaleString(), icon: Eye, color: "#5B8A8A" },
    { label: "Conversion", value: `${formStats?.conversionRate ?? 0}%`, icon: TrendingUp, color: "#C9725B" },
  ];

  const viewsData = analyticsOverview?.viewsPerDay ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${kpi.color}15` }}
            >
              <kpi.icon className="h-4.5 w-4.5" style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-white">{kpi.value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Line Chart */}
        <div className="rounded-lg bg-white/5 p-4 lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">Page Views</h2>
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

        {/* Recent Submissions */}
        <div className="rounded-lg bg-white/5 p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-gray-300">Recent Submissions</h2>
          {!recentSubmissions || recentSubmissions.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-600">No submissions yet</p>
          ) : (
            <div className="space-y-1">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`truncate text-sm ${sub.isRead ? "text-gray-400" : "font-medium text-white"}`}>
                        {sub.name}
                      </span>
                      {!sub.isRead && (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 px-1 py-0 text-[9px]"
                          style={{ backgroundColor: "#C9725B20", color: "#C9725B" }}
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-600">
                      {sub.message.slice(0, 60)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-gray-600">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

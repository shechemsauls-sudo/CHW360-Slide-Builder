"use client";

import { useState } from "react";
import { Eye, MousePointerClick, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

const PAGE_LABELS: Record<string, string> = {
  landing: "Landing Page",
};

function pageLabel(page: string) {
  return PAGE_LABELS[page] ?? page.charAt(0).toUpperCase() + page.slice(1);
}

export default function AnalyticsPage() {
  const [page, setPage] = useState<string | undefined>(undefined);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const { data: pagesData } = api.analytics.pages.useQuery();
  const { data: overview } = api.analytics.overview.useQuery(
    page ? { page } : undefined
  );
  const { data: formStats } = api.analytics.formStats.useQuery(
    page ? { page } : undefined
  );

  const pages = pagesData ?? [];

  const stats = [
    { title: "Total Page Views", value: overview?.totalViews ?? 0, icon: Eye, color: "#2D5A5A" },
    { title: "Views Today", value: overview?.todayViews ?? 0, icon: Eye, color: "#5B8A8A" },
    { title: "Form Views", value: formStats?.formViews ?? 0, icon: MousePointerClick, color: "#C9725B" },
    { title: "Form Submissions", value: formStats?.formSubmits ?? 0, icon: Send, color: "#C9725B" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Page Source Filter */}
      {pages.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(undefined)}
            className={
              !page
                ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }
          >
            All Pages
          </Button>
          {pages.map((p) => (
            <Button
              key={p.page}
              variant="ghost"
              size="sm"
              onClick={() => setPage(p.page)}
              className={
                page === p.page
                  ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }
            >
              {pageLabel(p.page)}
              <span className="ml-1.5 text-xs text-gray-500">{p.count}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Chart */}
      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">
            Page Views (Last 30 Days){page ? ` — ${pageLabel(page)}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!overview?.viewsPerDay || overview.viewsPerDay.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No view data yet. Views will appear once the landing page receives traffic.</p>
          ) : (() => {
            const viewsData = overview.viewsPerDay;
            const maxCount = Math.max(...viewsData.map((d) => d.count), 1);
            return (
              <div>
                <div className="flex h-48 items-end gap-1">
                  {viewsData.map((day, index) => {
                    const heightPx = Math.max((day.count / maxCount) * 192, 6);
                    const isHovered = hoveredBar === index;
                    return (
                      <div
                        key={day.date}
                        className="group relative flex-1"
                        onMouseEnter={() => setHoveredBar(index)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                            {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            : {day.count} {day.count === 1 ? "view" : "views"}
                          </div>
                        )}
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${heightPx}px`,
                            backgroundColor: isHovered ? "#3D7A7A" : "#2D5A5A",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-1">
                  {viewsData.map((day, index) => {
                    const showLabel = index === 0 || index === viewsData.length - 1 || index % 7 === 0;
                    return (
                      <div key={day.date} className="flex-1 text-center">
                        {showLabel && (
                          <span className="text-[10px] text-gray-500">
                            {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Form Funnel */}
      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">
            Contact Form Funnel{page ? ` — ${pageLabel(page)}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Form Views", value: formStats?.formViews ?? 0, pct: 100 },
              {
                label: "Form Interactions",
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
            ].map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-300">{step.label}</span>
                  <span className="text-gray-400">
                    {step.value} ({step.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(step.pct, 1)}%`, backgroundColor: "#2D5A5A" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

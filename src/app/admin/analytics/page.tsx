"use client";

import { Eye, MousePointerClick, Send, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export default function AnalyticsPage() {
  const { data: overview } = api.analytics.overview.useQuery();
  const { data: formStats } = api.analytics.formStats.useQuery();

  const stats = [
    { title: "Total Page Views", value: overview?.totalViews ?? 0, icon: Eye, color: "#2D5A5A" },
    { title: "Views Today", value: overview?.todayViews ?? 0, icon: Eye, color: "#5B8A8A" },
    { title: "Form Views", value: formStats?.formViews ?? 0, icon: MousePointerClick, color: "#C9725B" },
    { title: "Form Submissions", value: formStats?.formSubmits ?? 0, icon: Send, color: "#C9725B" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

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
          <CardTitle className="text-white">Page Views (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {!overview?.viewsPerDay || overview.viewsPerDay.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No view data yet. Views will appear once the landing page receives traffic.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex h-48 items-end gap-1">
                {overview.viewsPerDay.map((day) => {
                  const max = Math.max(...overview.viewsPerDay.map((d) => d.count));
                  const height = max > 0 ? (day.count / max) * 100 : 0;
                  return (
                    <div key={day.date} className="group relative flex-1" title={`${day.date}: ${day.count}`}>
                      <div
                        className="w-full rounded-t transition-all hover:opacity-80"
                        style={{ height: `${Math.max(height, 2)}%`, backgroundColor: "#2D5A5A" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{overview.viewsPerDay[0]?.date}</span>
                <span>{overview.viewsPerDay[overview.viewsPerDay.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Funnel */}
      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Contact Form Funnel</CardTitle>
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

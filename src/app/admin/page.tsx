"use client";

import { Inbox, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";

export default function AdminOverview() {
  const { data: contactStats } = api.contact.stats.useQuery();
  const { data: analyticsOverview } = api.analytics.overview.useQuery();
  const { data: formStats } = api.analytics.formStats.useQuery();
  const { data: recentSubmissions } = api.contact.recent.useQuery({ limit: 5 });

  const kpis = [
    {
      title: "Total Submissions",
      value: contactStats?.total ?? 0,
      icon: Inbox,
      color: "#C9725B",
    },
    {
      title: "Unread",
      value: contactStats?.unread ?? 0,
      icon: Inbox,
      color: "#2D5A5A",
    },
    {
      title: "Page Views Today",
      value: analyticsOverview?.todayViews ?? 0,
      icon: Eye,
      color: "#5B8A8A",
    },
    {
      title: "Form Conversion",
      value: `${formStats?.conversionRate ?? 0}%`,
      icon: TrendingUp,
      color: "#C9725B",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-0 bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{kpi.title}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <kpi.icon className="h-6 w-6" style={{ color: kpi.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Submissions */}
      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentSubmissions || recentSubmissions.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{sub.name}</p>
                      {!sub.isRead && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: "#C9725B20", color: "#C9725B" }}
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-gray-400">{sub.email}</p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {sub.message.slice(0, 80)}
                      {sub.message.length > 80 ? "..." : ""}
                    </p>
                  </div>
                  <p className="ml-4 flex-shrink-0 text-xs text-gray-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Views Over Time */}
      <Card className="border-0 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Page Views (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {!analyticsOverview?.viewsPerDay || analyticsOverview.viewsPerDay.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No view data yet</p>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {analyticsOverview.viewsPerDay.map((day) => {
                const max = Math.max(...analyticsOverview.viewsPerDay.map((d) => d.count));
                const height = max > 0 ? (day.count / max) * 100 : 0;
                return (
                  <div key={day.date} className="group relative flex-1" title={`${day.date}: ${day.count} views`}>
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        backgroundColor: "#2D5A5A",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

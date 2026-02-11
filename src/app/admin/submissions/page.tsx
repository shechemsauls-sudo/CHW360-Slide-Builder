"use client";

import { useState } from "react";
import { Inbox, Mail, MailOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type Filter = "all" | "read" | "unread";

export default function SubmissionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, refetch } = api.contact.list.useQuery({
    filter,
    limit: 50,
    offset: 0,
  });

  const markRead = api.contact.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Read", value: "read" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-sm text-gray-400">{data?.total ?? 0} total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? "bg-[#C9725B]/10 text-[#C9725B] hover:bg-[#C9725B]/20 hover:text-[#C9725B]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {!data?.items || data.items.length === 0 ? (
          <Card className="border-0 bg-white/5">
            <CardContent className="py-12 text-center">
              <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-500" />
              <p className="text-gray-500">No submissions found</p>
            </CardContent>
          </Card>
        ) : (
          data.items.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <Card key={sub.id} className="border-0 bg-white/5">
                <CardContent className="p-4">
                  <div
                    className="flex cursor-pointer items-start justify-between"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {sub.isRead ? (
                          <MailOpen className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        ) : (
                          <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "#C9725B" }} />
                        )}
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
                      <p className="mt-1 text-sm text-gray-400">{sub.email}</p>
                      {sub.organization && (
                        <p className="text-sm text-gray-500">{sub.organization}</p>
                      )}
                      {!isExpanded && (
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {sub.message.slice(0, 100)}{sub.message.length > 100 ? "..." : ""}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                        {sub.message}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead.mutate({ id: sub.id, isRead: !sub.isRead });
                          }}
                        >
                          {sub.isRead ? "Mark as Unread" : "Mark as Read"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${sub.email}`);
                          }}
                        >
                          Reply via Email
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

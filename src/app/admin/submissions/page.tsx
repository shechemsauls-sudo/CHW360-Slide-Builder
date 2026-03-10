"use client";

import { useState, useEffect } from "react";
import { Inbox, Mail, MailOpen, MailCheck, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, X, Trash2, Download, CheckSquare } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type Filter = "all" | "read" | "unread";

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SubmissionsPage() {
  useEffect(() => { document.title = "Submissions — CHW360"; }, []);

  const [filter, setFilter] = useState<Filter>("all");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | "bulk" | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  const { data: sourcesData } = api.contact.sources.useQuery();

  const { data, isPlaceholderData } = api.contact.list.useQuery(
    {
      filter,
      source,
      limit: pageSize,
      offset: page * pageSize,
    },
    { placeholderData: (prev) => prev },
  );

  const utils = api.useUtils();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await utils.contact.exportCsv.fetch();
      const headers = ["Name", "Email", "Phone", "Organization", "Message", "Source", "Read", "Date"];
      const csvRows = rows.map((r) =>
        [
          escapeCsvField(r.name),
          escapeCsvField(r.email),
          escapeCsvField(r.phone),
          escapeCsvField(r.organization),
          escapeCsvField(r.message),
          escapeCsvField(r.source),
          r.isRead ? "Yes" : "No",
          new Date(r.createdAt).toISOString(),
        ].join(",")
      );
      const csv = [headers.join(","), ...csvRows].join("\n");
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`submissions-${date}.csv`, csv);
      toast.success(`Exported ${rows.length} submissions`);
    } catch {
      toast.error("Failed to export submissions");
    } finally {
      setIsExporting(false);
    }
  };

  const markRead = api.contact.markRead.useMutation({
    onSuccess: () => void utils.contact.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const bulkMarkRead = api.contact.bulkMarkRead.useMutation({
    onSuccess: (result) => {
      void utils.contact.list.invalidate();
      setSelected(new Set());
      toast.success(`Marked ${result.count} submissions as read`);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteSingle = api.contact.delete.useMutation({
    onSuccess: () => {
      void utils.contact.list.invalidate();
      setConfirmDelete(null);
      setExpandedId(null);
      toast.success("Submission deleted");
    },
    onError: (err) => toast.error(err.message),
  });
  const bulkDelete = api.contact.bulkDelete.useMutation({
    onSuccess: (result) => {
      void utils.contact.list.invalidate();
      setSelected(new Set());
      setConfirmDelete(null);
      toast.success(`Deleted ${result.count} submissions`);
    },
    onError: (err) => toast.error(err.message),
  });

  const unreadItems = data?.items.filter((s) => !s.isRead) ?? [];
  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((s) => selected.has(s.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((s) => s.id)));
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, data?.total ?? 0);

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Unread", value: "unread" },
    { label: "Read", value: "read" },
  ];

  const sources = sourcesData ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Submissions</h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${selectMode ? "text-[#7AACAC]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
            onClick={() => {
              if (selectMode) { setSelected(new Set()); }
              setSelectMode(!selectMode);
            }}
          >
            <CheckSquare className="mr-1.5 h-4 w-4" />
            {selectMode ? "Cancel" : "Select"}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {unreadItems.length > 0 && selected.size === 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
              disabled={bulkMarkRead.isPending || isPlaceholderData}
              onClick={() =>
                bulkMarkRead.mutate({
                  ids: unreadItems.map((s) => s.id),
                  isRead: true,
                })
              }
            >
              <MailCheck className="mr-1.5 h-4 w-4" />
              Mark all as read ({unreadItems.length})
            </Button>
          )}
          <span className="text-sm text-gray-500">{(data?.total ?? 0).toLocaleString()} total</span>
        </div>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-[#2D5A5A]/15 px-3 py-2 text-sm">
          <span className="font-medium text-[#5B8A8A]">{selected.size} selected</span>
          <div className="h-3.5 w-px bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
            disabled={bulkMarkRead.isPending || isPlaceholderData}
            onClick={() => bulkMarkRead.mutate({ ids: [...selected], isRead: true })}
          >
            <MailCheck className="mr-1 h-3.5 w-3.5" />
            Read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
            disabled={bulkMarkRead.isPending || isPlaceholderData}
            onClick={() => bulkMarkRead.mutate({ ids: [...selected], isRead: false })}
          >
            <Mail className="mr-1 h-3.5 w-3.5" />
            Unread
          </Button>
          <div className="h-3.5 w-px bg-white/10" />
          {confirmDelete === "bulk" ? (
            <>
              <span className="text-xs text-red-400">Delete {selected.size}?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed"
                disabled={bulkDelete.isPending || isPlaceholderData}
                onClick={() => bulkDelete.mutate({ ids: [...selected] })}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:bg-white/5 hover:text-white"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
              disabled={isPlaceholderData}
              onClick={() => setConfirmDelete("bulk")}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <button
            className="text-gray-500 hover:text-white"
            onClick={() => { setSelected(new Set()); setSelectMode(false); }}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => { setFilter(f.value); setPage(0); setSelected(new Set()); }}
              className={`h-7 px-2.5 text-xs ${
                filter === f.value
                  ? "bg-[#C9725B]/10 text-[#C9725B] hover:bg-[#C9725B]/20 hover:text-[#C9725B]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {sources.length > 1 && (
          <>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSource(undefined); setPage(0); setSelected(new Set()); }}
                className={`h-7 px-2.5 text-xs ${
                  !source
                    ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                All Sources
              </Button>
              {sources.map((s) => (
                <Button
                  key={s.source}
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSource(s.source); setPage(0); setSelected(new Set()); }}
                  className={`h-7 px-2.5 text-xs ${
                    source === s.source
                      ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {s.source}
                  <span className="ml-1 text-[10px] text-gray-500">{s.count}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Submissions List */}
      {!data?.items || data.items.length === 0 ? (
        <div className="py-16 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-500">No submissions found</p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-lg border border-white/5 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
          {/* Select all */}
          {selectMode && (
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 cursor-pointer rounded accent-[#2D5A5A]"
                aria-label="Select all submissions"
              />
              <span className="text-[11px] text-gray-500">
                {allSelected ? "Deselect all" : "Select all"}
              </span>
            </div>
          )}

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">Show</span>
              {[10, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setPage(0); setSelected(new Set()); }}
                  className={`rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                    pageSize === size
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">
                {data.total > 0 ? `${startItem}–${endItem} of ${data.total.toLocaleString()}` : "0"}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isPlaceholderData}
                className="rounded p-0.5 text-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-500"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isPlaceholderData}
                className="rounded p-0.5 text-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-500"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {data.items.map((sub, i) => {
            const isExpanded = expandedId === sub.id;
            const isSelected = selected.has(sub.id);
            return (
              <div
                key={sub.id}
                className={`transition-colors ${
                  i < data.items.length - 1 ? "border-b border-white/5" : ""
                } ${isSelected ? "bg-[#2D5A5A]/8" : sub.isRead ? "bg-transparent" : "bg-white/[0.02]"}`}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(sub.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-[#2D5A5A]"
                      aria-label={`Select submission from ${sub.name}`}
                    />
                  )}
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    aria-expanded={isExpanded}
                  >
                    {sub.isRead ? (
                      <MailOpen className="h-4 w-4 flex-shrink-0 text-gray-600" />
                    ) : (
                      <Mail className="h-4 w-4 flex-shrink-0 text-[#C9725B]" />
                    )}
                    <span className={`w-32 flex-shrink-0 truncate text-sm ${sub.isRead ? "text-gray-400" : "font-medium text-white"}`}>
                      {sub.name}
                    </span>
                    {!sub.isRead && (
                      <Badge
                        variant="secondary"
                        className="flex-shrink-0 px-1.5 py-0 text-[10px]"
                        style={{ backgroundColor: "#C9725B20", color: "#C9725B" }}
                      >
                        New
                      </Badge>
                    )}
                    <span className="hidden flex-shrink-0 text-xs text-gray-500 sm:inline">{sub.email}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-600">
                      {sub.message.slice(0, 80)}
                    </span>
                    {sources.length > 1 && (
                      <span className="hidden items-center gap-1 text-[10px] text-gray-600 md:flex">
                        <FileText className="h-3 w-3" />
                        {sub.source}
                      </span>
                    )}
                    <span className="flex-shrink-0 text-[11px] text-gray-600">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-12 py-3">
                    <div className="mb-2 flex items-baseline gap-3">
                      <span className="text-sm font-medium text-white">{sub.name}</span>
                      <span className="text-xs text-gray-500">{sub.email}</span>
                      {sub.organization && (
                        <span className="text-xs text-gray-600">· {sub.organization}</span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {sub.message}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-400 hover:text-white disabled:cursor-not-allowed"
                        disabled={markRead.isPending || isPlaceholderData}
                        onClick={() => markRead.mutate({ id: sub.id, isRead: !sub.isRead })}
                      >
                        {sub.isRead ? "Mark unread" : "Mark read"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                        onClick={() => window.open(`mailto:${sub.email}`)}
                      >
                        Reply
                      </Button>
                      <div className="flex-1" />
                      {confirmDelete === sub.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed"
                            disabled={deleteSingle.isPending || isPlaceholderData}
                            onClick={() => deleteSingle.mutate({ id: sub.id })}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-gray-500 hover:text-white"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-400/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed"
                          disabled={isPlaceholderData}
                          onClick={() => setConfirmDelete(sub.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

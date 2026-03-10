"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  MailOpen,
  FileText,
  Send,
  Loader2,
  Users,
  Building2,
  Phone,
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckSquare,
  Download,
  X,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "~/components/admin/rich-text-editor";

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

const PAGE_SIZES = [10, 25, 50, 100] as const;

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "lastContact", label: "Last Contact" },
  { value: "firstContact", label: "First Contact" },
  { value: "submissions", label: "Submissions" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];
type SortDir = "asc" | "desc";

const ORG_FILTER_OPTIONS = [
  { value: undefined as boolean | undefined, label: "All" },
  { value: true as boolean | undefined, label: "With Org" },
  { value: false as boolean | undefined, label: "Individual" },
] as const;

export default function CRMPage() {
  useEffect(() => { document.title = "Contacts — CHW360"; }, []);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortBy, setSortBy] = useState<SortBy>("lastContact");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hasOrg, setHasOrg] = useState<boolean | undefined>(undefined);
  const editorRef = useRef<RichTextEditorRef>(null);
  const noteEditorRef = useRef<RichTextEditorRef>(null);
  const [noteEditorKey, setNoteEditorKey] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: sourcesData } = api.crm.sources.useQuery();
  const sources = sourcesData ?? [];

  const { data, isPlaceholderData } = api.crm.list.useQuery(
    {
      search: debouncedSearch || undefined,
      source,
      hasOrg,
      sortBy,
      sortDir,
      limit: pageSize,
      offset: page * pageSize,
    },
    { placeholderData: (prev) => prev },
  );

  const { data: contactDetail } = api.crm.getContact.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId },
  );

  const utils = api.useUtils();

  const addNote = api.crm.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNoteEditorKey((k) => k + 1);
      utils.crm.getContact.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteNote = api.crm.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      utils.crm.getContact.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendEmail = api.crm.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email sent");
      setEmailSubject("");
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkDelete = api.crm.bulkDelete.useMutation({
    onSuccess: (result) => {
      void utils.crm.list.invalidate();
      setSelected(new Set());
      setSelectMode(false);
      setConfirmBulkDelete(false);
      toast.success(`Deleted ${result.count} contact${result.count !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportContacts = async () => {
    setIsExporting(true);
    try {
      const rows = await utils.crm.exportCsv.fetch();
      const headers = ["Name", "Email", "Phone", "Organization", "Source", "First Contact", "Last Contact"];
      const csvRows = rows.map((r) =>
        [
          escapeCsvField(r.name),
          escapeCsvField(r.email),
          escapeCsvField(r.phone),
          escapeCsvField(r.organization),
          escapeCsvField(r.source),
          r.firstContactAt ? new Date(r.firstContactAt).toISOString() : "",
          r.lastContactAt ? new Date(r.lastContactAt).toISOString() : "",
        ].join(",")
      );
      const csv = [headers.join(","), ...csvRows].join("\n");
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`contacts-${date}.csv`, csv);
      toast.success(`Exported ${rows.length} contacts`);
    } catch {
      toast.error("Failed to export contacts");
    } finally {
      setIsExporting(false);
    }
  };

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  function handleSort(field: SortBy) {
    if (sortBy === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
    setPage(0);
  }

  function handleAddNote(contactId: string) {
    const html = noteEditorRef.current?.getHTML() ?? "";
    if (!html.trim() || html === "<p></p>") return;
    addNote.mutate({ contactId, content: html });
  }

  function handleSendEmail(to: string) {
    const html = editorRef.current?.getHTML() ?? "";
    if (!emailSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!html.trim() || html === "<p></p>") {
      toast.error("Email body is required");
      return;
    }
    sendEmail.mutate({ to, subject: emailSubject, htmlBody: html });
  }

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  const items = data?.items ?? [];

  const allContactsSelected = items.length > 0 && items.every((c) => selected.has(c.id));
  const toggleSelectAll = () => {
    if (allContactsSelected) setSelected(new Set());
    else setSelected(new Set(items.map((c) => c.id)));
  };

  const toggleSelectContact = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <style jsx global>{`
        .note-content p { margin: 2px 0; }
        .note-content strong { color: #d1d5db; font-weight: 600; }
        .note-content em { font-style: italic; }
        .note-content s { text-decoration: line-through; color: #6b7280; }
        .note-content h2 { font-size: 0.875rem; font-weight: 600; color: #d1d5db; margin: 0.5em 0 0.25em; }
        .note-content ul { list-style-type: disc; padding-left: 1.5em; margin: 2px 0; }
        .note-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 2px 0; }
        .note-content li { margin: 0; }
        .note-content blockquote {
          border-left: 3px solid rgba(201, 114, 91, 0.4);
          padding-left: 0.75em;
          margin: 4px 0;
          color: #9ca3af;
          font-style: italic;
        }
        .note-content code {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 0.25em;
          padding: 0.1em 0.3em;
          font-size: 0.9em;
          color: #C9725B;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
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
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
            disabled={isExporting}
            onClick={handleExportContacts}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <span className="text-sm text-gray-500">{(data?.total ?? 0).toLocaleString()} total</span>
        </div>
      </div>

      {/* Filters row: Source pills + Org filter + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {sources.length > 1 && (
          <>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSource(undefined); setPage(0); }}
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
                  onClick={() => { setSource(s.source); setPage(0); }}
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
            <div className="h-4 w-px bg-white/10" />
          </>
        )}
        {/* Org filter */}
        <div className="flex gap-1">
          {ORG_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { setHasOrg(opt.value); setPage(0); }}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                hasOrg === opt.value
                  ? "bg-[#C9725B]/20 text-[#C9725B]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search contacts"
            className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#2D5A5A]/50"
          />
        </div>
      </div>

      {/* Sort + Pagination bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="mr-1 h-3 w-3 text-gray-600" />
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                sortBy === opt.value
                  ? "bg-[#2D5A5A]/30 text-[#5B8A8A]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
              {sortBy === opt.value && (
                sortDir === "asc" ? <ChevronUp className="ml-0.5 inline h-3 w-3" /> : <ChevronDown className="ml-0.5 inline h-3 w-3" />
              )}
            </button>
          ))}
        </div>
        {(data?.total ?? 0) > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">Show</span>
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => { setPageSize(size); setPage(0); }}
                  className={`rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                    pageSize === size
                      ? "bg-[#2D5A5A]/30 text-[#5B8A8A]"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data?.total ?? 0)} of {(data?.total ?? 0).toLocaleString()}
              </span>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded p-0.5 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded p-0.5 text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
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
            disabled={isExporting}
            onClick={handleExportContacts}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <div className="h-3.5 w-px bg-white/10" />
          {confirmBulkDelete ? (
            <>
              <span className="text-xs text-red-400">Delete {selected.size}?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed"
                disabled={bulkDelete.isPending}
                onClick={() => bulkDelete.mutate({ ids: [...selected] })}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:bg-white/5 hover:text-white"
                onClick={() => setConfirmBulkDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setConfirmBulkDelete(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <button
            className="text-gray-500 hover:text-white"
            onClick={() => { setSelected(new Set()); setSelectMode(false); setConfirmBulkDelete(false); }}
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Contact list */}
      {!data?.items || data.items.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-500">No contacts found</p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-lg border border-white/5 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
          {selectMode && (
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
              <input
                type="checkbox"
                checked={allContactsSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 cursor-pointer rounded accent-[#2D5A5A]"
                aria-label="Select all contacts"
              />
              <span className="text-[11px] text-gray-500">
                {allContactsSelected ? "Deselect all" : "Select all"}
              </span>
            </div>
          )}
          {data.items.map((contact, i) => {
            const isExpanded = expandedId === contact.id;
            const detail = isExpanded ? contactDetail : null;

            return (
              <div
                key={contact.id}
                className={i < data.items.length - 1 ? "border-b border-white/5" : ""}
              >
                {/* Row */}
                <div className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04]">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selected.has(contact.id)}
                      onChange={() => toggleSelectContact(contact.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded accent-[#2D5A5A]"
                      aria-label={`Select ${contact.name}`}
                    />
                  )}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(contact.id);
                      setShowSubmissions(false);
                      setShowNotes(true);
                      setNoteEditorKey((k) => k + 1);
                      setEmailSubject("");
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <span className="w-36 flex-shrink-0 truncate text-sm font-medium text-white">
                    {contact.name}
                  </span>
                  <span className="hidden flex-shrink-0 text-xs text-gray-500 sm:inline">
                    {contact.email}
                  </span>
                  <Badge
                    variant="secondary"
                    className="flex-shrink-0 bg-[#2D5A5A]/15 px-1.5 py-0 text-[10px] text-[#5B8A8A]"
                  >
                    {contact.source}
                  </Badge>
                  {contact.organization && (
                    <span className="hidden items-center gap-1 text-[10px] text-gray-600 md:flex">
                      <Building2 className="h-3 w-3" />
                      {contact.organization}
                    </span>
                  )}
                  <span className="min-w-0 flex-1" />
                  <span className="flex items-center gap-1 text-[10px] text-gray-600">
                    <FileText className="h-3 w-3" />
                    {contact.submissionCount}
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-gray-600">
                    {new Date(contact.lastContactAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                  <div className="space-y-4 border-t border-white/5 px-4 py-3 sm:px-8">
                    {/* Contact info */}
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-sm font-medium text-white">{contact.name}</span>
                      <span className="text-xs text-gray-500">{contact.email}</span>
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.organization && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Building2 className="h-3 w-3" />
                          {contact.organization}
                        </span>
                      )}
                    </div>

                    {/* Notes (collapsible) */}
                    <div>
                      <button
                        type="button"
                        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-300"
                        onClick={() => setShowNotes(!showNotes)}
                      >
                        {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <MessageSquare className="h-3 w-3" />
                        Notes
                        {detail?.notes?.length ? (
                          <span className="text-[10px] text-gray-600">({detail.notes.length})</span>
                        ) : null}
                      </button>
                      <div className={`grid transition-all duration-200 ease-in-out ${showNotes ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="space-y-2 pl-1">
                            {/* Add note form */}
                            <div className="space-y-1.5">
                              <div className="overflow-hidden rounded-md border border-white/10 bg-white/5">
                                <RichTextEditor
                                  key={noteEditorKey}
                                  ref={noteEditorRef}
                                  placeholder="Add a note..."
                                  minHeight="80px"
                                />
                              </div>
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2.5 text-xs text-gray-400 hover:text-white disabled:cursor-not-allowed"
                                  onClick={() => handleAddNote(contact.id)}
                                  disabled={addNote.isPending}
                                  aria-label="Add note"
                                >
                                  {addNote.isPending ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Add Note
                                </Button>
                              </div>
                            </div>
                            {/* Note entries */}
                            {detail?.notes?.length ? (
                              <div className="space-y-1">
                                {detail.notes.map((note) => (
                                  <div
                                    key={note.id}
                                    className="group flex items-start gap-2 rounded-md bg-white/[0.03] px-3 py-2"
                                  >
                                    <div
                                      className="note-content min-w-0 flex-1 text-xs leading-relaxed text-gray-400"
                                      dangerouslySetInnerHTML={{ __html: note.content }}
                                    />
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                      <span className="text-[10px] text-gray-600">
                                        {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-gray-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                                        onClick={() => deleteNote.mutate({ id: note.id })}
                                        aria-label="Delete note"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600">No notes yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submissions (collapsible) */}
                    <div>
                      <button
                        type="button"
                        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-300"
                        onClick={() => setShowSubmissions(!showSubmissions)}
                      >
                        {showSubmissions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <FileText className="h-3 w-3" />
                        Submissions
                        {detail?.submissions?.length ? (
                          <span className="text-[10px] text-gray-600">({detail.submissions.length})</span>
                        ) : null}
                      </button>
                      <div className={`grid transition-all duration-200 ease-in-out ${showSubmissions ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="pl-1">
                            {detail?.submissions?.length ? (
                              <div className="space-y-1">
                                {detail.submissions.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="rounded-md bg-white/[0.03] px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        {sub.isRead ? (
                                          <MailOpen className="h-3 w-3 text-gray-600" />
                                        ) : (
                                          <Mail className="h-3 w-3 text-[#C9725B]" />
                                        )}
                                        <span className="text-[10px] text-gray-500">{sub.source}</span>
                                      </div>
                                      <span className="text-[10px] text-gray-600">
                                        {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                      {sub.message.slice(0, 200)}
                                      {sub.message.length > 200 ? "..." : ""}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600">No submissions yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email Composer */}
                    <div>
                      <h3 className="mb-1.5 text-[11px] font-medium text-gray-500">
                        Send Email
                      </h3>
                      <div className="space-y-2">
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Subject"
                          aria-label="Email subject"
                          className="h-8 border-white/10 bg-white/5 text-sm text-white placeholder-gray-500"
                        />
                        <div className="overflow-hidden rounded-md border border-white/10 bg-white/5">
                          <RichTextEditor
                            key={expandedId}
                            ref={editorRef}
                            placeholder="Write your email..."
                            minHeight="100px"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="h-7 rounded-full bg-[#C9725B] px-3 text-xs text-white hover:bg-[#B5624D] disabled:cursor-not-allowed"
                            onClick={() => handleSendEmail(contact.email)}
                            disabled={sendEmail.isPending}
                          >
                            {sendEmail.isPending ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-1.5 h-3.5 w-3.5" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
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

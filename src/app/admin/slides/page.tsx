"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Layers,
  Search,
  Upload,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderOpen,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  FolderInput,
  LayoutList,
  LayoutGrid,
  CheckSquare,
  Palette,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DeckCard } from "~/components/slides/deck-card";
import { GroupExportButton } from "~/components/slides/group-export";
import { getAllThemes } from "~/lib/themes";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const STATUS_FILTERS = [
  { value: undefined as string | undefined, label: "All" },
  { value: "ready", label: "Ready" },
  { value: "generating", label: "Generating" },
  { value: "draft", label: "Draft" },
  { value: "error", label: "Error" },
] as const;

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Last Updated" },
  { value: "createdAt", label: "Date Created" },
  { value: "title", label: "Title" },
  { value: "slideCount", label: "Slide Count" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];
type ViewMode = "list" | "groups";

export default function SlidesPage() {
  const utils = api.useUtils();
  const router = useRouter();
  const hasGenerating = useRef(false);

  // View mode
  const [view, setView] = useState<ViewMode>("list");

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Group management
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [themeMenuGroupId, setThemeMenuGroupId] = useState<string | null>(null);
  const [moveNewGroupName, setMoveNewGroupName] = useState("");
  const [showMoveNewGroup, setShowMoveNewGroup] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!moveMenuOpen && !themeMenuGroupId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setMoveMenuOpen(false);
        setThemeMenuGroupId(null);
        setShowMoveNewGroup(false);
        setMoveNewGroupName("");
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [moveMenuOpen, themeMenuGroupId]);

  // List query (used in list view)
  const { data, isLoading } = api.deck.list.useQuery(
    {
      search: debouncedSearch || undefined,
      status: statusFilter as "draft" | "generating" | "ready" | "error" | undefined,
      sortBy,
      sortDir,
      page,
      pageSize,
    },
    {
      refetchInterval: (query) => {
        const d = query.state.data;
        return d?.items.some((dk) => dk.status === "generating") ? 3000 : false;
      },
    },
  );

  const { data: groups } = api.deck.listGroups.useQuery();

  const decks = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // Notify when generating → ready
  useEffect(() => {
    const generating = decks.some((d) => d.status === "generating");
    if (hasGenerating.current && !generating && decks.length > 0) {
      const justReady = decks
        .filter((d) => d.status === "ready")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      if (justReady) {
        toast.success(`"${justReady.title}" is ready!`, {
          action: {
            label: "View",
            onClick: () => router.push(`/admin/slides/${justReady.id}`),
          },
        });
      }
    }
    hasGenerating.current = generating;
  }, [decks, router]);

  // --- Mutations ---
  const deleteDeck = api.deck.delete.useMutation({
    onSuccess: () => { utils.deck.list.invalidate(); toast.success("Deck deleted"); },
    onError: (err) => toast.error(err.message),
  });

  const createGroup = api.deck.createGroup.useMutation({
    onSuccess: () => {
      utils.deck.listGroups.invalidate();
      setNewGroupName("");
      setShowNewGroup(false);
      toast.success("Group created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateGroup = api.deck.updateGroup.useMutation({
    onSuccess: () => {
      utils.deck.listGroups.invalidate();
      setEditingGroupId(null);
      toast.success("Group renamed");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroup = api.deck.deleteGroup.useMutation({
    onSuccess: () => {
      utils.deck.listGroups.invalidate();
      utils.deck.list.invalidate();
      toast.success("Group deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const applyGroupTheme = api.deck.applyGroupTheme.useMutation({
    onSuccess: (result) => {
      utils.deck.list.invalidate();
      utils.deck.listGroups.invalidate();
      toast.success(`Theme applied to ${result.updated} deck${result.updated !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateGroupTheme = api.deck.updateGroup.useMutation({
    onSuccess: () => {
      utils.deck.listGroups.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const assignDecks = api.deck.assignDecksToGroup.useMutation({
    onSuccess: () => {
      utils.deck.list.invalidate();
      utils.deck.listGroups.invalidate();
      setSelectedIds(new Set());
      setMoveMenuOpen(false);
      toast.success("Decks moved");
    },
    onError: (err) => toast.error(err.message),
  });

  const recoverStalled = api.deck.recoverStalledDecks.useMutation({
    onSuccess: (result) => {
      if (result.recovered > 0) {
        utils.deck.list.invalidate();
        toast.info(`${result.recovered} stalled deck${result.recovered !== 1 ? "s" : ""} recovered`);
      }
    },
    onError: () => { /* silent — stale recovery is best-effort */ },
  });

  const duplicateDeck = api.deck.duplicateDeck.useMutation({
    onSuccess: () => {
      utils.deck.list.invalidate();
      utils.deck.listGroups.invalidate();
      toast.success("Deck duplicated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDuplicate = useCallback((id: string) => {
    duplicateDeck.mutate({ id });
  }, [duplicateDeck]);

  const bulkDeleteDecks = api.deck.bulkDeleteDecks.useMutation({
    onSuccess: (result) => {
      utils.deck.list.invalidate();
      utils.deck.listGroups.invalidate();
      setSelectedIds(new Set());
      setSelectMode(false);
      setConfirmBulkDelete(false);
      toast.success(`Deleted ${result.count} deck${result.count !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Check for stalled decks on mount
  useEffect(() => {
    recoverStalled.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const handleDelete = useCallback((id: string) => {
    const deck = decks.find((d) => d.id === id);
    if (window.confirm(`Delete "${deck?.title ?? "this deck"}"?`)) {
      deleteDeck.mutate({ id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = decks.map((d) => d.id);
    setSelectedIds((prev) => {
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) return new Set(); // deselect all
      return new Set(allIds);
    });
  }, [decks]);

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "title" ? "asc" : "desc");
    }
    setPage(1);
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (window.confirm(`Delete group "${name}"? Decks will be ungrouped, not deleted.`)) {
      deleteGroup.mutate({ id });
    }
  };

  const hasActiveFilters = !!debouncedSearch || !!statusFilter;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Slide Builder</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {total} deck{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/slides/bulk">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-400 hover:text-white">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk</span>
            </Button>
          </Link>
          <Link href="/admin/slides/new">
            <Button className="gap-1.5" style={{ backgroundColor: "#C9725B" }}>
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search decks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-[#2D5A5A]/30 text-[#7AACAC]"
                  : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 text-xs ${selectMode ? "text-[#7AACAC]" : "text-gray-400 hover:text-white"}`}
            onClick={() => {
              if (selectMode) { setSelectedIds(new Set()); }
              setSelectMode(!selectMode);
            }}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectMode ? "Cancel" : "Select"}
          </Button>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
            className="h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 pr-7 text-xs text-gray-400 outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => toggleSort(sortBy)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => { setView("list"); setSelectedIds(new Set()); }}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                view === "list" ? "bg-[#2D5A5A]/30 text-[#7AACAC]" : "text-gray-500 hover:text-white"
              }`}
              title="List view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setView("groups"); setSelectedIds(new Set()); }}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                view === "groups" ? "bg-[#2D5A5A]/30 text-[#7AACAC]" : "text-gray-500 hover:text-white"
              }`}
              title="Group view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar — slides up when items selected or select mode active */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#2D5A5A]/30 bg-[#2D5A5A]/10 px-4 py-2 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={selectAll}
            className="text-xs font-medium text-[#7AACAC] hover:text-white transition-colors"
          >
            {decks.length > 0 && decks.every((d) => selectedIds.has(d.id))
              ? "Deselect All"
              : `Select All (${decks.length})`}
          </button>
          {selectedIds.size > 0 && (
            <>
            <span className="text-xs text-gray-500">
              {selectedIds.size} selected
            </span>
          <div className="relative" data-dropdown>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-gray-300 hover:text-white"
              onClick={() => setMoveMenuOpen(!moveMenuOpen)}
            >
              <FolderInput className="h-3.5 w-3.5" />
              Move to Group
              <ChevronDown className="h-3 w-3" />
            </Button>
            {moveMenuOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-56 max-h-[60vh] overflow-y-auto rounded-lg border border-white/10 bg-[#1C1C2E] py-1 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                <button
                  onClick={() => assignDecks.mutate({ deckIds: [...selectedIds], groupId: null })}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#2D5A5A]/20 transition-colors"
                >
                  Ungrouped
                </button>
                {groups?.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => assignDecks.mutate({ deckIds: [...selectedIds], groupId: g.id })}
                    className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#2D5A5A]/20 transition-colors"
                  >
                    {g.name}
                  </button>
                ))}
                <div className="my-1 border-t border-white/5" />
                {showMoveNewGroup ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <Input
                      value={moveNewGroupName}
                      onChange={(e) => setMoveNewGroupName(e.target.value)}
                      placeholder="Group name..."
                      autoFocus
                      className="h-7 flex-1 border-white/10 bg-white/5 text-xs text-white placeholder:text-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && moveNewGroupName.trim()) {
                          createGroup.mutate({ name: moveNewGroupName.trim() }, {
                            onSuccess: (group) => {
                              if (group) {
                                assignDecks.mutate({ deckIds: [...selectedIds], groupId: group.id });
                                setMoveNewGroupName("");
                                setShowMoveNewGroup(false);
                              }
                            },
                          });
                        }
                        if (e.key === "Escape") { setShowMoveNewGroup(false); setMoveNewGroupName(""); }
                      }}
                    />
                    <button
                      onClick={() => { setShowMoveNewGroup(false); setMoveNewGroupName(""); }}
                      className="shrink-0 p-1 text-gray-500 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMoveNewGroup(true)}
                    className="w-full px-3 py-2 text-left text-xs text-[#7AACAC] hover:bg-[#2D5A5A]/20 transition-colors"
                  >
                    <FolderPlus className="mr-1.5 inline h-3 w-3" />
                    Create new group...
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="h-3.5 w-px bg-white/10" />
          {confirmBulkDelete ? (
            <>
              <span className="text-xs text-red-400">Delete {selectedIds.size}?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                disabled={bulkDeleteDecks.isPending}
                onClick={() => bulkDeleteDecks.mutate({ ids: [...selectedIds] })}
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
              className="h-7 gap-1 px-2 text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => setConfirmBulkDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          </>
          )}
          <button
            className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
            onClick={() => { setSelectedIds(new Set()); setSelectMode(false); setConfirmBulkDelete(false); }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-white/5 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-14 animate-pulse rounded-full bg-white/5" />
              </div>
              <div className="mt-2 flex gap-4">
                <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — no decks at all */}
      {!isLoading && total === 0 && !hasActiveFilters && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "#2D5A5A20" }}
          >
            <Layers className="h-7 w-7" style={{ color: "#5B8A8A" }} />
          </div>
          <h2 className="mb-1.5 text-lg font-semibold text-white">No decks yet</h2>
          <p className="mb-6 max-w-sm text-center text-sm text-gray-400">
            Upload training content and generate a professional slide deck in seconds.
          </p>
          <Link href="/admin/slides/new">
            <Button style={{ backgroundColor: "#C9725B" }} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Your First Deck
            </Button>
          </Link>
        </div>
      )}

      {/* Empty state — filters active but no results */}
      {!isLoading && total === 0 && hasActiveFilters && (
        <div className="py-16 text-center">
          <p className="text-sm text-gray-400">No decks match your filters</p>
          <button
            onClick={() => { setSearch(""); setStatusFilter(undefined); setPage(1); }}
            className="mt-2 text-xs text-[#7AACAC] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {!isLoading && decks.length > 0 && view === "list" && (
        <>
          <div className="space-y-1">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                selected={selectedIds.has(deck.id)}
                onSelect={selectMode ? toggleSelect : undefined}
              />
            ))}
          </div>

          {/* Pagination */}
          {(totalPages > 1 || total > 10) && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded-md border border-white/10 bg-white/5 px-1.5 text-xs text-gray-400 outline-none"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" disabled={page <= 1} onClick={() => setPage(1)}>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== GROUP VIEW ===== */}
      {!isLoading && view === "groups" && (
        <div className="space-y-3">
          {/* New group button */}
          {!showNewGroup ? (
            <button
              onClick={() => setShowNewGroup(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-4 py-2.5 text-xs text-gray-500 transition-colors hover:border-[#5B8A8A]/30 hover:text-[#7AACAC]"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              New Group
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-[#5B8A8A]/30 bg-[#2D5A5A]/5 px-4 py-2.5">
              <FolderOpen className="h-4 w-4 shrink-0 text-[#5B8A8A]" />
              <Input
                placeholder="Group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGroupName.trim()) createGroup.mutate({ name: newGroupName.trim() });
                  if (e.key === "Escape") { setShowNewGroup(false); setNewGroupName(""); }
                }}
                autoFocus
                className="h-7 max-w-[240px] border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!newGroupName.trim() || createGroup.isPending}
                onClick={() => createGroup.mutate({ name: newGroupName.trim() })}
                style={{ backgroundColor: "#2D5A5A" }}
              >
                Create
              </Button>
              <button
                className="text-gray-500 hover:text-white"
                onClick={() => { setShowNewGroup(false); setNewGroupName(""); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Group sections */}
          {groups?.map((group) => {
            const isCollapsed = collapsedGroups.has(group.id);
            const isEditing = editingGroupId === group.id;

            return (
              <div key={group.id} className="relative rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {/* Group header */}
                <div className="flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <button
                    onClick={() => {
                      setCollapsedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.id)) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      });
                    }}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <FolderOpen className="h-4 w-4 text-[#5B8A8A]" />

                  {isEditing ? (
                    <Input
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editingGroupName.trim()) {
                          updateGroup.mutate({ id: group.id, name: editingGroupName.trim() });
                        }
                        if (e.key === "Escape") setEditingGroupId(null);
                      }}
                      onBlur={() => {
                        if (editingGroupName.trim() && editingGroupName !== group.name) {
                          updateGroup.mutate({ id: group.id, name: editingGroupName.trim() });
                        } else {
                          setEditingGroupId(null);
                        }
                      }}
                      autoFocus
                      className="h-6 max-w-[200px] border-white/10 bg-white/5 text-sm text-white"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">{group.name}</span>
                  )}

                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {group.deckCount}
                  </span>

                  {/* Group actions — visible on hover */}
                  <div className="ml-auto flex items-center gap-0.5 opacity-60 sm:opacity-0 transition-opacity [div:hover>&]:opacity-100">
                    <div className="relative" data-dropdown>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setThemeMenuGroupId(themeMenuGroupId === group.id ? null : group.id);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-[#5B8A8A] transition-colors"
                        title="Set group theme"
                      >
                        <Palette className="h-3 w-3" />
                      </button>
                      {themeMenuGroupId === group.id && (
                        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-white/10 bg-[#1C1C2E] py-1 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                            Apply theme to all decks
                          </div>
                          {getAllThemes().map((t) => (
                            <button
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateGroupTheme.mutate({ id: group.id, themeId: t.id });
                                applyGroupTheme.mutate({ groupId: group.id });
                                setThemeMenuGroupId(null);
                              }}
                              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-[#2D5A5A]/20 ${
                                group.themeId === t.id ? "text-[#7AACAC]" : "text-gray-300"
                              }`}
                            >
                              <div
                                className="h-3 w-3 rounded-sm ring-1 ring-white/10"
                                style={{ background: t.gradient?.background ?? t.colors.background }}
                              />
                              {t.name}
                              {group.themeId === t.id && <span className="ml-auto text-[10px] text-[#5B8A8A]">current</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <GroupExportButton groupId={group.id} groupName={group.name} />
                    <button
                      onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-red-400 transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Group deck list */}
                {!isCollapsed && (
                  <GroupDeckList
                    groupId={group.id}
                    deckCount={group.deckCount}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    selectedIds={selectedIds}
                    onSelect={selectMode ? toggleSelect : undefined}
                  />
                )}
              </div>
            );
          })}

          {/* Ungrouped section */}
          <UngroupedDeckList
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            selectedIds={selectedIds}
            onSelect={selectMode ? toggleSelect : undefined}
          />
        </div>
      )}
    </div>
  );
}

/** Renders decks belonging to a specific group */
function GroupDeckList({
  groupId,
  deckCount,
  onDelete,
  onDuplicate,
  selectedIds,
  onSelect,
}: {
  groupId: string;
  deckCount: number;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  selectedIds: Set<string>;
  onSelect?: (id: string) => void;
}) {
  const { data } = api.deck.list.useQuery({
    groupId,
    sortBy: "updatedAt",
    sortDir: "desc",
    pageSize: 100,
  });

  if (deckCount === 0) {
    return (
      <div className="border-t border-white/5 px-4 py-6 text-center">
        <p className="text-xs text-gray-500">No decks in this group</p>
      </div>
    );
  }

  if (!data?.items.length) return null;

  return (
    <div className="border-t border-white/5 px-2 pb-2 pt-1 space-y-0.5">
      {data.items.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          selected={selectedIds.has(deck.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/** Renders decks that aren't in any group */
function UngroupedDeckList({
  onDelete,
  onDuplicate,
  selectedIds,
  onSelect,
}: {
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  selectedIds: Set<string>;
  onSelect?: (id: string) => void;
}) {
  const { data } = api.deck.list.useQuery({
    groupId: null,
    sortBy: "updatedAt",
    sortDir: "desc",
    pageSize: 100,
  });

  if (!data?.items.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Layers className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-400">Ungrouped</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          {data.items.length}
        </span>
      </div>
      <div className="border-t border-white/5 px-2 pb-2 pt-1 space-y-0.5">
        {data.items.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            selected={selectedIds.has(deck.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

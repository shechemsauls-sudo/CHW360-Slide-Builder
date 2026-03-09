"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  Palette,
  ArrowUpDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  FolderInput,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { DeckCard } from "~/components/slides/deck-card";
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
  { value: "updatedAt", label: "Updated" },
  { value: "createdAt", label: "Created" },
  { value: "title", label: "Title" },
  { value: "slideCount", label: "Slides" },
  { value: "status", label: "Status" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];

export default function SlidesPage() {
  const utils = api.useUtils();
  const router = useRouter();
  const hasGenerating = useRef(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [groupFilter, setGroupFilter] = useState<string | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group management
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [moveToGroupOpen, setMoveToGroupOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryInput = {
    search: debouncedSearch || undefined,
    status: statusFilter as "draft" | "generating" | "ready" | "error" | undefined,
    groupId: groupFilter,
    sortBy,
    sortDir,
    page,
    pageSize: 25,
  };

  const { data, isLoading } = api.deck.list.useQuery(queryInput, {
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.items.some((dk) => dk.status === "generating") ? 3000 : false;
    },
  });

  const { data: groups } = api.deck.listGroups.useQuery();

  const decks = data?.items ?? [];
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

  const deleteDeck = api.deck.delete.useMutation({
    onSuccess: () => {
      utils.deck.list.invalidate();
      toast.success("Deck deleted");
    },
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
      toast.success("Group updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroup = api.deck.deleteGroup.useMutation({
    onSuccess: () => {
      utils.deck.listGroups.invalidate();
      utils.deck.list.invalidate();
      if (groupFilter) setGroupFilter(undefined);
      toast.success("Group deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const assignDecks = api.deck.assignDecksToGroup.useMutation({
    onSuccess: () => {
      utils.deck.list.invalidate();
      utils.deck.listGroups.invalidate();
      setSelectedIds(new Set());
      setMoveToGroupOpen(false);
      toast.success("Decks moved");
    },
    onError: (err) => toast.error(err.message),
  });

  const applyGroupTheme = api.deck.applyGroupTheme.useMutation({
    onSuccess: (data) => {
      utils.deck.list.invalidate();
      toast.success(`Theme applied to ${data.updated} deck${data.updated !== 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(err.message),
  });

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

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "title" ? "asc" : "desc");
    }
    setPage(1);
  };

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (window.confirm(`Delete group "${name}"? Decks will be ungrouped, not deleted.`)) {
      deleteGroup.mutate({ id });
    }
  };

  const handleApplyTheme = (groupId: string, name: string) => {
    if (window.confirm(`Apply group theme to all decks in "${name}"?`)) {
      applyGroupTheme.mutate({ groupId });
    }
  };

  const hasActiveFilters = !!debouncedSearch || !!statusFilter || groupFilter !== undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Slide Builder</h1>
          <p className="text-sm text-gray-400">
            {total} deck{total !== 1 ? "s" : ""}
            {groups && groups.length > 0 && ` in ${groups.length} group${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-400 hover:text-white"
            onClick={() => setShowNewGroup(true)}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Group</span>
          </Button>
          <Link href="/admin/slides/bulk">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-400 hover:text-white"
            >
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

      {/* New Group Inline Form */}
      {showNewGroup && (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex items-center gap-3 p-4">
            <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" />
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newGroupName.trim()) {
                  createGroup.mutate({ name: newGroupName.trim() });
                }
                if (e.key === "Escape") setShowNewGroup(false);
              }}
              autoFocus
              className="h-8 max-w-xs border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-500"
            />
            <Button
              size="sm"
              disabled={!newGroupName.trim() || createGroup.isPending}
              onClick={() => createGroup.mutate({ name: newGroupName.trim() })}
              style={{ backgroundColor: "#2D5A5A" }}
            >
              Create
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500"
              onClick={() => setShowNewGroup(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative max-w-xs flex-1">
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
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-[#2D5A5A]/30 text-[#5B8A8A]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Group filter */}
        {groups && groups.length > 0 && (
          <select
            value={groupFilter === undefined ? "__all__" : groupFilter === null ? "__none__" : groupFilter}
            onChange={(e) => {
              const v = e.target.value;
              setGroupFilter(v === "__all__" ? undefined : v === "__none__" ? null : v);
              setPage(1);
            }}
            className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-gray-300"
          >
            <option value="__all__">All Groups</option>
            <option value="__none__">Ungrouped</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.deckCount})
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <button
          onClick={() => toggleSort(sortBy)}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:bg-white/10"
        >
          <ArrowUpDown className="h-3 w-3" />
          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          <span className="text-gray-500">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
        </button>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortBy);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-gray-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter(undefined);
              setGroupFilter(undefined);
              setPage(1);
            }}
            className="text-xs text-gray-500 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#2D5A5A]/30 bg-[#2D5A5A]/10 px-4 py-2">
          <span className="text-xs font-medium text-[#5B8A8A]">
            {selectedIds.size} selected
          </span>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-gray-300"
              onClick={() => setMoveToGroupOpen(!moveToGroupOpen)}
            >
              <FolderInput className="h-3.5 w-3.5" />
              Move to Group
            </Button>
            {moveToGroupOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-white/10 bg-[#1a1a2e] py-1 shadow-xl">
                <button
                  onClick={() => assignDecks.mutate({ deckIds: [...selectedIds], groupId: null })}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-white/10"
                >
                  Ungrouped
                </button>
                {groups?.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => assignDecks.mutate({ deckIds: [...selectedIds], groupId: g.id })}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-white/10"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Groups Section */}
      {groups && groups.length > 0 && !groupFilter && !debouncedSearch && (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {collapsedGroups.has(group.id) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <FolderOpen className="h-4 w-4 text-[#5B8A8A]" />
                {editingGroupId === group.id ? (
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
                    className="h-6 max-w-[200px] border-white/10 bg-white/5 text-xs text-white"
                  />
                ) : (
                  <span className="text-sm font-medium text-white">{group.name}</span>
                )}
                <span className="text-xs text-gray-500">
                  {group.deckCount} deck{group.deckCount !== 1 ? "s" : ""}
                </span>
                {group.themeId && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                    {group.themeId}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [div:hover>&]:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-500 hover:text-white"
                    onClick={() => {
                      setGroupFilter(group.id);
                    }}
                    title="Filter to group"
                  >
                    <Search className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-500 hover:text-white"
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditingGroupName(group.name);
                    }}
                    title="Rename group"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {group.themeId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-[#5B8A8A]"
                      onClick={() => handleApplyTheme(group.id, group.name)}
                      title="Apply group theme to all decks"
                    >
                      <Palette className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    title="Delete group"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {!collapsedGroups.has(group.id) && group.deckCount > 0 && (
                <GroupDeckList
                  groupId={group.id}
                  onDelete={handleDelete}
                  selectedIds={selectedIds}
                  onSelect={toggleSelect}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-white/5 px-4 py-3">
              <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && total === 0 && !hasActiveFilters && (
        <Card className="border-0 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#2D5A5A20" }}
            >
              <Layers className="h-8 w-8" style={{ color: "#2D5A5A" }} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Create Your First Deck
            </h2>
            <p className="mb-6 max-w-md text-center text-gray-400">
              Paste training content or upload a document, pick an AI provider, and
              generate a professional slide deck in seconds.
            </p>
            <Link href="/admin/slides/new">
              <Button style={{ backgroundColor: "#C9725B" }} className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Deck
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No results for filters */}
      {!isLoading && total === 0 && hasActiveFilters && (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">No decks match your filters</p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter(undefined);
              setGroupFilter(undefined);
              setPage(1);
            }}
            className="mt-2 text-xs text-[#5B8A8A] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Deck List (filtered/paginated view) */}
      {!isLoading && decks.length > 0 && (groupFilter !== undefined || !!debouncedSearch || !!statusFilter) && (
        <div className="space-y-1">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDelete={handleDelete}
              selected={selectedIds.has(deck.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Ungrouped decks (when viewing all without filters) */}
      {!isLoading && decks.length > 0 && !groupFilter && !debouncedSearch && !statusFilter && (
        <div className="space-y-1">
          {groups && groups.length > 0 && (
            <div className="px-1 py-2 text-xs font-medium text-gray-500">
              {groupFilter === undefined ? "All Decks" : "Ungrouped"}
            </div>
          )}
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDelete={handleDelete}
              selected={selectedIds.has(deck.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} ({total} deck{total !== 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sub-component: renders decks belonging to a specific group */
function GroupDeckList({
  groupId,
  onDelete,
  selectedIds,
  onSelect,
}: {
  groupId: string;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  const { data } = api.deck.list.useQuery({
    groupId,
    sortBy: "updatedAt",
    sortDir: "desc",
    pageSize: 100,
  });

  if (!data?.items.length) return null;

  return (
    <div className="space-y-0.5 border-t border-white/5 px-2 pb-2 pt-1">
      {data.items.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onDelete={onDelete}
          selected={selectedIds.has(deck.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

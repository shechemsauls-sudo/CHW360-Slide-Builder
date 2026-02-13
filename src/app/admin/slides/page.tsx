"use client";

import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { DeckCard } from "~/components/slides/deck-card";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function SlidesPage() {
  const utils = api.useUtils();
  const { data: decks, isLoading } = api.deck.list.useQuery();
  const deleteDeck = api.deck.delete.useMutation({
    onSuccess: () => {
      utils.deck.list.invalidate();
      toast.success("Deck deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: string) => {
    const deck = decks?.find((d) => d.id === id);
    if (window.confirm(`Delete "${deck?.title ?? "this deck"}"?`)) {
      deleteDeck.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Slide Builder</h1>
          <p className="text-sm text-gray-400">
            {decks?.length ?? 0} deck{decks?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/slides/new">
          <Button
            className="gap-1.5"
            style={{ backgroundColor: "#C9725B" }}
          >
            <Plus className="h-4 w-4" />
            New Deck
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 bg-white/5">
              <CardContent className="p-5">
                <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-3 w-32 animate-pulse rounded bg-white/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && decks && decks.length === 0 && (
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

      {!isLoading && decks && decks.length > 0 && (
        <div className="space-y-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Youtube,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface VideoRec {
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  publishedAt: string;
  query?: string;
}

interface VideoRecsPanelProps {
  deckId: string;
  videoRecs: VideoRec[] | null;
  onUpdated: () => void;
}

export function VideoRecsPanel({ deckId, videoRecs, onUpdated }: VideoRecsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const recs = videoRecs ?? [];

  const generateRecs = api.deck.generateVideoRecs.useMutation({
    onSuccess: () => {
      onUpdated();
      toast.success("Video recommendations generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card className="border-0 bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium text-gray-300 transition-colors hover:text-white"
      >
        <Youtube className="h-4 w-4 text-red-400" />
        Video Resources
        {recs.length > 0 && (
          <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
            {recs.length}
          </span>
        )}
        <span className="ml-auto">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </span>
      </button>

      {expanded && (
        <CardContent className="border-t border-white/5 px-4 pb-4 pt-3">
          {recs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-gray-400">
                Find relevant YouTube training videos for this deck
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                style={{ backgroundColor: "#2D5A5A" }}
                onClick={() => generateRecs.mutate({ deckId })}
                disabled={generateRecs.isPending}
              >
                {generateRecs.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Youtube className="h-3.5 w-3.5" />
                )}
                {generateRecs.isPending ? "Searching..." : "Find Videos"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {recs.length} video{recs.length !== 1 ? "s" : ""} found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-gray-400 hover:text-white"
                  onClick={() => generateRecs.mutate({ deckId })}
                  disabled={generateRecs.isPending}
                >
                  {generateRecs.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {recs.map((rec) => (
                  <a
                    key={rec.videoId}
                    href={`https://www.youtube.com/watch?v=${rec.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-colors hover:bg-white/[0.06]"
                  >
                    <img
                      src={rec.thumbnail}
                      alt=""
                      className="h-16 w-28 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-white group-hover:text-[#5B8A8A]">
                        {decodeHtmlEntities(rec.title)}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-gray-500">
                        {rec.channelName}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
                        <ExternalLink className="h-2.5 w-2.5" />
                        Watch on YouTube
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

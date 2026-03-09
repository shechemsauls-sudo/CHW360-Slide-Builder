"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface ReviewIssue {
  slideOrder: number | null;
  severity: "high" | "medium" | "low";
  category: string;
  issue: string;
  suggestion: string;
}

interface ReviewPanelProps {
  deckId: string;
  slideCount: number;
  onNavigateSlide?: (slideOrder: number) => void;
}

const SEVERITY_CONFIG = {
  high: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  medium: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  low: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const CATEGORY_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  flow: "Flow",
  tone: "Tone",
  coverage: "Coverage",
  density: "Density",
  citation: "Citation",
};

export function ReviewPanel({ deckId, slideCount, onNavigateSlide }: ReviewPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [issues, setIssues] = useState<ReviewIssue[] | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  const reviewDeck = api.deck.reviewDeck.useMutation({
    onSuccess: (data) => {
      setIssues(data.issues);
      setDismissedIds(new Set());
      if (data.issues.length === 0) {
        toast.success("No issues found — deck looks great!");
      } else {
        toast.info(`Found ${data.issues.length} suggestion${data.issues.length !== 1 ? "s" : ""}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const dismissIssue = (index: number) => {
    setDismissedIds((prev) => new Set([...prev, index]));
  };

  const activeIssues = issues?.filter((_, i) => !dismissedIds.has(i)) ?? [];
  const highCount = activeIssues.filter((i) => i.severity === "high").length;
  const medCount = activeIssues.filter((i) => i.severity === "medium").length;
  const lowCount = activeIssues.filter((i) => i.severity === "low").length;

  return (
    <Card className="border-0 bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 p-4 text-left text-sm font-medium text-gray-300 transition-colors hover:text-white"
      >
        <ClipboardCheck className="h-4 w-4 text-[#5B8A8A]" />
        Quality Review
        {issues !== null && activeIssues.length > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            {activeIssues.length}
          </span>
        )}
        {issues !== null && activeIssues.length === 0 && (
          <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
            Pass
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
          {issues === null ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-gray-400">
                AI reviews your deck for content accuracy, flow, tone, and completeness
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                style={{ backgroundColor: "#2D5A5A" }}
                onClick={() => reviewDeck.mutate({ deckId })}
                disabled={reviewDeck.isPending}
              >
                {reviewDeck.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ClipboardCheck className="h-3.5 w-3.5" />
                )}
                {reviewDeck.isPending ? "Reviewing..." : "Run Review"}
              </Button>
              {reviewDeck.isPending && (
                <p className="text-xs text-gray-500">
                  Analyzing {slideCount} slides...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  {highCount > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {highCount} high
                    </span>
                  )}
                  {medCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      {medCount} medium
                    </span>
                  )}
                  {lowCount > 0 && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Info className="h-3 w-3" />
                      {lowCount} low
                    </span>
                  )}
                  {activeIssues.length === 0 && (
                    <span className="text-green-400">All clear!</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-gray-400 hover:text-white"
                  onClick={() => reviewDeck.mutate({ deckId })}
                  disabled={reviewDeck.isPending}
                >
                  {reviewDeck.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ClipboardCheck className="h-3 w-3" />
                  )}
                  Re-run
                </Button>
              </div>

              {/* Issue list */}
              <div className="space-y-2">
                {activeIssues.map((issue) => {
                  const origIdx = issues!.indexOf(issue);
                  const config = SEVERITY_CONFIG[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={origIdx}
                      className={`rounded-lg border ${config.border} ${config.bg} p-3`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            {issue.slideOrder && (
                              <button
                                type="button"
                                onClick={() => onNavigateSlide?.(issue.slideOrder!)}
                                className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/20"
                              >
                                Slide {issue.slideOrder}
                              </button>
                            )}
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">
                              {CATEGORY_LABELS[issue.category] ?? issue.category}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-white">{issue.issue}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{issue.suggestion}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dismissIssue(origIdx)}
                          className="shrink-0 rounded p-0.5 text-gray-500 hover:text-white"
                          title="Dismiss"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

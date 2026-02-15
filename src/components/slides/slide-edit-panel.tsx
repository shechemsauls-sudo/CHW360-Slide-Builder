"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Send, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { MarkdownRenderer } from "~/components/slides/markdown-renderer";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { SlideData } from "~/lib/ai/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SlideEditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: SlideData | null;
  deckId: string;
  onSlideUpdated: () => void;
}

export function SlideEditPanel({
  open,
  onOpenChange,
  slide,
  deckId,
  onSlideUpdated,
}: SlideEditPanelProps) {
  const [chatHistory, setChatHistory] = useState<Map<string, ChatMessage[]>>(
    new Map(),
  );
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const regenerateSlide = api.deck.regenerateSlide.useMutation({
    onSuccess: () => {
      if (!slide) return;
      const history = chatHistory.get(slide.id) ?? [];
      setChatHistory(
        new Map(chatHistory).set(slide.id, [
          ...history,
          { role: "assistant", content: "Slide updated successfully." },
        ]),
      );
      onSlideUpdated();
    },
    onError: (err) => {
      toast.error(err.message);
      if (!slide) return;
      const history = chatHistory.get(slide.id) ?? [];
      setChatHistory(
        new Map(chatHistory).set(slide.id, [
          ...history,
          { role: "assistant", content: `Error: ${err.message}` },
        ]),
      );
    },
  });

  const handleSend = useCallback(() => {
    if (!slide || !input.trim() || regenerateSlide.isPending) return;

    const feedback = input.trim();
    setInput("");

    const history = chatHistory.get(slide.id) ?? [];
    const updated = [...history, { role: "user" as const, content: feedback }];
    setChatHistory(new Map(chatHistory).set(slide.id, updated));

    regenerateSlide.mutate({
      deckId,
      slideId: slide.id,
      feedback,
    });

    // Scroll to bottom after state update
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [slide, input, deckId, chatHistory, regenerateSlide]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = slide ? chatHistory.get(slide.id) ?? [] : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/10 bg-[#1a1a2e] sm:max-w-md"
      >
        <SheetHeader className="border-b border-white/10 pb-3">
          <SheetTitle className="text-white">
            Edit Slide {slide?.order}
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            {slide?.title ?? ""}
          </SheetDescription>
        </SheetHeader>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-[#5B8A8A]/50" />
              <p className="text-sm text-gray-400">
                Describe the changes you want to make to this slide.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                e.g. &quot;Make the bullets more concise&quot; or &quot;Add an
                activity prompt&quot;
              </p>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D5A5A]/30">
                    <Sparkles className="h-3 w-3 text-[#5B8A8A]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[#2D5A5A]/30 text-white"
                      : "bg-white/5 text-gray-300"
                  }`}
                >
                  <MarkdownRenderer content={msg.content} className="text-sm" />
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9725B]/30">
                    <User className="h-3 w-3 text-[#C9725B]" />
                  </div>
                )}
              </div>
            ))}

            {regenerateSlide.isPending && (
              <div className="flex gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D5A5A]/30">
                  <Sparkles className="h-3 w-3 text-[#5B8A8A]" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating slide...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your changes..."
              className="min-h-[60px] resize-none border-white/10 bg-white/5 text-white placeholder:text-gray-500"
              rows={2}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || regenerateSlide.isPending}
              className="h-[60px] w-10 shrink-0"
              style={{ backgroundColor: "#C9725B" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500">
            Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

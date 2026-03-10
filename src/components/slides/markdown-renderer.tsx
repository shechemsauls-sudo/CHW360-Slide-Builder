"use client";

import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight markdown renderer for slide content.
 * Handles: bold, italic, headings, bullet/numbered lists, links, and line breaks.
 * No external dependencies — intentionally simple for slide rendering.
 */
export function MarkdownRenderer({ content, className, style }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const output: string[] = [];
  let inList: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Empty line — close any open list, add break
    if (!trimmed) {
      if (inList) {
        output.push(inList === "ul" ? "</ul>" : "</ol>");
        inList = null;
      }
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        output.push(inList === "ul" ? "</ul>" : "</ol>");
        inList = null;
      }
      const level = headingMatch[1]!.length;
      const text = inlineFormat(headingMatch[2]!);
      const sizes: Record<number, string> = {
        1: "text-lg font-bold mb-2",
        2: "text-base font-bold mb-1.5",
        3: "text-sm font-semibold mb-1",
        4: "text-sm font-medium mb-1",
      };
      output.push(`<h${level} class="${sizes[level] ?? sizes[4]}">${text}</h${level}>`);
      continue;
    }

    // Unordered list items (-, *, +)
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== "ul") {
        if (inList) output.push("</ol>");
        output.push('<ul class="list-disc pl-5 space-y-0.5 text-left">');
        inList = "ul";
      }
      output.push(`<li>${inlineFormat(ulMatch[1]!)}</li>`);
      continue;
    }

    // Ordered list items (1., 2., etc.)
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      if (inList !== "ol") {
        if (inList) output.push("</ul>");
        output.push('<ol class="list-decimal pl-5 space-y-0.5 text-left">');
        inList = "ol";
      }
      output.push(`<li>${inlineFormat(olMatch[1]!)}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) {
      output.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
    output.push(`<p class="mb-1.5">${inlineFormat(trimmed)}</p>`);
  }

  // Close any open list
  if (inList) {
    output.push(inList === "ul" ? "</ul>" : "</ol>");
  }

  return output.join("\n");
}

export function inlineFormat(text: string): string {
  // Escape HTML entities to prevent XSS
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return (
    text
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // Italic: *text* or _text_
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>")
      // Links: [text](url)
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">$1</a>',
      )
      // Inline code: `code`
      .replace(/`(.+?)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[0.9em]">$1</code>')
  );
}

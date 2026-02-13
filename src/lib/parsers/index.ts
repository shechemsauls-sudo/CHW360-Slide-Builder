import { parseMarkdown } from "./markdown";
import { parsePlaintext } from "./plaintext";
import { parsePdf } from "./pdf";
import { parseDocx } from "./docx";

export type SourceFormat = "markdown" | "plaintext" | "pdf" | "docx";

export async function parseContent(
  content: string,
  format: SourceFormat,
): Promise<string> {
  switch (format) {
    case "markdown":
      return parseMarkdown(content);
    case "plaintext":
      return parsePlaintext(content);
    case "pdf":
      return parsePdf(content);
    case "docx":
      return parseDocx(content);
    default:
      return parsePlaintext(content);
  }
}

export function detectFormat(filename: string): SourceFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "markdown":
      return "markdown";
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    default:
      return "plaintext";
  }
}

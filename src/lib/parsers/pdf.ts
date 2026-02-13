import { PDFParse } from "pdf-parse";

export async function parsePdf(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  return result.text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

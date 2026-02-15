export async function parsePdf(base64: string): Promise<string> {
  // Lazy import: pdf-parse depends on pdfjs-dist which uses DOMMatrix (browser API).
  // Importing at module level crashes Node.js serverless functions on Vercel.
  const { PDFParse } = await import("pdf-parse");
  const buffer = Buffer.from(base64, "base64");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  return result.text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

import mammoth from "mammoth";

export async function parseDocx(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const result = await mammoth.extractRawText({ buffer });
  return result.value
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

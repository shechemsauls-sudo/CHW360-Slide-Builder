import { supabaseAdmin } from "~/lib/supabase/admin";

const BUCKET = "slide-images";

export async function uploadSlideImage(
  deckId: string,
  slideId: string,
  buffer: Buffer,
  contentType: "image/png" | "image/webp",
): Promise<string> {
  const ext = contentType === "image/webp" ? "webp" : "png";
  const path = `${deckId}/${slideId}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true, cacheControl: "3600" });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteSlideImage(
  deckId: string,
  slideId: string,
): Promise<void> {
  // Try both extensions since we don't know which was used
  const paths = [
    `${deckId}/${slideId}.png`,
    `${deckId}/${slideId}.webp`,
  ];

  await supabaseAdmin.storage.from(BUCKET).remove(paths);
}

export async function deleteDeckImages(deckId: string): Promise<void> {
  const { data: files } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(deckId);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${deckId}/${f.name}`);
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }
}

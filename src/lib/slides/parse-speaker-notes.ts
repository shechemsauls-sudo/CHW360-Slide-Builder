export interface ParsedSpeakerNotes {
  talkingPoints: string[];
  presenterTips: string[];
  transition: string | null;
  isStructured: boolean;
}

/** Parse structured speaker notes into sections */
export function parseSpeakerNotes(notes: string): ParsedSpeakerNotes {
  const hasTalkingPoints = notes.includes("**Talking Points**");
  if (!hasTalkingPoints) {
    return { talkingPoints: [], presenterTips: [], transition: null, isStructured: false };
  }

  const sections = notes.split(/\*\*(Talking Points|Presenter Tips|Transition)\*\*/);
  const talkingPoints: string[] = [];
  const presenterTips: string[] = [];
  let transition: string | null = null;

  for (let i = 0; i < sections.length; i++) {
    const header = sections[i]?.trim();
    const content = sections[i + 1]?.trim();
    if (!content) continue;

    const lines = content
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    if (header === "Talking Points") {
      talkingPoints.push(...lines);
    } else if (header === "Presenter Tips") {
      presenterTips.push(...lines);
    } else if (header === "Transition") {
      transition = lines.join(" ").replace(/^[\u201C\u201D"]|[\u201C\u201D"]$/g, "").trim() || null;
    }
  }

  return { talkingPoints, presenterTips, transition, isStructured: true };
}

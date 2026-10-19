import type { TranscriptEntry, DebateTopic, Persona } from "@/data/debateData";
import { dataCall } from "./api";

export interface SavedDebate {
  id: string;
  topic: DebateTopic;
  transcript: TranscriptEntry[];
  personas: Array<{ id: string; name: string; color: string }>;
  winnerId: string | null;
  duration: number; // seconds the debate ran
  savedAt: number; // timestamp
}

const STORAGE_KEY = "roundtaible_history";
const MAX_SAVED = 50;

export function getSavedDebates(): SavedDebate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Persist debate to the database via /api/data (fire-and-forget, localStorage is still primary) */
async function persistToServer(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  personas: Array<{ id: string; name: string; color: string }>,
  winnerId: string | null,
  duration: number,
  userId?: string,
  classId?: string,
  educationalMode?: boolean
) {
  try {
    // The server takes the user id from the Clerk session, not from this call.
    void userId;
    await dataCall("debates.save", {
      topic: { id: topic.id, title: topic.title, category: topic.category },
      transcript,
      personas,
      winnerId,
      duration,
      classId: classId || null,
      educationalMode: educationalMode || false,
    });
  } catch {
    // Non-critical: the debate is still saved locally
  }
}

/** Save a debate in bounded local history, retrying storage failures, and start best-effort server persistence. */
export function saveDebate(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  personas: Persona[],
  winnerId: string | null,
  duration: number,
  userId?: string,
  classId?: string,
  educationalMode?: boolean
): SavedDebate {
  const debate: SavedDebate = {
    id: `debate_${Date.now()}`,
    topic,
    transcript,
    personas: personas.map(p => ({ id: p.id, name: p.name, color: p.color })),
    winnerId,
    duration,
    savedAt: Date.now(),
  };

  const existing = getSavedDebates();
  const updated = [debate, ...existing].slice(0, MAX_SAVED);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // QuotaExceededError, trim older debates and retry
    const trimmed = updated.slice(0, Math.floor(MAX_SAVED / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage completely full, clear debate history to free space
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Also persist to the database (debate limits, analytics, class history)
  persistToServer(topic, transcript, debate.personas, winnerId, duration, userId, classId, educationalMode);

  return debate;
}

export function deleteDebate(id: string) {
  const existing = getSavedDebates();
  const updated = existing.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTranscriptForExport(
  debate: SavedDebate
): string {
  const header = `ALGONQUIN ROUNDTAIBLE, "${debate.topic.title}"`;
  const date = new Date(debate.savedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const participants = debate.personas.map(p => p.name).join(", ");
  const winner = debate.winnerId
    ? debate.personas.find(p => p.id === debate.winnerId)?.name || "Unknown"
    : "No winner declared";
  const mins = Math.floor(debate.duration / 60);
  const secs = debate.duration % 60;

  const lines = debate.transcript.map(entry => {
    const speaker = entry.personaId === "human"
      ? "You"
      : debate.personas.find(p => p.id === entry.personaId)?.name || "Unknown";
    return `${speaker}: ${entry.text}`;
  });

  return [
    header,
    `Date: ${date}`,
    `Participants: ${participants}`,
    `Duration: ${mins}m ${secs}s`,
    `Winner: ${winner}`,
    "",
    "---",
    "",
    ...lines,
  ].join("\n");
}

import type { TranscriptEntry, DebateTopic, Persona } from "@/data/debateData";
import { supabase } from "./supabaseClient";

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

/** Persist debate to Supabase (fire-and-forget, localStorage is still primary) */
async function persistToSupabase(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  personas: Array<{ id: string; name: string; color: string }>,
  winnerId: string | null,
  duration: number,
  userId?: string,
  classId?: string,
  educationalMode?: boolean
) {
  if (!supabase) return;
  try {
    await supabase.from("rt_debates").insert({
      topic_id: topic.id,
      topic_title: topic.title,
      topic_category: topic.category,
      transcript,
      personas,
      winner_id: winnerId,
      duration,
      user_id: userId || null,
      class_id: classId || null,
      educational_mode: educationalMode || false,
    });
  } catch (err) {
    console.warn("Failed to persist debate to Supabase:", err);
  }
}

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Also persist to Supabase for content generation pipeline
  persistToSupabase(topic, transcript, debate.personas, winnerId, duration, userId, classId, educationalMode);

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
  const header = `ALGONQUIN ROUNDTAIBLE — "${debate.topic.title}"`;
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

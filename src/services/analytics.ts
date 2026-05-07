/**
 * Lightweight usage analytics, tracks debate events locally with optional Supabase sync.
 * All data is anonymous (no PII). Stored in localStorage for local dashboards.
 */

import { supabase } from "./supabaseClient";

// --- Event types ---

export type AnalyticsEvent =
  | { event: "debate_start"; topic: string; category: string; personaCount: number; mode: string }
  | { event: "debate_end"; topic: string; duration: number; exchangeCount: number; winnerId: string | null }
  | { event: "topic_select"; topic: string; category: string }
  | { event: "persona_add"; personaId: string; source: "roster" | "custom" }
  | { event: "persona_remove"; personaId: string }
  | { event: "vote"; personaId: string }
  | { event: "summary_request" }
  | { event: "voice_input" }
  | { event: "replay_open"; debateId: string }
  | { event: "multiplayer_create" }
  | { event: "multiplayer_join" }
  | { event: "mode_switch"; mode: string };

interface StoredEvent {
  id: string;
  timestamp: number;
  data: AnalyticsEvent;
}

// --- Storage ---

const STORAGE_KEY = "roundtaible_analytics";
const MAX_EVENTS = 500;

function getStoredEvents(): StoredEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function storeEvent(event: StoredEvent): void {
  const existing = getStoredEvents();
  const updated = [...existing, event].slice(-MAX_EVENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Quota exceeded, trim aggressively
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-100)));
    } catch {
      // Give up silently, analytics should never break the app
    }
  }
}

// --- Supabase sync (fire-and-forget) ---

async function syncToSupabase(event: StoredEvent): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("rt_analytics").insert({
      event_type: event.data.event,
      event_data: event.data,
      created_at: new Date(event.timestamp).toISOString(),
    });
  } catch {
    // Silent failure, analytics should never block the user
  }
}

// --- Public API ---

export function track(data: AnalyticsEvent): void {
  const event: StoredEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    data,
  };
  storeEvent(event);
  syncToSupabase(event);
}

// --- Aggregate queries (for local dashboard / stats display) ---

export interface AnalyticsSummary {
  totalDebates: number;
  totalDuration: number; // seconds
  topTopics: Array<{ topic: string; count: number }>;
  topPersonas: Array<{ personaId: string; votes: number }>;
  debatesByMode: Record<string, number>;
  eventsToday: number;
}

export function getSummary(): AnalyticsSummary {
  const events = getStoredEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const topicCounts: Record<string, number> = {};
  const voteCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};
  let totalDebates = 0;
  let totalDuration = 0;
  let eventsToday = 0;

  for (const evt of events) {
    if (evt.timestamp >= todayTs) eventsToday++;

    switch (evt.data.event) {
      case "debate_start":
        totalDebates++;
        topicCounts[evt.data.topic] = (topicCounts[evt.data.topic] || 0) + 1;
        modeCounts[evt.data.mode] = (modeCounts[evt.data.mode] || 0) + 1;
        break;
      case "debate_end":
        totalDuration += evt.data.duration;
        break;
      case "vote":
        voteCounts[evt.data.personaId] = (voteCounts[evt.data.personaId] || 0) + 1;
        break;
    }
  }

  const topTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topPersonas = Object.entries(voteCounts)
    .map(([personaId, votes]) => ({ personaId, votes }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  return {
    totalDebates,
    totalDuration,
    topTopics,
    topPersonas,
    debatesByMode: modeCounts,
    eventsToday,
  };
}

export function clearAnalytics(): void {
  localStorage.removeItem(STORAGE_KEY);
}

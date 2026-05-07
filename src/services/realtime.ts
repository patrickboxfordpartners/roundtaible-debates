// Realtime abstraction layer
// Uses Supabase Realtime (cross-device) with BroadcastChannel fallback (same-device)

import type { TranscriptEntry, DebateTopic, Persona } from "@/data/debateData";
import { supabase } from "./supabaseClient";

// --- Message types ---

export type RealtimeMessage =
  | { type: "state_sync"; payload: RoomState }
  | { type: "transcript_add"; payload: TranscriptEntry }
  | { type: "speaking"; payload: { speakingId: string | null; thinkingId: string | null } }
  | { type: "timer"; payload: { timeRemaining: number; heatLevel: number; isDebating: boolean; isLightning: boolean } }
  | { type: "debate_start"; payload: { topic: DebateTopic; lightning: boolean } }
  | { type: "debate_end"; payload: { winnerId: string | null } }
  | { type: "guest_message"; payload: { text: string; guestName: string } }
  | { type: "guest_vote"; payload: { personaId: string; guestName: string } }
  | { type: "guest_reaction"; payload: { emoji: string } }
  | { type: "guest_persona"; payload: Persona }
  | { type: "guest_join"; payload: { name: string } }
  | { type: "guest_leave"; payload: { name: string } }
  | { type: "request_sync"; payload: { name: string } };

export interface RoomState {
  topic: DebateTopic;
  transcript: TranscriptEntry[];
  personas: Persona[];
  speakingId: string | null;
  thinkingId: string | null;
  timeRemaining: number;
  heatLevel: number;
  isDebating: boolean;
  isLightning: boolean;
  reactions: Record<string, number>;
  guests: string[];
}

// --- Provider interface ---

export interface RealtimeProvider {
  send(message: RealtimeMessage): void;
  subscribe(callback: (message: RealtimeMessage) => void): void;
  onPresenceSync(callback: (guests: string[]) => void): void;
  trackPresence(name: string): void;
  disconnect(): void;
}

// --- Throttle utility ---

function throttle<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const remaining = ms - (now - lastCall);

    if (remaining <= 0) {
      if (pending) { clearTimeout(pending); pending = null; }
      lastCall = now;
      fn(...args);
    } else if (!pending) {
      pending = setTimeout(() => {
        lastCall = Date.now();
        pending = null;
        if (lastArgs) fn(...lastArgs);
      }, remaining);
    }
  }) as T;
}

// --- Supabase Realtime implementation ---

function createSupabaseProvider(roomId: string): RealtimeProvider | null {
  if (!supabase) return null;

  const channel = supabase.channel(`debate:${roomId}`, {
    config: { broadcast: { self: false }, presence: { key: roomId } },
  });

  let messageListener: ((msg: RealtimeMessage) => void) | null = null;
  let presenceListener: ((guests: string[]) => void) | null = null;

  channel
    .on("broadcast", { event: "message" }, ({ payload }) => {
      messageListener?.(payload as RealtimeMessage);
    })
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const names: string[] = [];
      for (const key of Object.keys(state)) {
        for (const presence of state[key]) {
          const p = presence as { name?: string };
          if (p.name) names.push(p.name);
        }
      }
      presenceListener?.(names);
    })
    .subscribe();

  // Throttle high-frequency messages (timer ticks, speaking state)
  const throttledSend = throttle((message: RealtimeMessage) => {
    channel.send({ type: "broadcast", event: "message", payload: message });
  }, 200);

  return {
    send(message: RealtimeMessage) {
      // Throttle only high-frequency messages; send the rest immediately
      if (message.type === "timer" || message.type === "speaking") {
        throttledSend(message);
      } else {
        channel.send({ type: "broadcast", event: "message", payload: message });
      }
    },
    subscribe(callback) {
      messageListener = callback;
    },
    onPresenceSync(callback) {
      presenceListener = callback;
    },
    trackPresence(name: string) {
      channel.track({ name });
    },
    disconnect() {
      messageListener = null;
      presenceListener = null;
      channel.untrack();
      supabase.removeChannel(channel);
    },
  };
}

// --- BroadcastChannel fallback (same-device, cross-tab) ---

function createBroadcastProvider(roomId: string): RealtimeProvider {
  const bc = new BroadcastChannel(`roundtaible_${roomId}`);
  let messageListener: ((msg: RealtimeMessage) => void) | null = null;

  bc.onmessage = (event: MessageEvent) => {
    messageListener?.(event.data as RealtimeMessage);
  };

  return {
    send(message: RealtimeMessage) {
      bc.postMessage(message);
    },
    subscribe(callback) {
      messageListener = callback;
    },
    onPresenceSync() {
      // BroadcastChannel doesn't support presence, guest tracking via messages
    },
    trackPresence() {
      // No-op for BroadcastChannel
    },
    disconnect() {
      messageListener = null;
      bc.close();
    },
  };
}

// --- Auto-select best provider ---

export function createProvider(roomId: string): RealtimeProvider {
  const sp = createSupabaseProvider(roomId);
  if (sp) return sp;
  return createBroadcastProvider(roomId);
}

// --- Session persistence ---

const SESSION_KEY = "roundtaible_mp_session";

export interface SessionData {
  role: "host" | "guest";
  roomId: string;
  guestName: string;
}

export function saveSession(data: SessionData): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// --- Room ID utilities ---

export function generateRoomId(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

export function setRoomIdInUrl(roomId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", url.toString());
}

export function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url.toString());
}

export function getShareableLink(roomId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

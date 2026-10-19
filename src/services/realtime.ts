// Realtime abstraction layer
// Uses BroadcastChannel (same browser, across tabs). Cross-device rooms used Supabase
// Realtime, which went away with the Supabase project. To bring cross-device rooms back,
// add a provider here (for example Ably, Pusher or PartyKit) that implements RealtimeProvider.

import type { TranscriptEntry, DebateTopic, Persona } from "@/data/debateData";

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

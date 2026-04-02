// Realtime abstraction layer
// Currently uses BroadcastChannel (same-device, cross-tab)
// Swap to Supabase Realtime for cross-device multiplayer

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
  | { type: "guest_leave"; payload: { name: string } };

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
  disconnect(): void;
}

// --- BroadcastChannel implementation (same-device, cross-tab) ---

export function createBroadcastProvider(roomId: string): RealtimeProvider {
  const channel = new BroadcastChannel(`roundtaible_${roomId}`);
  let listener: ((message: RealtimeMessage) => void) | null = null;

  channel.onmessage = (event: MessageEvent) => {
    listener?.(event.data as RealtimeMessage);
  };

  return {
    send(message: RealtimeMessage) {
      channel.postMessage(message);
    },
    subscribe(callback: (message: RealtimeMessage) => void) {
      listener = callback;
    },
    disconnect() {
      listener = null;
      channel.close();
    },
  };
}

// --- Supabase implementation (cross-device, plug in later) ---
// export function createSupabaseProvider(roomId: string, supabaseUrl: string, supabaseKey: string): RealtimeProvider {
//   const supabase = createClient(supabaseUrl, supabaseKey);
//   const channel = supabase.channel(`debate:${roomId}`);
//   let listener: ((message: RealtimeMessage) => void) | null = null;
//
//   channel.on("broadcast", { event: "message" }, ({ payload }) => {
//     listener?.(payload as RealtimeMessage);
//   }).subscribe();
//
//   return {
//     send(message: RealtimeMessage) {
//       channel.send({ type: "broadcast", event: "message", payload: message });
//     },
//     subscribe(callback) { listener = callback; },
//     disconnect() { listener = null; supabase.removeChannel(channel); },
//   };
// }

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

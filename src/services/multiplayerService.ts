// Simple multiplayer sync using localStorage + polling
// This works for demo purposes across tabs/windows
// Can be upgraded to Hathora WebSocket for production

import { TranscriptEntry, DebateTopic, Persona } from "@/data/debateData";

export interface DebateState {
  activeTopic: DebateTopic;
  transcript: TranscriptEntry[];
  speakingId: string | null;
  heatLevel: number;
  timeRemaining: number;
  isDebating: boolean;
  reactions: Record<string, number>;
  lastUpdate: number;
  roomId: string;
}

const STORAGE_KEY = "roundtaible_debate_state";
const ROOM_ID_KEY = "roundtaible_room_id";

export function getRoomId(): string {
  let roomId = localStorage.getItem(ROOM_ID_KEY);
  if (!roomId) {
    roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ROOM_ID_KEY, roomId);
  }
  return roomId;
}

export function broadcastState(state: Partial<DebateState>) {
  const currentState = getSharedState();
  const newState: DebateState = {
    ...currentState,
    ...state,
    lastUpdate: Date.now(),
    roomId: getRoomId(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(newState),
    storageArea: localStorage,
  }));
}

export function getSharedState(): DebateState | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearSharedState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function subscribeToState(callback: (state: DebateState) => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        callback(state);
      } catch (error) {
        console.error("Failed to parse shared state:", error);
      }
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}

// For demo: simple "multiplayer" by syncing room ID via URL
export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

export function setRoomIdInUrl(roomId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  window.history.replaceState({}, '', url.toString());
}

export function getShareableLink(): string {
  const roomId = getRoomId();
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  return url.toString();
}

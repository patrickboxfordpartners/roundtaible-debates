import { useState, useCallback, useRef, useEffect } from "react";
import {
  createProvider,
  generateRoomId,
  getRoomIdFromUrl,
  setRoomIdInUrl,
  clearRoomFromUrl,
  getShareableLink,
  saveSession,
  loadSession,
  clearSession,
  type RealtimeProvider,
  type RealtimeMessage,
  type RoomState,
} from "@/services/realtime";
import type { Persona } from "@/data/debateData";
import { toast } from "sonner";

export type MultiplayerRole = "solo" | "host" | "guest";

interface MultiplayerState {
  role: MultiplayerRole;
  roomId: string | null;
  guests: string[];
  guestName: string;
}

export function useMultiplayer() {
  const [state, setState] = useState<MultiplayerState>({
    role: "solo",
    roomId: null,
    guests: [],
    guestName: "",
  });

  const providerRef = useRef<RealtimeProvider | null>(null);
  const messageHandlerRef = useRef<((msg: RealtimeMessage) => void) | null>(null);

  // Set up message handler (called by the consumer to register their handler)
  const onMessage = useCallback((handler: (msg: RealtimeMessage) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  // Send a message to the room
  const send = useCallback((message: RealtimeMessage) => {
    providerRef.current?.send(message);
  }, []);

  // Shared: set up provider subscription with guest tracking
  const setupProvider = useCallback((provider: RealtimeProvider, isHost: boolean) => {
    provider.subscribe((msg) => {
      messageHandlerRef.current?.(msg);

      // Host: handle guest join/leave messages (BroadcastChannel fallback)
      if (isHost) {
        if (msg.type === "guest_join") {
          setState(prev => ({
            ...prev,
            guests: [...new Set([...prev.guests, msg.payload.name])],
          }));
          toast.info(`${msg.payload.name} joined the table`);
        }
        if (msg.type === "guest_leave") {
          setState(prev => ({
            ...prev,
            guests: prev.guests.filter(g => g !== msg.payload.name),
          }));
        }
        // Guest is requesting full state after reconnect
        if (msg.type === "request_sync") {
          toast.info(`${msg.payload.name} reconnected`);
        }
      }
    });

    // Supabase Presence: automatic guest tracking with reconnect support
    provider.onPresenceSync((names) => {
      if (isHost) {
        setState(prev => {
          // Detect new joins
          const newGuests = names.filter(n => !prev.guests.includes(n));
          for (const name of newGuests) {
            toast.info(`${name} joined the table`);
          }
          return { ...prev, guests: names };
        });
      }
    });
  }, []);

  // Host: create a new room
  const createRoom = useCallback(() => {
    const roomId = generateRoomId();
    const provider = createProvider(roomId);
    providerRef.current = provider;

    setupProvider(provider, true);

    setRoomIdInUrl(roomId);
    saveSession({ role: "host", roomId, guestName: "" });
    setState(prev => ({ ...prev, role: "host" as const, roomId, guests: [], guestName: "" }));
    toast.success("Room created! Share the link to invite others.");
    return roomId;
  }, [setupProvider]);

  // Guest: join an existing room
  const joinRoom = useCallback((roomId: string, name: string) => {
    const provider = createProvider(roomId);
    providerRef.current = provider;

    setupProvider(provider, false);

    // Track presence (Supabase) and announce (BroadcastChannel fallback)
    provider.trackPresence(name);
    provider.send({ type: "guest_join", payload: { name } });

    // Request full state sync from host
    provider.send({ type: "request_sync", payload: { name } });

    setRoomIdInUrl(roomId);
    saveSession({ role: "guest", roomId, guestName: name });
    setState({ role: "guest", roomId, guests: [], guestName: name });
    toast.success(`Joined room as ${name}`);
  }, [setupProvider]);

  // Leave the room
  const leaveRoom = useCallback(() => {
    if (state.role === "guest" && state.guestName) {
      send({ type: "guest_leave", payload: { name: state.guestName } });
    }
    providerRef.current?.disconnect();
    providerRef.current = null;
    clearRoomFromUrl();
    clearSession();
    setState({ role: "solo", roomId: null, guests: [], guestName: "" });
  }, [state.role, state.guestName, send]);

  // Host: broadcast full state sync
  const broadcastState = useCallback((roomState: RoomState) => {
    if (state.role !== "host") return;
    send({ type: "state_sync", payload: roomState });
  }, [state.role, send]);

  // Host: broadcast a transcript addition
  const broadcastTranscript = useCallback((entry: { personaId: string; text: string; id: string; timestamp: number }) => {
    if (state.role !== "host") return;
    send({ type: "transcript_add", payload: entry });
  }, [state.role, send]);

  // Host: broadcast speaking state (throttled by the provider)
  const broadcastSpeaking = useCallback((speakingId: string | null, thinkingId: string | null) => {
    if (state.role !== "host") return;
    send({ type: "speaking", payload: { speakingId, thinkingId } });
  }, [state.role, send]);

  // Host: broadcast timer updates (throttled by the provider)
  const broadcastTimer = useCallback((timeRemaining: number, heatLevel: number, isDebating: boolean, isLightning: boolean) => {
    if (state.role !== "host") return;
    send({ type: "timer", payload: { timeRemaining, heatLevel, isDebating, isLightning } });
  }, [state.role, send]);

  // Guest: send a message to the host
  const sendGuestMessage = useCallback((text: string) => {
    if (state.role !== "guest") return;
    send({ type: "guest_message", payload: { text, guestName: state.guestName } });
  }, [state.role, state.guestName, send]);

  // Guest: vote
  const sendGuestVote = useCallback((personaId: string) => {
    if (state.role !== "guest") return;
    send({ type: "guest_vote", payload: { personaId, guestName: state.guestName } });
  }, [state.role, state.guestName, send]);

  // Guest: reaction
  const sendGuestReaction = useCallback((emoji: string) => {
    if (state.role !== "guest") return;
    send({ type: "guest_reaction", payload: { emoji } });
  }, [state.role, send]);

  // Guest: send a persona to the host
  const sendGuestPersona = useCallback((persona: Persona) => {
    if (state.role !== "guest") return;
    send({ type: "guest_persona", payload: persona });
  }, [state.role, send]);

  // Get shareable link
  const getLink = useCallback(() => {
    if (!state.roomId) return "";
    return getShareableLink(state.roomId);
  }, [state.roomId]);

  // Copy link to clipboard
  const copyLink = useCallback(() => {
    const link = getLink();
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        toast.success("Room link copied!");
      });
    }
  }, [getLink]);

  // Check for room ID in URL on mount (auto-join)
  const pendingRoomId = getRoomIdFromUrl();

  // Session restore on mount — reconnect to room after page refresh
  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    if (session.role === "host") {
      const provider = createProvider(session.roomId);
      providerRef.current = provider;
      setupProvider(provider, true);
      setRoomIdInUrl(session.roomId);
      setState(prev => ({ ...prev, role: "host", roomId: session.roomId, guests: [] }));
      toast.info("Reconnected as host");
    } else if (session.role === "guest" && session.guestName) {
      const provider = createProvider(session.roomId);
      providerRef.current = provider;
      setupProvider(provider, false);
      provider.trackPresence(session.guestName);
      provider.send({ type: "guest_join", payload: { name: session.guestName } });
      provider.send({ type: "request_sync", payload: { name: session.guestName } });
      setRoomIdInUrl(session.roomId);
      setState({ role: "guest", roomId: session.roomId, guests: [], guestName: session.guestName });
      toast.info("Reconnected as guest");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      providerRef.current?.disconnect();
    };
  }, []);

  return {
    role: state.role,
    roomId: state.roomId,
    guests: state.guests,
    pendingRoomId,
    isMultiplayer: state.role !== "solo",
    isHost: state.role === "host",
    isGuest: state.role === "guest",
    createRoom,
    joinRoom,
    leaveRoom,
    onMessage,
    send,
    broadcastState,
    broadcastTranscript,
    broadcastSpeaking,
    broadcastTimer,
    sendGuestMessage,
    sendGuestVote,
    sendGuestReaction,
    sendGuestPersona,
    getLink,
    copyLink,
  };
}

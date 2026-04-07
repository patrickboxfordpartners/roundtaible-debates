import { useState, useCallback, useRef, useEffect } from "react";
import { personas, sampleTranscript, debateTopics, type TranscriptEntry, type Persona, type DebateTopic } from "@/data/debateData";
import { generatePersonaResponse, generateDebateSummary, isAPIAvailable, getAPIError } from "@/services/aiService";
import { toast } from "sonner";
import { speak, toggleMute } from "@/services/ttsService";
import { saveDebate } from "@/services/debateHistory";

export function useDebate() {
  const [activeTopic, setActiveTopic] = useState(debateTopics[0]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(sampleTranscript);
  const [speakingId, setSpeakingId] = useState<string | null>("edison");
  const [thinkingId, setThinkingId] = useState<string | null>(null);
  const [heatLevel, setHeatLevel] = useState(35);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isDebating, setIsDebating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Persona[]>(() => {
    try {
      const saved = localStorage.getItem("roundtaible_leaderboard");
      if (saved) {
        const wins: Record<string, number> = JSON.parse(saved);
        return [...personas]
          .map((p) => ({ ...p, wins: wins[p.id] ?? p.wins }))
          .sort((a, b) => b.wins - a.wins);
      }
    } catch (e) {
      console.warn("Failed to load leaderboard:", e);
    }
    return [...personas].sort((a, b) => b.wins - a.wins);
  });
  const [winner, setWinner] = useState<Persona | null>(null);
  const [personasState, setPersonasState] = useState<Persona[]>(personas);
  const [reactions, setReactions] = useState<Record<string, number>>({
    "\u{1F3A9}": 12, "\u{1F9D0}": 8, "\u{1F4DC}": 5, "\u23F1\uFE0F": 3, "\u2696\uFE0F": 7,
  });
  const [isLightningRound, setIsLightningRound] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const speakerRef = useRef<ReturnType<typeof setTimeout>>();
  const speakerIndexRef = useRef(0);
  const debateStartTimeRef = useRef(0);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const isGeneratingRef = useRef(false);
  const isDebatingRef = useRef(false);
  const isLightningRef = useRef(false);
  const isPausedRef = useRef(false);

  const generateNextResponse = useCallback(async () => {
    if (isGeneratingRef.current || !isDebatingRef.current || isPausedRef.current) return;
    isGeneratingRef.current = true;

    const currentPersonas = personasState.filter(p => p.id !== "human");
    if (currentPersonas.length === 0) {
      isGeneratingRef.current = false;
      return;
    }

    const currentPersona = currentPersonas[speakerIndexRef.current % currentPersonas.length];
    speakerIndexRef.current += 1;

    setThinkingId(currentPersona.id);

    try {
      const response = await generatePersonaResponse(
        currentPersona,
        activeTopic,
        transcript,
        personasState
      );

      if (!isDebatingRef.current) {
        setSpeakingId(null);
        setThinkingId(null);
        isGeneratingRef.current = false;
        return;
      }

      setThinkingId(null);
      setSpeakingId(currentPersona.id);

      setTranscript((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          personaId: currentPersona.id,
          text: response,
          timestamp: Date.now(),
        },
      ]);

      speak(response, currentPersona.id);

      setHeatLevel((h) => Math.min(100, h + Math.random() * 8 + 2));
    } catch (error: unknown) {
      console.error("Error generating response:", error);

      if (!isAPIAvailable()) {
        setSpeakingId(null);
        setThinkingId(null);
        isGeneratingRef.current = false;
        isDebatingRef.current = false;
        isLightningRef.current = false;
        setIsDebating(false);
        setIsLightningRound(false);
        clearInterval(timerRef.current);
        clearTimeout(speakerRef.current);
        const errMsg = getAPIError() || "API connection lost — debate paused";
        setApiError(errMsg);
        toast.error(errMsg);
        return;
      }
    }

    setSpeakingId(null);
    isGeneratingRef.current = false;

    if (!isDebatingRef.current) return;

    const baseDelay = isLightningRef.current ? 2000 : 5000;
    const randomDelay = isLightningRef.current ? 1000 : 3000;
    const delay = baseDelay + Math.random() * randomDelay;

    speakerRef.current = setTimeout(() => {
      generateNextResponse();
    }, delay);
  }, [activeTopic, transcript, personasState]);

  const startDebate = useCallback((lightning = false) => {
    isDebatingRef.current = true;
    isLightningRef.current = lightning;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsDebating(true);
    setIsLightningRound(lightning);
    setTimeRemaining(lightning ? 60 : 180);
    setHeatLevel(lightning ? 50 : 20);
    setWinner(null);
    setTranscript([]);
    speakerIndexRef.current = 0;
    debateStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearTimeout(speakerRef.current);
          isDebatingRef.current = false;
          isLightningRef.current = false;
          isGeneratingRef.current = false;
          setIsDebating(false);
          setIsLightningRound(false);
          setSpeakingId(null);
          setThinkingId(null);
          // Auto-save debate when timer expires
          const duration = Math.round((Date.now() - debateStartTimeRef.current) / 1000);
          if (transcriptRef.current.length > 0) {
            saveDebate(activeTopic, transcriptRef.current, personasState, null, duration);
          }
          return 0;
        }
        return t - 1;
      });
      // Heat increases but with slight decay when near max
      setHeatLevel((h) => {
        const increase = Math.random() * (lightning ? 5 : 2);
        const decay = h > 80 ? 1 : 0;
        return Math.min(100, Math.max(0, h + increase - decay));
      });
    }, 1000);

    generateNextResponse();
  }, [generateNextResponse]);

  const stopDebate = useCallback(() => {
    isDebatingRef.current = false;
    isLightningRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    setIsDebating(false);
    setIsLightningRound(false);
    clearInterval(timerRef.current);
    clearTimeout(speakerRef.current);
    setSpeakingId(null);
    setThinkingId(null);
    isGeneratingRef.current = false;
  }, []);

  const pauseDebate = useCallback(() => {
    if (!isDebatingRef.current || isPausedRef.current) return;
    isPausedRef.current = true;
    setIsPaused(true);
    clearInterval(timerRef.current);
    clearTimeout(speakerRef.current);
    isGeneratingRef.current = false;
    setSpeakingId(null);
    setThinkingId(null);
  }, []);

  const resumeDebate = useCallback(() => {
    if (!isDebatingRef.current || !isPausedRef.current) return;
    isPausedRef.current = false;
    setIsPaused(false);

    // Restart the timer from where it left off
    const lightning = isLightningRef.current;
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearTimeout(speakerRef.current);
          isDebatingRef.current = false;
          isLightningRef.current = false;
          isGeneratingRef.current = false;
          setIsDebating(false);
          setIsLightningRound(false);
          setSpeakingId(null);
          setThinkingId(null);
          const duration = Math.round((Date.now() - debateStartTimeRef.current) / 1000);
          if (transcriptRef.current.length > 0) {
            saveDebate(activeTopic, transcriptRef.current, personasState, null, duration);
          }
          return 0;
        }
        return t - 1;
      });
      setHeatLevel((h) => {
        const increase = Math.random() * (lightning ? 5 : 2);
        const decay = h > 80 ? 1 : 0;
        return Math.min(100, Math.max(0, h + increase - decay));
      });
    }, 1000);

    // Resume AI generation
    generateNextResponse();
  }, [generateNextResponse, activeTopic, personasState]);

  const selectTopic = useCallback((topicId: string) => {
    const topic = debateTopics.find((t) => t.id === topicId);
    if (topic) {
      if (isDebatingRef.current) {
        stopDebate();
      }
      setActiveTopic(topic);
      setTranscript([]);
      setHeatLevel(20);
    }
  }, [stopDebate]);

  const surpriseMe = useCallback(() => {
    const idx = Math.floor(Math.random() * debateTopics.length);
    selectTopic(debateTopics[idx].id);
    startDebate(false);
  }, [selectTopic, startDebate]);

  const startLightningRound = useCallback(() => {
    if (!isDebating) {
      startDebate(true);
    } else {
      isLightningRef.current = true;
      setIsLightningRound(true);
      setTimeRemaining(60);
      setHeatLevel(50);
    }
  }, [isDebating, startDebate]);

  const addTranscriptEntry = useCallback((personaId: string, text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: String(Date.now()), personaId, text, timestamp: Date.now() },
    ]);
    setHeatLevel((h) => Math.min(100, h + 5));

    // If a human just spoke during a debate, skip the delay and trigger an immediate response
    if (personaId === "human" && isDebatingRef.current && !isGeneratingRef.current) {
      clearTimeout(speakerRef.current);
      speakerRef.current = setTimeout(() => {
        generateNextResponse();
      }, 800); // Brief pause so the human entry renders first
    }
  }, [generateNextResponse]);

  const voteWinner = useCallback((personaId: string) => {
    const persona = leaderboard.find((p) => p.id === personaId);
    if (persona) {
      // Save debate before stopping
      const duration = Math.round((Date.now() - debateStartTimeRef.current) / 1000);
      if (transcriptRef.current.length > 0) {
        saveDebate(activeTopic, transcriptRef.current, personasState, personaId, duration);
      }
      stopDebate();
      const updatedWins = persona.wins + 1;
      setWinner({ ...persona, wins: updatedWins });
      setLeaderboard((prev) => {
        const updated = prev
          .map((p) => (p.id === personaId ? { ...p, wins: p.wins + 1 } : p))
          .sort((a, b) => b.wins - a.wins);
        const wins: Record<string, number> = {};
        updated.forEach((p) => { wins[p.id] = p.wins; });
        localStorage.setItem("roundtaible_leaderboard", JSON.stringify(wins));
        return updated;
      });
    }
  }, [stopDebate, leaderboard, activeTopic, personasState]);

  const addReaction = useCallback((emoji: string) => {
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  }, []);

  const dismissWinner = useCallback(() => setWinner(null), []);

  const updatePersonaContext = useCallback((personaId: string, context: string) => {
    setPersonasState((prev) =>
      prev.map((p) => (p.id === personaId ? { ...p, context } : p))
    );
  }, []);

  const removePersona = useCallback((personaId: string) => {
    setPersonasState((prev) => prev.filter((p) => p.id !== personaId));
    setLeaderboard((prev) => prev.filter((p) => p.id !== personaId));
    if (speakingId === personaId) setSpeakingId(null);
  }, [speakingId]);

  const addPersona = useCallback((persona: { name: string; role: string; color: string; context: string }) => {
    const id = persona.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newPersona: Persona = {
      id,
      name: persona.name,
      role: persona.role,
      avatar: "",
      color: persona.color,
      wins: 0,
      quotes: [],
      context: persona.context,
    };
    setPersonasState((prev) => [...prev, newPersona]);
    setLeaderboard((prev) => [...prev, newPersona].sort((a, b) => b.wins - a.wins));
  }, []);

  const addFromRoster = useCallback((persona: Persona) => {
    setPersonasState((prev) => [...prev, { ...persona, wins: 0 }]);
    setLeaderboard((prev) => [...prev, { ...persona, wins: 0 }].sort((a, b) => b.wins - a.wins));
  }, []);

  const summarizeDebate = useCallback(async () => {
    if (transcript.length === 0) return;

    const { text, narratorId } = await generateDebateSummary(activeTopic, transcript, personasState);

    setSpeakingId(narratorId);
    setTranscript((prev) => [
      ...prev,
      { id: String(Date.now()), personaId: narratorId, text, timestamp: Date.now() },
    ]);
    speak(text, narratorId);
    setSpeakingId(null);
  }, [activeTopic, transcript, personasState]);

  // --- Guest sync methods (called when receiving host broadcasts) ---

  const syncFromHost = useCallback((roomState: {
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
  }) => {
    setActiveTopic(roomState.topic);
    setTranscript(roomState.transcript);
    setPersonasState(roomState.personas);
    setSpeakingId(roomState.speakingId);
    setThinkingId(roomState.thinkingId);
    setTimeRemaining(roomState.timeRemaining);
    setHeatLevel(roomState.heatLevel);
    setIsDebating(roomState.isDebating);
    setIsLightningRound(roomState.isLightning);
    setReactions(roomState.reactions);
  }, []);

  const setSpeakingFromHost = useCallback((speaking: string | null, thinking: string | null) => {
    setSpeakingId(speaking);
    setThinkingId(thinking);
  }, []);

  const setTimerFromHost = useCallback((time: number, heat: number, debating: boolean, lightning: boolean) => {
    setTimeRemaining(time);
    setHeatLevel(heat);
    setIsDebating(debating);
    setIsLightningRound(lightning);
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = toggleMute();
    setIsMuted(muted);
  }, []);

  const clearApiError = useCallback(() => setApiError(null), []);

  const resetLeaderboard = useCallback(() => {
    localStorage.removeItem("roundtaible_leaderboard");
    setLeaderboard((prev) =>
      prev.map((p) => ({ ...p, wins: 0 })).sort((a, b) => b.wins - a.wins)
    );
  }, []);

  // Keep transcript ref in sync for use in closures
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(speakerRef.current);
    };
  }, []);

  return {
    activeTopic,
    transcript,
    speakingId,
    thinkingId,
    heatLevel,
    timeRemaining,
    isDebating,
    isLightningRound,
    leaderboard,
    winner,
    reactions,
    personasState,
    startDebate,
    stopDebate,
    selectTopic,
    surpriseMe,
    startLightningRound,
    addTranscriptEntry,
    voteWinner,
    addReaction,
    dismissWinner,
    updatePersonaContext,
    addPersona,
    addFromRoster,
    removePersona,
    summarizeDebate,
    isMuted,
    isPaused,
    pauseDebate,
    resumeDebate,
    handleToggleMute,
    apiError,
    clearApiError,
    resetLeaderboard,
    syncFromHost,
    setSpeakingFromHost,
    setTimerFromHost,
  };
}

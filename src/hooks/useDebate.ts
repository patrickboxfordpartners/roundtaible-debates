import { useState, useCallback, useRef, useEffect } from "react";
import { personas, sampleTranscript, debateTopics, type TranscriptEntry, type Persona } from "@/data/debateData";
import { generatePersonaResponse, generateDebateSummary, isAPIAvailable, getAPIError } from "@/services/aiService";
import { toast } from "sonner";
import { speak, toggleMute, getIsMuted, isTTSSupported } from "@/services/ttsService";

export function useDebate() {
  const [activeTopic, setActiveTopic] = useState(debateTopics[0]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(sampleTranscript);
  const [speakingId, setSpeakingId] = useState<string | null>("edison");
  const [heatLevel, setHeatLevel] = useState(35);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isDebating, setIsDebating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Persona[]>(() => {
    // Restore wins from localStorage
    try {
      const saved = localStorage.getItem("roundtaible_leaderboard");
      if (saved) {
        const wins: Record<string, number> = JSON.parse(saved);
        return [...personas]
          .map((p) => ({ ...p, wins: wins[p.id] ?? p.wins }))
          .sort((a, b) => b.wins - a.wins);
      }
    } catch {}
    return [...personas].sort((a, b) => b.wins - a.wins);
  });
  const [winner, setWinner] = useState<Persona | null>(null);
  const [personasState, setPersonasState] = useState<Persona[]>(personas);
  const [reactions, setReactions] = useState<Record<string, number>>({
    "🎩": 12, "🧐": 8, "📜": 5, "⏱️": 3, "⚖️": 7,
  });
  const [isLightningRound, setIsLightningRound] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const speakerRef = useRef<ReturnType<typeof setTimeout>>();
  const speakerIndexRef = useRef(0);
  const isGeneratingRef = useRef(false);
  const isDebatingRef = useRef(false);
  const isLightningRef = useRef(false);

  const generateNextResponse = useCallback(async () => {
    if (isGeneratingRef.current || !isDebatingRef.current) return;
    isGeneratingRef.current = true;

    const currentPersonas = personasState.filter(p => p.id !== "human");
    if (currentPersonas.length === 0) {
      isGeneratingRef.current = false;
      return;
    }

    // Cycle through personas
    const currentPersona = currentPersonas[speakerIndexRef.current % currentPersonas.length];
    speakerIndexRef.current += 1;

    setSpeakingId(currentPersona.id);

    try {
      const response = await generatePersonaResponse(
        currentPersona,
        activeTopic,
        transcript,
        personasState
      );

      // Check if debate was stopped while we were waiting for OpenAI
      if (!isDebatingRef.current) {
        setSpeakingId(null);
        isGeneratingRef.current = false;
        return;
      }

      setTranscript((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          personaId: currentPersona.id,
          text: response,
          timestamp: Date.now(),
        },
      ]);

      // Speak the response aloud
      speak(response, currentPersona.id);

      setHeatLevel((h) => Math.min(100, h + Math.random() * 8 + 2));
    } catch (error: any) {
      console.error("Error generating response:", error);

      // If the API circuit breaker tripped, stop the debate and notify user
      if (!isAPIAvailable()) {
        setSpeakingId(null);
        isGeneratingRef.current = false;
        // Stop debate gracefully
        isDebatingRef.current = false;
        isLightningRef.current = false;
        setIsDebating(false);
        setIsLightningRound(false);
        clearInterval(timerRef.current);
        clearTimeout(speakerRef.current);
        toast.error(getAPIError() || "API connection lost — debate paused");
        return;
      }
    }

    setSpeakingId(null);
    isGeneratingRef.current = false;

    // Only schedule next if still debating
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
    setIsDebating(true);
    setIsLightningRound(lightning);
    setTimeRemaining(lightning ? 60 : 180);
    setHeatLevel(lightning ? 50 : 20);
    setWinner(null);
    setTranscript([]); // Clear transcript for new debate
    speakerIndexRef.current = 0;

    // Timer countdown
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
          return 0;
        }
        return t - 1;
      });
      setHeatLevel((h) => Math.min(100, h + Math.random() * (lightning ? 5 : 2)));
    }, 1000);

    // Start AI responses
    generateNextResponse();
  }, [generateNextResponse]);

  const stopDebate = useCallback(() => {
    isDebatingRef.current = false;
    isLightningRef.current = false;
    setIsDebating(false);
    setIsLightningRound(false);
    clearInterval(timerRef.current);
    clearTimeout(speakerRef.current);
    setSpeakingId(null);
    isGeneratingRef.current = false;
  }, []);

  const selectTopic = useCallback((topicId: string) => {
    const topic = debateTopics.find((t) => t.id === topicId);
    if (topic) {
      setActiveTopic(topic);
      setTranscript([]);
      setHeatLevel(20);
    }
  }, []);

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
  }, []);

  const voteWinner = useCallback((personaId: string) => {
    const persona = leaderboard.find((p) => p.id === personaId);
    if (persona) {
      stopDebate();
      const updatedWins = persona.wins + 1;
      setWinner({ ...persona, wins: updatedWins });
      setLeaderboard((prev) => {
        const updated = prev
          .map((p) => (p.id === personaId ? { ...p, wins: p.wins + 1 } : p))
          .sort((a, b) => b.wins - a.wins);
        // Persist to localStorage
        const wins: Record<string, number> = {};
        updated.forEach((p) => { wins[p.id] = p.wins; });
        localStorage.setItem("roundtaible_leaderboard", JSON.stringify(wins));
        return updated;
      });
    }
  }, [stopDebate, leaderboard]);

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
  const summarizeDebate = useCallback(async () => {
    if (transcript.length === 0) return;

    setSpeakingId("twain");
    const summary = await generateDebateSummary(activeTopic, transcript, personasState);
    setTranscript((prev) => [
      ...prev,
      { id: String(Date.now()), personaId: "twain", text: summary, timestamp: Date.now() },
    ]);
    speak(summary, "twain");
    setSpeakingId(null);
  }, [activeTopic, transcript, personasState]);

  const handleToggleMute = useCallback(() => {
    const muted = toggleMute();
    setIsMuted(muted);
  }, []);

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
    removePersona,
    summarizeDebate,
    isMuted,
    handleToggleMute,
  };
}

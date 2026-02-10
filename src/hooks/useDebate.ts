import { useState, useCallback, useRef, useEffect } from "react";
import { personas, sampleTranscript, debateTopics, type TranscriptEntry, type Persona } from "@/data/debateData";
import { generatePersonaResponse, generateDebateSummary } from "@/services/aiService";

export function useDebate() {
  const [activeTopic, setActiveTopic] = useState(debateTopics[0]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(sampleTranscript);
  const [speakingId, setSpeakingId] = useState<string | null>("edison");
  const [heatLevel, setHeatLevel] = useState(35);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isDebating, setIsDebating] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Persona[]>(() =>
    [...personas].sort((a, b) => b.wins - a.wins)
  );
  const [winner, setWinner] = useState<Persona | null>(null);
  const [personasState, setPersonasState] = useState<Persona[]>(personas);
  const [reactions, setReactions] = useState<Record<string, number>>({
    "🎩": 12, "🧐": 8, "📜": 5, "⏱️": 3, "⚖️": 7,
  });

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const speakerRef = useRef<ReturnType<typeof setTimeout>>();
  const speakerIndexRef = useRef(0);
  const isGeneratingRef = useRef(false);

  const generateNextResponse = useCallback(async () => {
    if (isGeneratingRef.current || !isDebating) return;
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

      setTranscript((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          personaId: currentPersona.id,
          text: response,
          timestamp: Date.now(),
        },
      ]);

      setHeatLevel((h) => Math.min(100, h + Math.random() * 8 + 2));
    } catch (error) {
      console.error("Error generating response:", error);
    }

    setSpeakingId(null);
    isGeneratingRef.current = false;

    // Schedule next response (5-8 seconds)
    const delay = 5000 + Math.random() * 3000;
    speakerRef.current = setTimeout(() => {
      generateNextResponse();
    }, delay);
  }, [activeTopic, transcript, personasState, isDebating]);

  const startDebate = useCallback(() => {
    setIsDebating(true);
    setTimeRemaining(180);
    setHeatLevel(20);
    setWinner(null);
    setTranscript([]); // Clear transcript for new debate
    speakerIndexRef.current = 0;

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setIsDebating(false);
          return 0;
        }
        return t - 1;
      });
      setHeatLevel((h) => Math.min(100, h + Math.random() * 2));
    }, 1000);

    // Start AI responses
    generateNextResponse();
  }, [generateNextResponse]);

  const stopDebate = useCallback(() => {
    setIsDebating(false);
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
    startDebate();
  }, [selectTopic, startDebate]);

  const addTranscriptEntry = useCallback((personaId: string, text: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: String(Date.now()), personaId, text, timestamp: Date.now() },
    ]);
    setHeatLevel((h) => Math.min(100, h + 5));
  }, []);

  const voteWinner = useCallback((personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (persona) {
      stopDebate();
      setWinner({ ...persona, wins: persona.wins + 1 });
      setLeaderboard((prev) =>
        prev
          .map((p) => (p.id === personaId ? { ...p, wins: p.wins + 1 } : p))
          .sort((a, b) => b.wins - a.wins)
      );
    }
  }, [stopDebate]);

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
    setSpeakingId(null);
  }, [activeTopic, transcript, personasState]);

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
    leaderboard,
    winner,
    reactions,
    personasState,
    startDebate,
    stopDebate,
    selectTopic,
    surpriseMe,
    addTranscriptEntry,
    voteWinner,
    addReaction,
    dismissWinner,
    updatePersonaContext,
    addPersona,
    removePersona,
    summarizeDebate,
  };
}

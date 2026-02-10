import { useState, useCallback, useRef, useEffect } from "react";
import { personas, sampleTranscript, debateTopics, type TranscriptEntry, type Persona } from "@/data/debateData";

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
  const [reactions, setReactions] = useState<Record<string, number>>({
    "🎩": 12, "🧐": 8, "📜": 5, "⏱️": 3, "⚖️": 7,
  });

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const speakerRef = useRef<ReturnType<typeof setInterval>>();

  const startDebate = useCallback(() => {
    setIsDebating(true);
    setTimeRemaining(180);
    setHeatLevel(20);
    setWinner(null);

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
      setHeatLevel((h) => Math.min(100, h + Math.random() * 3));
    }, 1000);

    // Rotate speakers
    speakerRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * personas.length);
      setSpeakingId(personas[idx].id);
    }, 3000);
  }, []);

  const stopDebate = useCallback(() => {
    setIsDebating(false);
    clearInterval(timerRef.current);
    clearInterval(speakerRef.current);
    setSpeakingId(null);
  }, []);

  const selectTopic = useCallback((topicId: string) => {
    const topic = debateTopics.find((t) => t.id === topicId);
    if (topic) {
      setActiveTopic(topic);
      setTranscript(sampleTranscript);
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

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(speakerRef.current);
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
    startDebate,
    stopDebate,
    selectTopic,
    surpriseMe,
    addTranscriptEntry,
    voteWinner,
    addReaction,
    dismissWinner,
  };
}

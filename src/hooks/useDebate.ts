import { useState, useCallback, useRef, useEffect } from "react";
import { personas, sampleTranscript, debateTopics, type TranscriptEntry, type Persona, type DebateTopic } from "@/data/debateData";
import { generatePersonaResponse, generateDebateSummary, isAPIAvailable, getAPIError, resetCircuit } from "@/services/aiService";
import { toast } from "sonner";
import { speak, toggleMute } from "@/services/ttsService";
import { saveDebate } from "@/services/debateHistory";
import { track } from "@/services/analytics";
import { canStartDebate } from "@/lib/debateLimits";
import type { EducationalConfig } from "@/contexts/DebateModeContext";
import { supabase } from "@/services/supabaseClient";

async function syncLeaderboardWin(userId: string, personaId: string, personaName: string) {
  if (!supabase || !userId) return;
  try {
    await supabase.from("rt_leaderboards").upsert(
      { user_id: userId, persona_id: personaId, persona_name: personaName, wins: 1, updated_at: new Date().toISOString() },
      {
        onConflict: "user_id,persona_id",
        ignoreDuplicates: false,
      }
    );
    // Increment wins using RPC — fall back to select+update if RPC unavailable
    await supabase.rpc("increment_leaderboard_win", { p_user_id: userId, p_persona_id: personaId, p_persona_name: personaName }).catch(async () => {
      const { data } = await supabase!.from("rt_leaderboards").select("wins").eq("user_id", userId).eq("persona_id", personaId).single();
      await supabase!.from("rt_leaderboards").update({ wins: (data?.wins ?? 0) + 1, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("persona_id", personaId);
    });
  } catch (err) {
  }
}

interface DebateOptions {
  educationalConfig?: EducationalConfig;
  userId?: string;
  subscriptionTier?: string;
}

export function useDebate(educationalConfig?: EducationalConfig, userId?: string, subscriptionTier?: string) {
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
  const activeTopicRef = useRef(activeTopic);
  const personasStateRef = useRef(personasState);
  const isGeneratingRef = useRef(false);
  const isDebatingRef = useRef(false);
  const isLightningRef = useRef(false);
  const isPausedRef = useRef(false);
  const totalPauseTimeRef = useRef(0);
  const pausedAtRef = useRef(0);

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
        personasState,
        educationalConfig
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
  }, [activeTopic, transcript, personasState, educationalConfig]);

  const [limitReached, setLimitReached] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);

  const startDebate = useCallback(async (lightning = false) => {
    if (userId && subscriptionTier) {
      const { allowed, used, limit } = await canStartDebate(userId, subscriptionTier);
      if (!allowed) {
        setLimitReached(true);
        setUsageInfo({ used, limit });
        toast.error(`You've used all ${limit} debates this month. Upgrade your plan for more.`);
        return;
      }
      setUsageInfo({ used: used + 1, limit });
    }

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
    totalPauseTimeRef.current = 0;
    pausedAtRef.current = 0;

    track({
      event: "debate_start",
      topic: activeTopic.title,
      category: activeTopic.category,
      personaCount: personasState.filter((p) => p.id !== "human").length,
      mode: lightning ? "lightning" : "standard",
    });

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
          const duration = Math.round((Date.now() - debateStartTimeRef.current - totalPauseTimeRef.current) / 1000);
          if (transcriptRef.current.length > 0) {
            saveDebate(activeTopicRef.current, transcriptRef.current, personasStateRef.current, null, duration);
            track({
              event: "debate_end",
              topic: activeTopicRef.current.title,
              duration,
              exchangeCount: transcriptRef.current.length,
              winnerId: null,
            });
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
  }, [generateNextResponse, activeTopic, personasState]);

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
    pausedAtRef.current = Date.now();
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
    if (pausedAtRef.current > 0) {
      totalPauseTimeRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }
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
          const duration = Math.round((Date.now() - debateStartTimeRef.current - totalPauseTimeRef.current) / 1000);
          if (transcriptRef.current.length > 0) {
            saveDebate(activeTopicRef.current, transcriptRef.current, personasStateRef.current, null, duration);
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
  }, [generateNextResponse]);

  const selectTopic = useCallback((topicId: string) => {
    const topic = debateTopics.find((t) => t.id === topicId);
    if (topic) {
      if (isDebatingRef.current) {
        stopDebate();
      }
      setActiveTopic(topic);
      setTranscript([]);
      setHeatLevel(20);
      track({ event: "topic_select", topic: topic.title, category: topic.category });
    }
  }, [stopDebate]);

  const setCustomTopic = useCallback((title: string) => {
    if (!title.trim()) return;
    const custom: DebateTopic = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      category: "Custom",
    };
    if (isDebatingRef.current) stopDebate();
    setActiveTopic(custom);
    activeTopicRef.current = custom;
    setTranscript([]);
    setHeatLevel(20);
    track({ event: "topic_select", topic: custom.title, category: "Custom" });
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
      const duration = Math.round((Date.now() - debateStartTimeRef.current - totalPauseTimeRef.current) / 1000);
      if (transcriptRef.current.length > 0) {
        saveDebate(activeTopicRef.current, transcriptRef.current, personasStateRef.current, personaId, duration);
        track({
          event: "debate_end",
          topic: activeTopicRef.current.title,
          duration,
          exchangeCount: transcriptRef.current.length,
          winnerId: personaId,
        });
      }
      track({ event: "vote", personaId });
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
      // Sync win to Supabase for authenticated users
      if (userId) {
        syncLeaderboardWin(userId, personaId, persona.name);
      }
    }
  }, [stopDebate, leaderboard, userId]);

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
    track({ event: "persona_remove", personaId });
    setPersonasState((prev) => prev.filter((p) => p.id !== personaId));
    setLeaderboard((prev) => {
      const updated = prev.filter((p) => p.id !== personaId);
      // Sync persisted leaderboard
      const wins: Record<string, number> = {};
      updated.forEach((p) => { wins[p.id] = p.wins; });
      localStorage.setItem("roundtaible_leaderboard", JSON.stringify(wins));
      return updated;
    });
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
    track({ event: "persona_add", personaId: id, source: "custom" });
  }, []);

  const addFromRoster = useCallback((persona: Persona) => {
    setPersonasState((prev) => [...prev, { ...persona, wins: 0 }]);
    setLeaderboard((prev) => [...prev, { ...persona, wins: 0 }].sort((a, b) => b.wins - a.wins));
    track({ event: "persona_add", personaId: persona.id, source: "roster" });
  }, []);

  const summarizeDebate = useCallback(async () => {
    if (transcript.length === 0) return;
    track({ event: "summary_request" });

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

  const clearApiError = useCallback(() => {
    resetCircuit();
    setApiError(null);
  }, []);

  const resetLeaderboard = useCallback(() => {
    localStorage.removeItem("roundtaible_leaderboard");
    setLeaderboard((prev) =>
      prev.map((p) => ({ ...p, wins: 0 })).sort((a, b) => b.wins - a.wins)
    );
  }, []);

  // Keep refs in sync for use in interval/timeout closures
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { activeTopicRef.current = activeTopic; }, [activeTopic]);
  useEffect(() => { personasStateRef.current = personasState; }, [personasState]);

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
    setCustomTopic,
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
    limitReached,
    usageInfo,
  };
}

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { allPersonas } from "@/data/debateData";
import { useDebate } from "@/hooks/useDebate";
import { useDebateMode } from "@/contexts/DebateModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDarkMode } from "@/hooks/useDarkMode";
import { RoundTable } from "@/components/debate/RoundTable";
import { TranscriptPanel } from "@/components/debate/TranscriptPanel";
import { Leaderboard } from "@/components/debate/Leaderboard";
import { ControlBar } from "@/components/debate/ControlBar";
import { SpectatorBar } from "@/components/debate/SpectatorBar";
import { VictoryModal } from "@/components/debate/VictoryModal";
import { PersonaContextDialog } from "@/components/debate/PersonaContextDialog";
import { AddPersonaDialog } from "@/components/debate/AddPersonaDialog";
import { DebateHistory } from "@/components/debate/DebateHistory";
import { MultiplayerPanel } from "@/components/debate/MultiplayerPanel";
import { debateTopics } from "@/data/debateData";
import { motion, AnimatePresence } from "framer-motion";
import { History, Sun, Moon, Keyboard, Users, Zap } from "lucide-react";
import { canStartDebate, getMonthlyLimit } from "@/lib/debateLimits";
import { useNavigate } from "react-router-dom";
import type { Persona } from "@/data/debateData";
import type { RealtimeMessage } from "@/services/realtime";

const Index = () => {
  const { educationalConfig } = useDebateMode();
  const { user, profile } = useAuth();
  const debate = useDebate(educationalConfig, user?.id, profile?.subscription_tier);
  const mp = useMultiplayer();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const navigate = useNavigate();

  // Redirect unpaid users to pricing (skip in demo mode)
  const isDemoMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "true";
  }, []);

  // Load quota for authenticated paid users
  useEffect(() => {
    if (isDemoMode || !profile || profile.subscription_tier === "free") { setQuotaLoaded(true); return; }
    canStartDebate(profile.id, profile.subscription_tier).then(({ used }) => {
      setQuotaUsed(used);
      setQuotaLoaded(true);
    });
  }, [profile, isDemoMode]);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Quiz CTA: ?persona=edison pre-selects that persona and highlights their seat
  const quizPersonaId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("persona") || null;
  }, []);

  useEffect(() => {
    if (!quizPersonaId) return;
    const match = allPersonas.find((p) => p.id === quizPersonaId);
    if (!match) return;
    // If the persona is in the roster (not active), add them first
    const isActive = debate.personasState.some((p) => p.id === quizPersonaId);
    if (!isActive) {
      debate.addFromRoster(match);
    }
    // Open their context dialog so the user lands on something meaningful
    setSelectedPersona(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when quizPersonaId changes
  }, [quizPersonaId]);

  // Demo: auto-start first debate after 2s
  useEffect(() => {
    if (!isDemoMode) return;
    const timer = setTimeout(() => {
      debate.startDebate();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on mount in demo mode
  }, [isDemoMode]);

  // Demo: when timer hits 0, auto-pick winner, then advance
  useEffect(() => {
    if (!isDemoMode) return;
    if (debate.timeRemaining !== 0 || debate.isDebating) return;
    // Timer just expired, pick a random winner after 3s
    demoTimerRef.current = setTimeout(() => {
      const eligible = debate.personasState.filter(p => p.id !== "human");
      if (eligible.length > 0) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        debate.voteWinner(pick.id);
      }
    }, 3000);
    return () => clearTimeout(demoTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- specific debate fields listed to avoid re-running on every render
  }, [isDemoMode, debate.timeRemaining, debate.isDebating, debate.personasState, debate.voteWinner]);

  // Demo: after winner is dismissed, start next random topic
  const handleDemoAdvance = useCallback(() => {
    debate.dismissWinner();
    const idx = Math.floor(Math.random() * debateTopics.length);
    debate.selectTopic(debateTopics[idx].id);
    setTimeout(() => debate.startDebate(), 1000);
  }, [debate]);

  // --- Multiplayer message handling ---

  // Host: handle incoming guest messages
  useEffect(() => {
    if (!mp.isHost) return;

    mp.onMessage((msg: RealtimeMessage) => {
      switch (msg.type) {
        case "guest_message":
          debate.addTranscriptEntry("human", `[${msg.payload.guestName}]: ${msg.payload.text}`);
          break;
        case "guest_vote":
          debate.voteWinner(msg.payload.personaId);
          break;
        case "guest_reaction":
          debate.addReaction(msg.payload.emoji);
          break;
        case "guest_persona":
          debate.addFromRoster(msg.payload);
          break;
        case "request_sync":
          // Guest reconnected, send them the full current state
          mp.broadcastState({
            topic: debate.activeTopic,
            transcript: debate.transcript,
            personas: debate.personasState,
            speakingId: debate.speakingId,
            thinkingId: debate.thinkingId,
            timeRemaining: debate.timeRemaining,
            heatLevel: debate.heatLevel,
            isDebating: debate.isDebating,
            isLightning: debate.isLightningRound,
            reactions: debate.reactions,
            guests: mp.guests,
          });
          break;
      }
    });
  }, [mp.isHost, mp, debate]);

  // Host: broadcast state changes to guests
  useEffect(() => {
    if (!mp.isHost) return;
    mp.broadcastSpeaking(debate.speakingId, debate.thinkingId);
  }, [mp, debate.speakingId, debate.thinkingId]);

  useEffect(() => {
    if (!mp.isHost) return;
    mp.broadcastTimer(debate.timeRemaining, debate.heatLevel, debate.isDebating, debate.isLightningRound);
  }, [mp, debate.timeRemaining, debate.heatLevel, debate.isDebating, debate.isLightningRound]);

  useEffect(() => {
    if (!mp.isHost) return;
    // Broadcast new transcript entries
    const latest = debate.transcript[debate.transcript.length - 1];
    if (latest) {
      mp.broadcastTranscript(latest);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally tracking length, not full array reference
  }, [mp, debate.transcript.length]);

  // Guest: sync state from host
  useEffect(() => {
    if (!mp.isGuest) return;

    mp.onMessage((msg: RealtimeMessage) => {
      switch (msg.type) {
        case "state_sync":
          debate.syncFromHost(msg.payload);
          break;
        case "transcript_add":
          debate.addTranscriptEntry(msg.payload.personaId, msg.payload.text);
          break;
        case "speaking":
          debate.setSpeakingFromHost(msg.payload.speakingId, msg.payload.thinkingId);
          break;
        case "timer":
          debate.setTimerFromHost(msg.payload.timeRemaining, msg.payload.heatLevel, msg.payload.isDebating, msg.payload.isLightning);
          break;
        case "debate_end":
          if (msg.payload.winnerId) {
            debate.voteWinner(msg.payload.winnerId);
          } else {
            debate.stopDebate();
          }
          break;
      }
    });
  }, [mp.isGuest, mp, debate]);

  // Auto-show multiplayer panel if there's a room ID in the URL
  useEffect(() => {
    if (mp.pendingRoomId && mp.role === "solo") {
      setMultiplayerOpen(true);
    }
  }, [mp.pendingRoomId, mp.role]);

  // --- Event handlers ---

  const handlePitchIdea = (text: string) => {
    if (mp.isGuest) {
      mp.sendGuestMessage(`[Pitch]: ${text}`);
    } else {
      debate.addTranscriptEntry("edison", `[New pitch from the gallery]: ${text}`);
    }
  };

  const handleSummarize = useCallback(() => {
    debate.summarizeDebate();
  }, [debate]);

  const handleGallerySubmit = (text: string) => {
    if (mp.isGuest) {
      mp.sendGuestMessage(`[Gallery]: ${text}`);
    } else {
      debate.addTranscriptEntry("adams", `[Gallery suggestion]: "${text}", An intriguing proposition from the audience.`);
    }
  };

  const handleClickPersona = (persona: Persona) => {
    const current = debate.personasState.find(p => p.id === persona.id);
    setSelectedPersona(current || persona);
  };

  const handleJumpIn = (message: string) => {
    if (mp.isGuest) {
      mp.sendGuestMessage(message);
    } else {
      debate.addTranscriptEntry("human", `[You]: ${message}`);
    }
  };

  const handleVoiceInput = (text: string) => {
    if (mp.isGuest) {
      mp.sendGuestMessage(text);
    } else {
      debate.addTranscriptEntry("human", text);
    }
  };

  const handleVote = (personaId: string) => {
    if (mp.isGuest) {
      mp.sendGuestVote(personaId);
    } else {
      debate.voteWinner(personaId);
    }
  };

  const handleReaction = (emoji: string) => {
    if (mp.isGuest) {
      mp.sendGuestReaction(emoji);
    } else {
      debate.addReaction(emoji);
    }
  };

  const toggleHistory = useCallback(() => {
    setHistoryOpen(prev => !prev);
  }, []);

  // Gated start: check free tier / quota before launching debate
  const handleStartDebate = useCallback(async () => {
    if (isDemoMode) { debate.startDebate(); return; }
    if (!profile || profile.subscription_tier === "free") { setShowPaywall(true); return; }
    const { allowed, used } = await canStartDebate(profile.id, profile.subscription_tier);
    setQuotaUsed(used);
    if (!allowed) { setShowPaywall(true); return; }
    debate.startDebate();
  }, [isDemoMode, profile, debate]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onStartDebate: handleStartDebate,
    onStopDebate: debate.stopDebate,
    onLightningRound: debate.startLightningRound,
    onSurpriseMe: debate.surpriseMe,
    onToggleMute: debate.handleToggleMute,
    onSummarize: handleSummarize,
    onToggleHistory: toggleHistory,
    isDebating: debate.isDebating,
  });

  return (
    <div className={`min-h-screen flex flex-col bg-background parchment-texture vignette-overlay candlelight${isDemoMode ? " demo-mode" : ""}`} role="application" aria-label="Algonquin RoundtAIble debate platform">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between py-4 px-4 border-b border-border bg-card/40 relative z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        role="banner"
      >
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowShortcuts(prev => !prev)}
            className="p-2 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
            title="Keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Algonquin Roundt<span className="text-primary">AI</span>ble
          </h1>
          <p className="font-body text-xs md:text-sm text-muted-foreground italic mt-0.5">
            Where history's greatest minds debate the future
          </p>
          {isDemoMode && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-display font-bold tracking-widest uppercase rounded bg-primary/15 text-primary border border-primary/30">
              Demo Mode
            </span>
          )}
          {/* Quota bar */}
          {!isDemoMode && profile && profile.subscription_tier !== "free" && quotaLoaded && (
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-flex items-center gap-1.5 mt-1.5 group"
              title="View plan usage"
            >
              <span className="text-[10px] font-body text-muted-foreground">
                {quotaUsed}/{getMonthlyLimit(profile.subscription_tier)} debates
              </span>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaUsed / getMonthlyLimit(profile.subscription_tier) > 0.8
                      ? "bg-destructive"
                      : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, (quotaUsed / getMonthlyLimit(profile.subscription_tier)) * 100)}%` }}
                />
              </div>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMultiplayerOpen(true)}
            className={`p-2 rounded-lg border transition-colors ${
              mp.isMultiplayer
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            }`}
            title={mp.isMultiplayer ? `Room: ${mp.roomId}` : "Multiplayer"}
            aria-label="Open multiplayer settings"
          >
            <Users className="w-4 h-4" />
            {mp.guests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
                {mp.guests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-2 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
            title="Debate history (H)"
            aria-label="Open debate history"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Keyboard shortcuts tooltip */}
      {showShortcuts && (
        <motion.div
          className="absolute top-16 left-4 z-50 bg-card border border-border rounded-lg p-4 shadow-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-display text-sm font-bold text-foreground mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-body">
            <span className="text-muted-foreground">Start / Stop debate</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">Space</kbd>
            <span className="text-muted-foreground">Lightning round</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">L</kbd>
            <span className="text-muted-foreground">Surprise me</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">S</kbd>
            <span className="text-muted-foreground">Toggle mute</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">M</kbd>
            <span className="text-muted-foreground">Summarize</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">R</kbd>
            <span className="text-muted-foreground">History</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">H</kbd>
            <span className="text-muted-foreground">Stop debate</span><kbd className="text-foreground font-mono bg-background px-1 rounded border border-border">Esc</kbd>
          </div>
          <button
            onClick={() => setShowShortcuts(false)}
            className="mt-2 text-[10px] font-body text-muted-foreground hover:text-foreground"
          >
            Click or press any key to dismiss
          </button>
        </motion.div>
      )}

      {/* API error banner */}
      {debate.apiError && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/30 text-center relative z-20 flex items-center justify-center gap-3">
          <p className="text-xs font-display text-destructive">{debate.apiError}</p>
          <button
            onClick={() => { debate.clearApiError(); debate.startDebate(); }}
            className="px-3 py-1 text-xs font-display font-semibold rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Multiplayer guest banner */}
      {mp.isGuest && (
        <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 text-center relative z-20">
          <p className="text-xs font-display text-primary">
            Spectating, your messages are sent to the host
          </p>
        </div>
      )}
      {mp.isHost && mp.guests.length > 0 && (
        <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 text-center relative z-20">
          <p className="text-xs font-display text-primary">
            Hosting for {mp.guests.length} guest{mp.guests.length > 1 ? "s" : ""}: {mp.guests.join(", ")}
          </p>
        </div>
      )}

      {/* Paused for discussion overlay */}
      <AnimatePresence>
        {debate.isPaused && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-amber-500/90 text-white px-8 py-4 rounded-2xl shadow-2xl pointer-events-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="font-display text-lg md:text-2xl font-bold text-center">
                Paused for Class Discussion
              </p>
              <p className="font-body text-xs text-white/80 text-center mt-1">
                Click "Resume Debate" to continue
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0" role="main">
        {/* Center: Round Table */}
        <div className="flex-1 flex items-center justify-center p-2 lg:p-4 min-h-0">
          <RoundTable
            activeTopic={debate.activeTopic}
            speakingId={debate.speakingId}
            thinkingId={debate.thinkingId}
            heatLevel={debate.heatLevel}
            timeRemaining={debate.timeRemaining}
            isDebating={debate.isDebating}
            winner={debate.winner}
            personasState={debate.personasState}
            onClickPersona={handleClickPersona}
            onAddPersona={() => setAddDialogOpen(true)}
            onJumpIn={handleJumpIn}
          />
        </div>

        {/* Right panel: Transcript + Leaderboard */}
        <motion.aside
          className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card/30 flex flex-col h-[250px] lg:h-auto relative z-20 shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          aria-label="Debate transcript and leaderboard"
        >
          <div className="flex-1 overflow-hidden min-h-0">
            <TranscriptPanel
              entries={debate.transcript}
              personasState={debate.personasState}
              highlightVocabulary={educationalConfig.vocabularyHighlights}
              gradeLevel={educationalConfig.gradeLevel}
            />
          </div>
          <div className="border-t border-border shrink-0">
            <Leaderboard leaderboard={debate.leaderboard} onReset={debate.resetLeaderboard} hideReset={isDemoMode} />
          </div>
        </motion.aside>
      </div>

      {/* Spectator bar */}
      <div className="relative z-20">
        <SpectatorBar
          reactions={debate.reactions}
          onReaction={handleReaction}
          onGallerySubmit={handleGallerySubmit}
        />
      </div>

      {/* Control bar (hidden in demo mode) */}
      {!isDemoMode && (
        <nav className="relative z-20" aria-label="Debate controls">
          <ControlBar
            isDebating={debate.isDebating}
            personasState={debate.personasState}
            onStartDebate={handleStartDebate}
            onCustomTopic={debate.setCustomTopic}
            onStopDebate={debate.stopDebate}
            onSelectTopic={debate.selectTopic}
            onSurpriseMe={debate.surpriseMe}
            onLightningRound={debate.startLightningRound}
            onPitchIdea={handlePitchIdea}
            onVote={handleVote}
            onSummarize={handleSummarize}
            onVoiceInput={handleVoiceInput}
            isMuted={debate.isMuted}
            onToggleMute={debate.handleToggleMute}
            isPaused={debate.isPaused}
            onPauseDebate={debate.pauseDebate}
            onResumeDebate={debate.resumeDebate}
          />
        </nav>
      )}

      {/* Victory modal */}
      <VictoryModal
        winner={debate.winner}
        onDismiss={isDemoMode ? handleDemoAdvance : debate.dismissWinner}
        autoDismissMs={isDemoMode ? 5000 : undefined}
      />

      {/* Persona context dialog */}
      <PersonaContextDialog
        persona={selectedPersona}
        onClose={() => setSelectedPersona(null)}
        onSave={debate.updatePersonaContext}
        onRemove={debate.removePersona}
      />

      {/* Debate history dialog */}
      <DebateHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Multiplayer panel */}
      <MultiplayerPanel
        open={multiplayerOpen}
        onClose={() => setMultiplayerOpen(false)}
        role={mp.role}
        roomId={mp.roomId}
        guests={mp.guests}
        pendingRoomId={mp.pendingRoomId}
        onCreateRoom={mp.createRoom}
        onJoinRoom={mp.joinRoom}
        onLeaveRoom={mp.leaveRoom}
        onCopyLink={mp.copyLink}
      />

      {/* Add persona dialog */}
      <AddPersonaDialog
        open={addDialogOpen}
        existingIds={debate.personasState.map(p => p.id)}
        onClose={() => setAddDialogOpen(false)}
        onAdd={debate.addPersona}
        onAddFromRoster={debate.addFromRoster}
      />

      {/* Paywall modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowPaywall(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              {profile && profile.subscription_tier !== "free" ? (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2">Monthly Limit Reached</h2>
                  <p className="text-muted-foreground font-body mb-2">
                    You've used <strong>{quotaUsed}</strong> of <strong>{getMonthlyLimit(profile.subscription_tier)}</strong> debates this month.
                  </p>
                  <p className="text-sm text-muted-foreground font-body mb-6">
                    Your quota resets on the 1st of next month, or upgrade to get more debates.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-2">Unlock The Roundtaible</h2>
                  <p className="text-muted-foreground font-body mb-6">
                    You're watching a demo. Subscribe to start your own debates, save history, and access all 14 personas.
                  </p>
                </>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowPaywall(false); navigate("/pricing"); }}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  {profile && profile.subscription_tier !== "free" ? "Upgrade Plan" : "See Plans"}
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
                >
                  Continue watching
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

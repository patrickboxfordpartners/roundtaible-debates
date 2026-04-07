import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useDebate } from "@/hooks/useDebate";
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
import { motion } from "framer-motion";
import { History, Sun, Moon, Keyboard, Users } from "lucide-react";
import type { Persona } from "@/data/debateData";
import type { RealtimeMessage } from "@/services/realtime";

const Index = () => {
  const debate = useDebate();
  const mp = useMultiplayer();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Demo/kiosk mode
  const isDemoMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "true";
  }, []);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Demo: auto-start first debate after 2s
  useEffect(() => {
    if (!isDemoMode) return;
    const timer = setTimeout(() => {
      debate.startDebate();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  // Demo: when timer hits 0, auto-pick winner, then advance
  useEffect(() => {
    if (!isDemoMode) return;
    if (debate.timeRemaining !== 0 || debate.isDebating) return;
    // Timer just expired — pick a random winner after 3s
    demoTimerRef.current = setTimeout(() => {
      const eligible = debate.personasState.filter(p => p.id !== "human");
      if (eligible.length > 0) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        debate.voteWinner(pick.id);
      }
    }, 3000);
    return () => clearTimeout(demoTimerRef.current);
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
      debate.addTranscriptEntry("adams", `[Gallery suggestion]: "${text}" — An intriguing proposition from the audience.`);
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onStartDebate: () => debate.startDebate(),
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
            Spectating — your messages are sent to the host
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
            <TranscriptPanel entries={debate.transcript} personasState={debate.personasState} />
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
            onStartDebate={debate.startDebate}
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
    </div>
  );
};

export default Index;

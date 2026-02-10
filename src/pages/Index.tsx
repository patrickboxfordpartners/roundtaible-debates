import { useDebate } from "@/hooks/useDebate";
import { RoundTable } from "@/components/debate/RoundTable";
import { TranscriptPanel } from "@/components/debate/TranscriptPanel";
import { Leaderboard } from "@/components/debate/Leaderboard";
import { ControlBar } from "@/components/debate/ControlBar";
import { SpectatorBar } from "@/components/debate/SpectatorBar";
import { VictoryModal } from "@/components/debate/VictoryModal";
import { motion } from "framer-motion";

const Index = () => {
  const debate = useDebate();

  const handlePitchIdea = (text: string) => {
    debate.addTranscriptEntry("edison", `[New pitch from the gallery]: ${text}`);
  };

  const handleSummarize = () => {
    debate.addTranscriptEntry("twain", "If I may summarize: we've argued in circles—much like this table—and arrived precisely where we started, only more exhausted.");
  };

  const handleGallerySubmit = (text: string) => {
    debate.addTranscriptEntry("adams", `[Gallery suggestion]: "${text}" — An intriguing proposition from the audience.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background parchment-texture">
      {/* Header */}
      <motion.header
        className="text-center py-4 px-4 border-b border-border bg-card/40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Algonquin Round<span className="text-primary">AI</span>ble
        </h1>
        <p className="font-body text-xs md:text-sm text-muted-foreground italic mt-0.5">
          Where history's greatest minds debate the future
        </p>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center: Round Table */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[400px] lg:min-h-0">
          <RoundTable
            activeTopic={debate.activeTopic}
            speakingId={debate.speakingId}
            heatLevel={debate.heatLevel}
            timeRemaining={debate.timeRemaining}
            isDebating={debate.isDebating}
            onVote={debate.voteWinner}
            winner={debate.winner}
          />
        </div>

        {/* Right panel: Transcript + Leaderboard */}
        <motion.div
          className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card/30 flex flex-col max-h-[400px] lg:max-h-none"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex-1 overflow-hidden">
            <TranscriptPanel entries={debate.transcript} />
          </div>
          <div className="border-t border-border">
            <Leaderboard leaderboard={debate.leaderboard} />
          </div>
        </motion.div>
      </div>

      {/* Spectator bar */}
      <SpectatorBar
        reactions={debate.reactions}
        onReaction={debate.addReaction}
        onGallerySubmit={handleGallerySubmit}
      />

      {/* Control bar */}
      <ControlBar
        isDebating={debate.isDebating}
        onStartDebate={debate.startDebate}
        onStopDebate={debate.stopDebate}
        onSelectTopic={debate.selectTopic}
        onSurpriseMe={debate.surpriseMe}
        onPitchIdea={handlePitchIdea}
        onVote={debate.voteWinner}
        onSummarize={handleSummarize}
      />

      {/* Victory modal */}
      <VictoryModal winner={debate.winner} onDismiss={debate.dismissWinner} />
    </div>
  );
};

export default Index;

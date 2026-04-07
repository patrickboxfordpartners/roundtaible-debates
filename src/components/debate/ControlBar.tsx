import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Zap, Shuffle, FileText, Send, Volume2, VolumeX, GraduationCap, Pause, Play } from "lucide-react";
import { debateTopics, type DebateTopic } from "@/data/debateData";
import type { Persona } from "@/data/debateData";
import { startVoiceInput, stopVoiceInput, isVoiceSupported } from "@/services/voiceInputService";
import { getDebateMode, setDebateMode, type DebateMode } from "@/services/aiService";
import { toast } from "sonner";

interface ControlBarProps {
  isDebating: boolean;
  personasState: Persona[];
  onStartDebate: () => void;
  onStopDebate: () => void;
  onSelectTopic: (id: string) => void;
  onSurpriseMe: () => void;
  onLightningRound: () => void;
  onPitchIdea: (text: string) => void;
  onVote: (personaId: string) => void;
  onSummarize: () => void;
  onVoiceInput?: (text: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isPaused?: boolean;
  onPauseDebate?: () => void;
  onResumeDebate?: () => void;
}

export function ControlBar({
  isDebating,
  personasState,
  onStartDebate,
  onStopDebate,
  onSelectTopic,
  onSurpriseMe,
  onLightningRound,
  onPitchIdea,
  onVote,
  onSummarize,
  onVoiceInput,
  isMuted,
  onToggleMute,
  isPaused,
  onPauseDebate,
  onResumeDebate,
}: ControlBarProps) {
  const [micOn, setMicOn] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [topicCategory, setTopicCategory] = useState<string>("All");
  const [debateMode, setDebateModeState] = useState<DebateMode>(getDebateMode());

  const toggleMode = () => {
    const next = debateMode === "standard" ? "educational" : "standard";
    setDebateMode(next);
    setDebateModeState(next);
    toast.info(next === "educational" ? "Educational mode: AI will cite sources and facts" : "Standard mode: entertainment debate");
  };

  const eduSubjects = ["US History", "World History", "Science & Ethics", "Philosophy & Logic"];
  const standardCategories = Array.from(new Set(debateTopics.filter(t => !t.subject).map(t => t.category)));
  const eduCategories = Array.from(new Set(debateTopics.filter(t => t.subject).map(t => t.category)));
  const isEdu = debateMode === "educational";
  const filteredTopics = topicCategory === "All" ? debateTopics : debateTopics.filter(t => t.category === topicCategory);

  const handlePitch = () => {
    if (pitchText.trim()) {
      onPitchIdea(pitchText.trim());
      setPitchText("");
    }
  };

  const toggleMic = () => {
    if (micOn) {
      stopVoiceInput();
      setMicOn(false);
      setIsListening(false);
      toast.info("Microphone off");
    } else {
      if (!isVoiceSupported()) {
        toast.error("Voice input not supported in this browser");
        return;
      }

      setMicOn(true);
      toast.info("Listening — speak to join the debate");

      startVoiceInput({
        onSpeechStart: () => setIsListening(true),
        onSpeechEnd: () => setIsListening(false),
        onTranscript: (transcript, isFinal) => {
          if (isFinal && transcript.trim() && onVoiceInput) {
            onVoiceInput(transcript.trim());
          }
        },
        onError: (error) => {
          console.error("Voice error:", error);
          toast.error(typeof error === "string" ? error : "Voice input error");
          setMicOn(false);
          setIsListening(false);
        },
      });
    }
  };

  useEffect(() => {
    return () => {
      if (micOn) stopVoiceInput();
    };
  }, [micOn]);

  const votePersonas = personasState.filter(p => p.id !== "human");

  return (
    <motion.div
      className="w-full bg-card border-t border-border"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Topics row */}
      <div className="px-4 py-2 border-b border-border overflow-x-auto">
        <div className="flex gap-2 items-center min-w-max">
          <button
            onClick={() => setTopicCategory("All")}
            className={`px-2 py-0.5 text-[10px] font-display font-semibold rounded-full transition-colors whitespace-nowrap ${
              topicCategory === "All"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            All
          </button>
          {standardCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setTopicCategory(cat)}
              className={`px-2 py-0.5 text-[10px] font-display font-semibold rounded-full transition-colors whitespace-nowrap ${
                topicCategory === cat
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
          {eduCategories.length > 0 && (
            <>
              <span className={`w-px h-4 mx-1 ${isEdu ? "bg-green-500/50" : "bg-border"}`} />
              <span className={`text-[9px] font-display font-semibold uppercase tracking-wider ${isEdu ? "text-green-500" : "text-muted-foreground/50"}`}>
                Edu
              </span>
            </>
          )}
          {eduCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setTopicCategory(cat)}
              className={`px-2 py-0.5 text-[10px] font-display font-semibold rounded-full transition-colors whitespace-nowrap ${
                topicCategory === cat
                  ? isEdu
                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                    : "bg-primary/20 text-primary border border-primary/30"
                  : isEdu
                    ? "text-green-600 hover:text-green-500 border border-transparent"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          {filteredTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => { onSelectTopic(topic.id); if (!isDebating) onStartDebate(); }}
              className="px-3 py-1 text-xs font-body rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
            >
              {topic.title}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
        {/* Speaker mute */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? "bg-muted text-muted-foreground border-border"
                : "bg-background border-border hover:border-primary/50"
            }`}
            title={isMuted ? "Unmute voices" : "Mute voices"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Educational mode toggle */}
        <button
          onClick={toggleMode}
          className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
            isEdu
              ? "bg-green-500/15 text-green-500 border-green-500/30"
              : "bg-background border-border hover:border-primary/50 text-muted-foreground"
          }`}
          title={isEdu ? "Switch to standard mode" : "Switch to educational mode"}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="text-[10px] font-display font-semibold whitespace-nowrap">
            Edu Mode {isEdu && "(Active)"}
          </span>
        </button>

        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`p-2 rounded-lg border transition-colors relative ${
            micOn
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:border-primary/50"
          } ${isListening ? "animate-pulse" : ""}`}
          title={micOn ? "Stop microphone" : "Start microphone"}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {isListening && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Pitch input */}
        <div className="flex-1 min-w-[180px] flex gap-1">
          <input
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePitch()}
            placeholder="Pitch an idea..."
            className="flex-1 px-3 py-1.5 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handlePitch}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <button
          onClick={onSurpriseMe}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
        >
          <Shuffle className="w-3.5 h-3.5" /> Surprise Me
        </button>

        <button
          onClick={isDebating ? onStopDebate : onLightningRound}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <Zap className="w-3.5 h-3.5" /> {isDebating ? "End Round" : "Lightning Round"}
        </button>

        {/* Pause / Resume for class discussion */}
        {isDebating && onPauseDebate && onResumeDebate && (
          <button
            onClick={isPaused ? onResumeDebate : onPauseDebate}
            className={`px-3 py-1.5 text-xs font-display font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              isPaused
                ? "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/25"
                : "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25"
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? "Resume Debate" : "Pause for Discussion"}
          </button>
        )}

        <button
          onClick={onSummarize}
          className="px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" /> Summarize
        </button>

        {/* Vote avatars — uses dynamic personasState */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] font-display text-muted-foreground mr-1">Vote:</span>
          {votePersonas.map((p) => (
            <button
              key={p.id}
              onClick={() => onVote(p.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-transparent hover:border-primary transition-all hover:scale-110"
              style={{ backgroundColor: p.color }}
              title={`Vote for ${p.name}`}
            >
              {p.name[0]}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

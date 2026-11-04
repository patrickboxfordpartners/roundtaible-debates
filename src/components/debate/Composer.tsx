import { useState, useEffect } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { startVoiceInput, stopVoiceInput, isVoiceSupported } from "@/services/voiceInputService";
import { track } from "@/services/analytics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  onSendMessage: (text: string) => void;
  onVoiceInput?: (text: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  placeholder?: string;
}

export function Composer({ onSendMessage, onVoiceInput, isMuted, onToggleMute, placeholder = "Jump in with your argument..." }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
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
      toast.info("Listening, speak to join the debate");

      startVoiceInput({
        onSpeechStart: () => setIsListening(true),
        onSpeechEnd: () => {
          setIsListening(false);
          setInterimTranscript("");
        },
        onTranscript: (transcript, isFinal) => {
          if (isFinal && transcript.trim() && onVoiceInput) {
            onVoiceInput(transcript.trim());
            setInterimTranscript("");
            track({ event: "voice_input" });
          } else if (!isFinal) {
            setInterimTranscript(transcript);
          }
        },
        onError: (error) => {
          toast.error(typeof error === "string" ? error : "Voice input error");
          setMicOn(false);
          setIsListening(false);
          setInterimTranscript("");
        },
      });
    }
  };

  useEffect(() => {
    return () => {
      if (micOn) stopVoiceInput();
    };
  }, [micOn]);

  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      {micOn && interimTranscript && (
        <p className="mb-2 text-xs font-body text-muted-foreground italic truncate">
          {interimTranscript}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-3 py-2 text-sm font-body rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Jump into the debate"
        />
        {onToggleMute && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleMute}
            title={isMuted ? "Unmute AI voices" : "Mute AI voices"}
            aria-label={isMuted ? "Unmute AI voices" : "Mute AI voices"}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMic}
          className={`relative ${isListening ? "animate-pulse" : ""}`}
          title={micOn ? "Stop microphone" : "Start microphone"}
          aria-label={micOn ? "Stop microphone" : "Start microphone"}
          aria-pressed={micOn}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {isListening && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" aria-hidden="true" />
          )}
        </Button>
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!message.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

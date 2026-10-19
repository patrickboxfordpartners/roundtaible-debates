// Text-to-speech using the /api/tts proxy to ElevenLabs
// Falls back to browser SpeechSynthesis if the proxy is unavailable

import { apiFetch } from "./api";
import { toast } from "sonner";

// Fallback browser TTS config (used if edge function is unavailable)
interface BrowserVoiceConfig {
  pitch: number;
  rate: number;
}

const browserVoices: Record<string, BrowserVoiceConfig> = {
  edison: { pitch: 0.9, rate: 1.0 },
  morgan: { pitch: 0.6, rate: 0.85 },
  carnegie: { pitch: 0.85, rate: 0.95 },
  twain: { pitch: 1.0, rate: 1.1 },
  adams: { pitch: 0.75, rate: 0.8 },
  tesla: { pitch: 1.1, rate: 1.05 },
  human: { pitch: 0.9, rate: 1.0 },
};

let isMuted = false;
let currentAudio: HTMLAudioElement | null = null;
// Premium voices go through /api/tts. If the server says voice isn't set up (503),
// stop trying for this session and quietly use the browser voice instead.
let useElevenLabs = true;

export function isTTSSupported(): boolean {
  return useElevenLabs || "speechSynthesis" in window;
}

/** Play proxied ElevenLabs audio or use browser speech on failure; a 503 disables premium voices for the session. */
async function speakElevenLabs(text: string, personaId: string) {
  if (isMuted) return;

  try {
    const res = await apiFetch("tts", { text, personaId });

    if (res.status === 503) {
      useElevenLabs = false;
      speakBrowserTTS(text, personaId);
      return;
    }

    if (!res.ok) {
      console.error("TTS proxy error:", res.status);
      toast.warning("Premium voice unavailable, using browser fallback");
      speakBrowserTTS(text, personaId);
      return;
    }

    if (!(res.headers.get("content-type") || "").includes("audio")) {
      console.error("TTS proxy returned non-audio data");
      toast.warning("Voice service error, using browser TTS");
      speakBrowserTTS(text, personaId);
      return;
    }

    const blob = await res.blob();

    const audioUrl = URL.createObjectURL(blob);

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // Play the audio
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = 0.85;
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    };
    await currentAudio.play();
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    toast.warning("Voice service temporarily unavailable, using browser TTS");
    speakBrowserTTS(text, personaId);
  }
}

function speakBrowserTTS(text: string, personaId: string) {
  if (isMuted || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const config = browserVoices[personaId] || browserVoices.human;

  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  if (englishVoices.length > 0) {
    const idx = Object.keys(browserVoices).indexOf(personaId);
    utterance.voice = englishVoices[Math.abs(idx) % englishVoices.length];
  }

  window.speechSynthesis.speak(utterance);
}

export async function speak(text: string, personaId: string) {
  if (useElevenLabs) {
    await speakElevenLabs(text, personaId);
  } else {
    speakBrowserTTS(text, personaId);
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (muted) stopSpeaking();
}

export function getIsMuted(): boolean {
  return isMuted;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (isMuted) stopSpeaking();
  return isMuted;
}

// Pre-load browser voices (some browsers load them async)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

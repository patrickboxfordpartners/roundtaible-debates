// Text-to-speech using Supabase Edge Function proxy to ElevenLabs
// Falls back to browser SpeechSynthesis if Supabase is not configured

import { supabase } from "./supabaseClient";
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
const useElevenLabs = !!supabase; // Use edge function proxy if supabase is configured

export function isTTSSupported(): boolean {
  return useElevenLabs || "speechSynthesis" in window;
}

async function speakElevenLabs(text: string, personaId: string) {
  if (!supabase || isMuted) return;

  try {
    const { data, error } = await supabase.functions.invoke("tts-proxy", {
      body: { text, personaId },
    });

    if (error) {
      console.error("TTS proxy error:", error);
      toast.warning("Premium voice unavailable, using browser fallback");
      speakBrowserTTS(text, personaId);
      return;
    }

    // data is the raw response — convert to blob
    let blob: Blob;
    if (data instanceof Blob) {
      blob = data;
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: "audio/mpeg" });
    } else {
      // If we got JSON back, it's an error
      console.error("TTS proxy returned non-audio data:", data);
      toast.warning("Voice service error, using browser TTS");
      speakBrowserTTS(text, personaId);
      return;
    }

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
if (!useElevenLabs && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

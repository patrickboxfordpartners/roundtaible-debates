// Text-to-speech using ElevenLabs API for high-quality persona voices
// Falls back to browser SpeechSynthesis if API key is missing

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
}

// ElevenLabs voice IDs for each persona
// These are pre-built voices from ElevenLabs voice library
const personaVoices: Record<string, VoiceConfig> = {
  edison: {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - deep, authoritative inventor
    stability: 0.75,
    similarityBoost: 0.75,
  },
  morgan: {
    voiceId: "TxGEqnHWrfWFTfGW9XjX", // Josh - deep, commanding banker
    stability: 0.85,
    similarityBoost: 0.8,
  },
  carnegie: {
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni - warm, educated philanthropist
    stability: 0.7,
    similarityBoost: 0.75,
  },
  twain: {
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - narrative, witty storyteller
    stability: 0.6,
    similarityBoost: 0.7,
  },
  adams: {
    voiceId: "VR6AewLTigWG4xSOukaG", // Arnold - calm, scholarly historian
    stability: 0.8,
    similarityBoost: 0.8,
  },
  tesla: {
    voiceId: "IKne3meq5aSn9XLyUdCD", // Charlie - energetic, eccentric visionary
    stability: 0.65,
    similarityBoost: 0.7,
  },
  wilde: {
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni - theatrical, witty
    stability: 0.65,
    similarityBoost: 0.75,
  },
  einstein: {
    voiceId: "VR6AewLTigWG4xSOukaG", // Arnold - thoughtful, theoretical
    stability: 0.75,
    similarityBoost: 0.8,
  },
  cleopatra: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - regal, commanding
    stability: 0.75,
    similarityBoost: 0.75,
  },
  darwin: {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - observant, scientific
    stability: 0.8,
    similarityBoost: 0.8,
  },
  hypatia: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - intellectual, precise
    stability: 0.8,
    similarityBoost: 0.75,
  },
  machiavelli: {
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - calculating, strategic
    stability: 0.75,
    similarityBoost: 0.75,
  },
  curie: {
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella - focused, determined
    stability: 0.8,
    similarityBoost: 0.8,
  },
  "sun-tzu": {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - wise, strategic
    stability: 0.85,
    similarityBoost: 0.8,
  },
  human: {
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam - default
    stability: 0.75,
    similarityBoost: 0.75,
  },
};

// Fallback browser TTS config (used if ElevenLabs API key is missing)
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
let elevenLabsClient: ElevenLabsClient | null = null;
let useElevenLabs = false;

// Initialize ElevenLabs client
const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
if (apiKey) {
  elevenLabsClient = new ElevenLabsClient({ apiKey });
  useElevenLabs = true;
  console.log("✓ ElevenLabs TTS enabled");
} else {
  console.warn("⚠ ElevenLabs API key not found, falling back to browser TTS");
}

export function isTTSSupported(): boolean {
  return useElevenLabs || "speechSynthesis" in window;
}

async function speakElevenLabs(text: string, personaId: string) {
  if (!elevenLabsClient || isMuted) return;

  const config = personaVoices[personaId] || personaVoices.human;

  try {
    // Generate audio stream from ElevenLabs
    const audioStream = await elevenLabsClient.textToSpeech.convert(config.voiceId, {
      modelId: "eleven_monolingual_v1",
      text: text,
      voiceSettings: {
        stability: config.stability,
        similarityBoost: config.similarityBoost,
      },
    });

    // Convert stream to blob
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const blob = new Blob(chunks, { type: "audio/mpeg" });
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
    // Fall back to browser TTS on error
    speakBrowserTTS(text, personaId);
  }
}

function speakBrowserTTS(text: string, personaId: string) {
  if (isMuted || !("speechSynthesis" in window)) return;

  // Cancel any current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const config = browserVoices[personaId] || browserVoices.human;

  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 0.85;

  // Assign voice
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
  // Stop ElevenLabs audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Stop browser TTS
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

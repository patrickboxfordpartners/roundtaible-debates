// Text-to-speech using browser SpeechSynthesis API
// Each persona gets a distinct voice configuration

interface VoiceConfig {
  pitch: number;   // 0-2, default 1
  rate: number;    // 0.1-10, default 1
  voiceName?: string; // preferred voice name substring
}

const personaVoices: Record<string, VoiceConfig> = {
  edison:   { pitch: 1.0, rate: 1.0 },   // Normal, authoritative
  morgan:   { pitch: 0.7, rate: 0.9 },   // Deep, slow - commanding
  carnegie: { pitch: 1.1, rate: 1.05 },  // Slightly higher, steady
  twain:    { pitch: 1.2, rate: 1.15 },  // Lively, quick wit
  adams:    { pitch: 0.9, rate: 0.85 },  // Measured, thoughtful
  tesla:    { pitch: 1.3, rate: 1.1 },   // Higher, energetic
  human:    { pitch: 1.0, rate: 1.0 },   // Default
};

let isMuted = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}

export function speak(text: string, personaId: string) {
  if (isMuted || !isTTSSupported()) return;

  // Cancel any current speech to avoid overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const config = personaVoices[personaId] || personaVoices.human;

  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 0.8;

  // Try to pick a good voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Prefer English voices, try to vary by persona index
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      const personaIds = Object.keys(personaVoices);
      const idx = personaIds.indexOf(personaId);
      utterance.voice = englishVoices[idx % englishVoices.length];
    }
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
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

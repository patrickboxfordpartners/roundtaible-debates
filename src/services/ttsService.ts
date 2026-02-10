// Text-to-speech using browser SpeechSynthesis API
// Male voices only — all personas are historical men

interface VoiceConfig {
  pitch: number;   // 0-2, default 1
  rate: number;    // 0.1-10, default 1
}

const personaVoices: Record<string, VoiceConfig> = {
  edison:   { pitch: 0.9, rate: 1.0 },   // Steady, authoritative
  morgan:   { pitch: 0.6, rate: 0.85 },  // Deep, slow — commanding
  carnegie: { pitch: 0.85, rate: 0.95 }, // Warm, measured
  twain:    { pitch: 1.0, rate: 1.1 },   // Lively, quick wit
  adams:    { pitch: 0.75, rate: 0.8 },  // Low, deliberate — scholarly
  tesla:    { pitch: 1.1, rate: 1.05 },  // Slightly higher, energetic
  human:    { pitch: 0.9, rate: 1.0 },   // Default
};

let isMuted = false;
let maleVoicesCache: SpeechSynthesisVoice[] | null = null;

function getMaleVoices(): SpeechSynthesisVoice[] {
  if (maleVoicesCache && maleVoicesCache.length > 0) return maleVoicesCache;

  const allVoices = window.speechSynthesis.getVoices();
  const englishVoices = allVoices.filter(v => v.lang.startsWith("en"));

  // Filter for male voices by name heuristics
  const maleKeywords = ["male", "daniel", "james", "david", "thomas", "alex", "fred", "ralph", "albert", "guy", "lee", "aaron", "rishi", "oliver", "george", "jacques"];
  const femaleKeywords = ["female", "samantha", "karen", "victoria", "susan", "fiona", "kate", "moira", "tessa", "allison", "ava", "zoe", "nicky"];

  const male = englishVoices.filter(v => {
    const name = v.name.toLowerCase();
    const isFemale = femaleKeywords.some(k => name.includes(k));
    if (isFemale) return false;
    const isMale = maleKeywords.some(k => name.includes(k));
    return isMale;
  });

  // If we found male voices, use them. Otherwise fall back to all English voices
  // but use lower pitch settings to sound male.
  maleVoicesCache = male.length > 0 ? male : englishVoices;
  return maleVoicesCache;
}

export function isTTSSupported(): boolean {
  return "speechSynthesis" in window;
}

export function speak(text: string, personaId: string) {
  if (isMuted || !isTTSSupported()) return;

  // Cancel any current speech to avoid overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const config = personaVoices[personaId] || personaVoices.human;

  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 0.85;

  // Assign a male voice, varying by persona
  const voices = getMaleVoices();
  if (voices.length > 0) {
    const personaIds = Object.keys(personaVoices);
    const idx = personaIds.indexOf(personaId);
    utterance.voice = voices[Math.abs(idx) % voices.length];
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
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

// Pre-load voices (some browsers load them async)
if (isTTSSupported()) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    maleVoicesCache = null; // Reset cache when voices load
    getMaleVoices();
  };
}

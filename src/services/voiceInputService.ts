// Voice input using ElevenLabs Speech-to-Text API
// Falls back to browser Web Speech API if ElevenLabs API key is missing

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export interface VoiceCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isActive = false;
let elevenLabsClient: ElevenLabsClient | null = null;
let useElevenLabs = false;
let browserRecognition: SpeechRecognition | null = null;

// Initialize ElevenLabs client
const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
if (apiKey) {
  elevenLabsClient = new ElevenLabsClient({ apiKey });
  useElevenLabs = true;
  console.log("✓ ElevenLabs Speech-to-Text enabled");
} else {
  console.warn("⚠ ElevenLabs API key not found, falling back to browser speech recognition");
}

export function isVoiceSupported(): boolean {
  if (useElevenLabs) {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

async function startElevenLabsInput(callbacks: VoiceCallbacks) {
  if (!elevenLabsClient) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      isActive = true;
      callbacks.onSpeechStart?.();
    };

    mediaRecorder.onstop = async () => {
      isActive = false;
      callbacks.onSpeechEnd?.();

      if (audioChunks.length === 0) return;

      try {
        // Combine chunks into a single blob
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Convert to File object for ElevenLabs API
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });

        // Call ElevenLabs speech-to-text
        const result = await elevenLabsClient.speechToText.convert({
          file: audioFile,
          modelId: "scribe_v2",
        });

        if (result.text) {
          callbacks.onTranscript?.(result.text, true);
        }
      } catch (error) {
        console.error("ElevenLabs transcription error:", error);
        callbacks.onError?.("Failed to transcribe audio");
      } finally {
        audioChunks = [];
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    mediaRecorder.onerror = (event) => {
      callbacks.onError?.(`Recording error: ${event}`);
    };

    // Start recording in chunks (1 second slices for progressive transcription)
    mediaRecorder.start(1000);
  } catch (error) {
    console.error("Microphone access error:", error);
    callbacks.onError?.("Microphone access denied");
  }
}

function startBrowserInput(callbacks: VoiceCallbacks) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.("Speech recognition not supported in this browser");
    return;
  }

  browserRecognition = new SpeechRecognition();
  browserRecognition.continuous = true;
  browserRecognition.interimResults = true;
  browserRecognition.lang = "en-US";

  browserRecognition.onstart = () => {
    isActive = true;
    callbacks.onSpeechStart?.();
  };

  browserRecognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      callbacks.onTranscript?.(transcript, isFinal);
    }
  };

  browserRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "not-allowed") {
      callbacks.onError?.("Microphone access denied");
    } else if (event.error !== "aborted") {
      callbacks.onError?.(event.error);
    }
  };

  browserRecognition.onend = () => {
    const wasActive = isActive;
    isActive = false;
    callbacks.onSpeechEnd?.();
    // Auto-restart if still supposed to be listening
    if (browserRecognition && wasActive) {
      try {
        browserRecognition.start();
      } catch (e) {
        callbacks.onError?.("Voice input ended unexpectedly");
      }
    }
  };

  try {
    browserRecognition.start();
  } catch (e) {
    callbacks.onError?.("Failed to start voice input");
  }
}

export async function startVoiceInput(callbacks: VoiceCallbacks) {
  if (useElevenLabs) {
    await startElevenLabsInput(callbacks);
  } else {
    startBrowserInput(callbacks);
  }
}

export function stopVoiceInput() {
  isActive = false;

  // Stop ElevenLabs recording
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    mediaRecorder = null;
  }

  // Stop browser recognition
  if (browserRecognition) {
    try {
      browserRecognition.stop();
    } catch {
      // Already stopped
    }
    browserRecognition = null;
  }
}

export function isVoiceActive(): boolean {
  return isActive;
}

// Extend Window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

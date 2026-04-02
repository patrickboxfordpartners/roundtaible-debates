// Voice input using Web Speech API (works reliably in all modern browsers)

export interface VoiceCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

let recognition: SpeechRecognition | null = null;
let isActive = false;

export function isVoiceSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startVoiceInput(callbacks: VoiceCallbacks) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.("Speech recognition not supported in this browser");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isActive = true;
    callbacks.onSpeechStart?.();
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      callbacks.onTranscript?.(transcript, isFinal);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "not-allowed") {
      callbacks.onError?.("Microphone access denied");
    } else if (event.error !== "aborted") {
      callbacks.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    const wasActive = isActive;
    isActive = false;
    callbacks.onSpeechEnd?.();
    // Auto-restart if still supposed to be listening
    if (recognition && wasActive) {
      try {
        recognition.start();
      } catch (e) {
        // Recognition already started or browser denied — stop gracefully
        callbacks.onError?.("Voice input ended unexpectedly");
      }
    }
  };

  try {
    recognition.start();
  } catch (e) {
    callbacks.onError?.("Failed to start voice input");
  }
}

export function stopVoiceInput() {
  isActive = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // Already stopped — safe to ignore
    }
    recognition = null;
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

// Voice input using browser Web Speech API

export interface VoiceCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

let isActive = false;
let browserRecognition: SpeechRecognition | null = null;

export function isVoiceSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export async function startVoiceInput(callbacks: VoiceCallbacks) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

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
    if (browserRecognition && wasActive) {
      try {
        browserRecognition.start();
      } catch {
        callbacks.onError?.("Voice input ended unexpectedly");
      }
    }
  };

  try {
    browserRecognition.start();
  } catch {
    callbacks.onError?.("Failed to start voice input");
  }
}

export function stopVoiceInput() {
  isActive = false;
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

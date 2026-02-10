import Vapi from "@vapi-ai/web";

let vapiInstance: Vapi | null = null;

export function getVapiInstance(): Vapi {
  if (!vapiInstance) {
    vapiInstance = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);
  }
  return vapiInstance;
}

export interface VapiCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
}

export async function startVapiCall(callbacks: VapiCallbacks) {
  const vapi = getVapiInstance();

  // Set up event listeners
  if (callbacks.onSpeechStart) {
    vapi.on("speech-start", callbacks.onSpeechStart);
  }

  if (callbacks.onSpeechEnd) {
    vapi.on("speech-end", callbacks.onSpeechEnd);
  }

  if (callbacks.onTranscript) {
    vapi.on("message", (message: any) => {
      if (message.type === "transcript") {
        callbacks.onTranscript?.(message.transcript, message.isFinal);
      }
    });
  }

  if (callbacks.onError) {
    vapi.on("error", callbacks.onError);
  }

  try {
    // Start the call with a simple assistant configuration
    await vapi.start({
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a debate participant. Listen and transcribe what the user says.",
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "paula", // Neutral voice
      },
    });
  } catch (error) {
    console.error("Failed to start Vapi call:", error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  }
}

export function stopVapiCall() {
  const vapi = getVapiInstance();
  vapi.stop();
}

export function isVapiActive(): boolean {
  const vapi = getVapiInstance();
  // @ts-ignore - accessing internal state
  return vapi._active || false;
}

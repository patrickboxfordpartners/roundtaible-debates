import { Persona, TranscriptEntry, DebateTopic } from "@/data/debateData";
import { supabase } from "./supabaseClient";
import type { EducationalConfig } from "@/contexts/DebateModeContext";

// Circuit breaker: stop calling API after fatal errors (quota, auth)
// Auto-resets after CIRCUIT_COOLDOWN_MS so the app isn't permanently broken
let circuitOpen = false;
let circuitReason = "";
let circuitOpenedAt = 0;
const CIRCUIT_COOLDOWN_MS = 60_000; // Auto-retry after 60 seconds

export function isAPIAvailable(): boolean {
  if (circuitOpen && Date.now() - circuitOpenedAt > CIRCUIT_COOLDOWN_MS) {
    circuitOpen = false;
    circuitReason = "";
  }
  return !circuitOpen;
}

export function getAPIError(): string {
  return circuitReason;
}

export function resetCircuit() {
  circuitOpen = false;
  circuitReason = "";
  circuitOpenedAt = 0;
}

// Debate mode: "standard" (entertainment/demo) or "educational" (fact-checking, citations)
export type DebateMode = "standard" | "educational";
let currentMode: DebateMode = "standard";

export function setDebateMode(mode: DebateMode) {
  currentMode = mode;
}

export function getDebateMode(): DebateMode {
  return currentMode;
}

// Fallback responses when API is unavailable — rotated to avoid repetition
const fallbacks: Record<string, string[]> = {
  edison: [
    "I seem to have lost my train of thought — perhaps the telegraph lines are down. Give me a moment to gather my notes.",
    "The filament in my thinking lamp appears to have burned out. A temporary setback, I assure you.",
    "Even at Menlo Park, we had power outages. Let me recalibrate my argument.",
  ],
  morgan: [
    "The market waits for no one, and neither do I. Let me collect my thoughts while the ticker catches up.",
    "There appears to be a disruption in the financial cables. My position remains unchanged, however.",
    "Even the House of Morgan requires a brief recess. The fundamentals of my argument are sound.",
  ],
  carnegie: [
    "Even the greatest steel mills need maintenance. Allow me a moment to reformulate my position.",
    "A brief pause in production, nothing more. The furnace of my conviction still burns hot.",
    "From the Monongahela to this table, I have weathered interruptions before. One moment.",
  ],
  twain: [
    "I appear to have swallowed my own wit. A rare condition, I assure you — it shall pass momentarily.",
    "Reports of my silence have been greatly exaggerated. I shall return with something worth saying.",
    "The typewriter of my mind has jammed. Probably for the best — I was about to be devastatingly clever.",
  ],
  adams: [
    "History teaches us patience. Let me pause and reconsider my argument from a different angle.",
    "The dynamo of modern discourse occasionally requires a moment of stillness. I shall reflect.",
    "Even entropy allows for brief pauses. Let me gather the threads of this historical parallel.",
  ],
  tesla: [
    "My thoughts are vibrating at a frequency beyond current transmission capacity. One moment, please.",
    "The alternating current of my reasoning requires a brief phase shift. I shall return.",
    "A momentary interference in my wireless transmission of ideas. The signal will resume shortly.",
  ],
};

function getRandomFallback(personaId: string): string {
  const options = fallbacks[personaId];
  if (!options) return "";
  return options[Math.floor(Math.random() * options.length)];
}

export async function generatePersonaResponse(
  persona: Persona,
  topic: DebateTopic,
  recentTranscript: TranscriptEntry[],
  allPersonas: Persona[],
  educationalConfig?: EducationalConfig
): Promise<string> {
  if (circuitOpen) {
    throw new Error(`API unavailable: ${circuitReason}`);
  }

  if (!supabase) {
    return getRandomFallback(persona.id) || `${persona.name} pauses thoughtfully, collecting their thoughts...`;
  }

  try {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        action: "persona_response",
        persona: {
          id: persona.id,
          name: persona.name,
          role: persona.role,
          context: persona.context,
        },
        topic: {
          id: topic.id,
          title: topic.title,
          category: topic.category,
        },
        recentTranscript: recentTranscript.map((e) => ({
          personaId: e.personaId,
          text: e.text,
        })),
        allPersonas: allPersonas.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          context: p.context,
        })),
        mode: currentMode,
        educationalConfig,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.status === 429 || data?.status === 401 || data?.status === 403) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
      circuitReason =
        data.status === 429
          ? "API quota exceeded — will retry in 60 seconds"
          : "API key is invalid or unauthorized";
      throw new Error(circuitReason);
    }

    return data?.text || "...";
  } catch (error: unknown) {

    // Check if it's a function invocation error with status info
    const errObj = error as { context?: { status?: number }; message?: string };
    if (errObj.context?.status === 429 || errObj.context?.status === 401) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
      circuitReason = "API unavailable — will retry in 60 seconds";
      throw error;
    }

    return (
      getRandomFallback(persona.id) ||
      `${persona.name} pauses thoughtfully, collecting their thoughts...`
    );
  }
}

export async function generateDebateSummary(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  allPersonas: Persona[]
): Promise<{ text: string; narratorId: string }> {
  if (circuitOpen) {
    return {
      text: "If I may summarize: the telegraph office has closed for the evening, and our thoughts must wait for morning delivery. But wasn't the arguing itself the point?",
      narratorId: "twain",
    };
  }

  if (!supabase) {
    return {
      text: "If I may summarize: we've argued in circles — much like this table — and arrived precisely where we started, only more exhausted. But wasn't that the point?",
      narratorId: "twain",
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke("ai-proxy", {
      body: {
        action: "debate_summary",
        topic: {
          id: topic.id,
          title: topic.title,
          category: topic.category,
        },
        fullTranscript: transcript.map((e) => ({
          personaId: e.personaId,
          text: e.text,
        })),
        allPersonas: allPersonas.map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          context: p.context,
        })),
        mode: currentMode,
      },
    });

    if (error) throw error;

    return {
      text: data?.text || "A spirited debate, indeed.",
      narratorId: data?.narratorId || "twain",
    };
  } catch (error: unknown) {
    const errObj = error as { context?: { status?: number } };
    if (errObj.context?.status === 429 || errObj.context?.status === 401) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
      circuitReason = "API quota exceeded — will retry in 60 seconds";
    }
    return {
      text: "If I may summarize: we've argued in circles — much like this table — and arrived precisely where we started, only more exhausted. But wasn't that the point?",
      narratorId: "twain",
    };
  }
}

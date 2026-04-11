import { Persona, TranscriptEntry, DebateTopic } from "@/data/debateData";
import { supabase } from "./supabaseClient";
import type { EducationalConfig } from "@/contexts/DebateModeContext";

// Circuit breaker: stop calling API after fatal errors (quota, auth)
let circuitOpen = false;
let circuitReason = "";

export function isAPIAvailable(): boolean {
  return !circuitOpen;
}

export function getAPIError(): string {
  return circuitReason;
}

export function resetCircuit() {
  circuitOpen = false;
  circuitReason = "";
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

// Fallback responses when API is unavailable
const fallbacks: Record<string, string> = {
  edison:
    "I seem to have lost my train of thought — perhaps the telegraph lines are down. Give me a moment to gather my notes.",
  morgan:
    "The market waits for no one, and neither do I. Let me collect my thoughts while the ticker catches up.",
  carnegie:
    "Even the greatest steel mills need maintenance. Allow me a moment to reformulate my position.",
  twain:
    "I appear to have swallowed my own wit. A rare condition, I assure you — it shall pass momentarily.",
  adams:
    "History teaches us patience. Let me pause and reconsider my argument from a different angle.",
  tesla:
    "My thoughts are vibrating at a frequency beyond current transmission capacity. One moment, please.",
};

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
    return fallbacks[persona.id] || `${persona.name} pauses thoughtfully, collecting their thoughts...`;
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
      circuitReason =
        data.status === 429
          ? "API quota exceeded — check your xAI billing or use a new API key"
          : "API key is invalid or unauthorized";
      throw new Error(circuitReason);
    }

    return data?.text || "...";
  } catch (error: unknown) {
    console.error("AI proxy error:", (error as Error).message || error);

    // Check if it's a function invocation error with status info
    const errObj = error as { context?: { status?: number }; message?: string };
    if (errObj.context?.status === 429 || errObj.context?.status === 401) {
      circuitOpen = true;
      circuitReason = "API unavailable";
      throw error;
    }

    return (
      fallbacks[persona.id] ||
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
    console.error("AI summary error:", (error as Error).message || error);
    const errObj = error as { context?: { status?: number } };
    if (errObj.context?.status === 429 || errObj.context?.status === 401) {
      circuitOpen = true;
      circuitReason = "API quota exceeded";
    }
    return {
      text: "If I may summarize: we've argued in circles — much like this table — and arrived precisely where we started, only more exhausted. But wasn't that the point?",
      narratorId: "twain",
    };
  }
}

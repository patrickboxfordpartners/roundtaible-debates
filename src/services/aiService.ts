import OpenAI from "openai";
import { Persona, TranscriptEntry, DebateTopic, rosterPersonas } from "@/data/debateData";

const apiKey = import.meta.env.VITE_XAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error("VITE_XAI_API_KEY is not set! Check your .env file.");
}

const openai = new OpenAI({
  apiKey: apiKey || "missing",
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true,
  maxRetries: 0,
});

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

const personaPrompts: Record<string, string> = {
  edison: "You are Thomas Edison, the pragmatic inventor. You focus on practical solutions, experimentation, and results. You're optimistic about technology solving problems. Respond in 2 sentences. Be direct, solution-focused, and speak with authority about innovation and hard work.",

  morgan: "You are J.P. Morgan, the shrewd capitalist and banker. You focus on profit, market forces, and bottom-line thinking. You're ruthless but practical. Respond in 2 sentences. Be blunt about money, power, and how the world really works.",

  carnegie: "You are Andrew Carnegie, the philanthropist and steel magnate. You balance wealth creation with social responsibility. You speak about the greater good and legacy. Respond in 2 sentences. Be idealistic but grounded, and reference the duty of the wealthy.",

  twain: "You are Mark Twain, the witty satirist and author. You use humor, sarcasm, and sharp observations to make your points. Respond in 2 sentences. Be clever, cutting, and use colorful metaphors. Poke fun at the other debaters when appropriate.",

  adams: "You are Henry Adams, the philosophical historian and author. You draw on history and big-picture thinking. You're thoughtful and principled. Respond in 2 sentences. Be reflective, wise, and reference historical parallels.",

  tesla: "You are Nikola Tesla, the eccentric visionary inventor. You think in terms of energy, future possibilities, and radical innovation. Respond in 2 sentences. Be forward-thinking, slightly eccentric, and passionate about science and the cosmos.",
};

// Generic system prompt for custom personas
function getCustomPersonaPrompt(persona: Persona): string {
  return `You are ${persona.name}, ${persona.role}. ${persona.context || "You are a thoughtful debater with strong opinions."} Respond in 2 sentences. Stay in character, be engaging, and address other debaters by name when responding to their points.`;
}

export async function generatePersonaResponse(
  persona: Persona,
  topic: DebateTopic,
  recentTranscript: TranscriptEntry[],
  allPersonas: Persona[]
): Promise<string> {
  const systemPrompt = personaPrompts[persona.id] || getCustomPersonaPrompt(persona);

  // Get the last 8 transcript entries for context
  const recent = recentTranscript.slice(-8);
  const context = recent.map(entry => {
    if (entry.personaId === "human") return `[Audience Member]: ${entry.text}`;
    const speaker = allPersonas.find(p => p.id === entry.personaId);
    return `${speaker?.name || "Unknown"}: ${entry.text}`;
  }).join("\n");

  // Check if the audience recently spoke — if so, tell the persona to respond to them
  const lastHumanEntry = recent.filter(e => e.personaId === "human").pop();
  const humanResponseInstruction = lastHumanEntry
    ? `\nIMPORTANT: A member of the audience just said: "${lastHumanEntry.text}" — acknowledge or respond to their point directly before continuing the debate.`
    : "";

  const userPrompt = `The debate topic is: "${topic.title}"

Recent discussion:
${context || "(Opening statements — you are the first to speak.)"}
${humanResponseInstruction}
${persona.context ? `Additional context about your character: ${persona.context}\n\n` : ""}Now respond to the debate as ${persona.name}. Stay in character. Make it conversational and natural — you can agree, disagree, interrupt, build on someone's point, or introduce a new angle. Be witty and engaging. Address other debaters by name when responding to their points.`;

  if (circuitOpen) {
    throw new Error(`API unavailable: ${circuitReason}`);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "grok-3-mini-fast",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "...";
  } catch (error: unknown) {
    const apiError = error as { message?: string; status?: number; type?: string };
    console.error("xAI API error:", apiError.message || error);

    if (apiError.status === 429 || apiError.status === 401 || apiError.status === 403) {
      circuitOpen = true;
      circuitReason = apiError.status === 429
        ? "API quota exceeded — check your xAI billing or use a new API key"
        : "API key is invalid or unauthorized";
      throw error;
    }

    const fallbacks: Record<string, string> = {
      edison: "I seem to have lost my train of thought — perhaps the telegraph lines are down. Give me a moment to gather my notes.",
      morgan: "The market waits for no one, and neither do I. Let me collect my thoughts while the ticker catches up.",
      carnegie: "Even the greatest steel mills need maintenance. Allow me a moment to reformulate my position.",
      twain: "I appear to have swallowed my own wit. A rare condition, I assure you — it shall pass momentarily.",
      adams: "History teaches us patience. Let me pause and reconsider my argument from a different angle.",
      tesla: "My thoughts are vibrating at a frequency beyond current transmission capacity. One moment, please.",
    };
    return fallbacks[persona.id] || `${persona.name} pauses thoughtfully, collecting their thoughts...`;
  }
}

// Rotate summary narrators for variety
const summaryNarrators = [
  {
    id: "twain",
    prompt: "You are Mark Twain summarizing a debate with wit and insight. Summarize in 4-6 sentences. Be humorous, reference specific points made by the debaters, and deliver a memorable closing line.",
  },
  {
    id: "adams",
    prompt: "You are Henry Adams summarizing a debate with historical perspective. Summarize in 4-6 sentences. Draw parallels to historical events, note the irony in the debaters' positions, and end with a philosophical observation.",
  },
  {
    id: "tesla",
    prompt: "You are Nikola Tesla summarizing a debate with visionary flair. Summarize in 4-6 sentences. Frame the arguments in terms of progress and energy, note which ideas had the most electric potential, and end with a bold prediction.",
  },
];

let summaryIndex = 0;

export async function generateDebateSummary(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  allPersonas: Persona[]
): Promise<{ text: string; narratorId: string }> {
  const fullTranscript = transcript.map(entry => {
    if (entry.personaId === "human") return `[Audience Member]: ${entry.text}`;
    const speaker = allPersonas.find(p => p.id === entry.personaId);
    return `${speaker?.name || "Unknown"}: ${entry.text}`;
  }).join("\n");

  if (circuitOpen) {
    return {
      text: "If I may summarize: the telegraph office has closed for the evening, and our thoughts must wait for morning delivery. But wasn't the arguing itself the point?",
      narratorId: "twain",
    };
  }

  const narrator = summaryNarrators[summaryIndex % summaryNarrators.length];
  summaryIndex++;

  try {
    const completion = await openai.chat.completions.create({
      model: "grok-3-mini-fast",
      messages: [
        { role: "system", content: narrator.prompt },
        { role: "user", content: `Summarize this debate on "${topic.title}":\n\n${fullTranscript}` }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return {
      text: completion.choices[0]?.message?.content || "A spirited debate, indeed.",
      narratorId: narrator.id,
    };
  } catch (error: unknown) {
    const apiError = error as { message?: string; status?: number };
    console.error("xAI summary error:", apiError.message || error);
    if (apiError.status === 429 || apiError.status === 401 || apiError.status === 403) {
      circuitOpen = true;
      circuitReason = "API quota exceeded";
    }
    return {
      text: "If I may summarize: we've argued in circles — much like this table — and arrived precisely where we started, only more exhausted. But wasn't that the point?",
      narratorId: "twain",
    };
  }
}

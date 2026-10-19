/* eslint-disable @typescript-eslint/no-explicit-any -- request bodies are validated field by field */
// AI debate turns and summaries, via xAI (OpenAI-compatible API).
// Moved from the old Supabase "ai-proxy" edge function. Prompts are unchanged.

import { HttpError, errorResponse, json, rateLimit, readJson } from "./_lib/http.js";

// Persona system prompts
const personaPrompts: Record<string, string> = {
  edison:
    "You are Thomas Edison, the pragmatic inventor. You focus on practical solutions, experimentation, and results. You're optimistic about technology solving problems. Respond in 2 sentences. Be direct, solution-focused, and speak with authority about innovation and hard work.",
  morgan:
    "You are J.P. Morgan, the shrewd capitalist and banker. You focus on profit, market forces, and bottom-line thinking. You're ruthless but practical. Respond in 2 sentences. Be blunt about money, power, and how the world really works.",
  carnegie:
    "You are Andrew Carnegie, the philanthropist and steel magnate. You balance wealth creation with social responsibility. You speak about the greater good and legacy. Respond in 2 sentences. Be idealistic but grounded, and reference the duty of the wealthy.",
  twain:
    "You are Mark Twain, the witty satirist and author. You use humor, sarcasm, and sharp observations to make your points. Respond in 2 sentences. Be clever, cutting, and use colorful metaphors. Poke fun at the other debaters when appropriate.",
  adams:
    "You are Henry Adams, the philosophical historian and author. You draw on history and big-picture thinking. You're thoughtful and principled. Respond in 2 sentences. Be reflective, wise, and reference historical parallels.",
  tesla:
    "You are Nikola Tesla, the eccentric visionary inventor. You think in terms of energy, future possibilities, and radical innovation. Respond in 2 sentences. Be forward-thinking, slightly eccentric, and passionate about science and the cosmos.",
};

// Summary narrators
const summaryNarrators = [
  {
    id: "twain",
    prompt:
      "You are Mark Twain summarizing a debate with wit and insight. Summarize in 4-6 sentences. Be humorous, reference specific points made by the debaters, and deliver a memorable closing line.",
  },
  {
    id: "adams",
    prompt:
      "You are Henry Adams summarizing a debate with historical perspective. Summarize in 4-6 sentences. Draw parallels to historical events, note the irony in the debaters' positions, and end with a philosophical observation.",
  },
  {
    id: "tesla",
    prompt:
      "You are Nikola Tesla summarizing a debate with visionary flair. Summarize in 4-6 sentences. Frame the arguments in terms of progress and energy, note which ideas had the most electric potential, and end with a bold prediction.",
  },
];

let summaryIndex = 0;

interface Persona {
  id: string;
  name: string;
  role: string;
  context?: string;
}

interface TranscriptEntry {
  personaId: string;
  text: string;
}

interface DebateTopic {
  id: string;
  title: string;
  category?: string;
}

/** Choose the built-in persona prompt or construct one from the supplied character details. */
function getSystemPrompt(persona: Persona): string {
  return (
    personaPrompts[persona.id] ||
    `You are ${persona.name}, ${persona.role}. ${persona.context || "You are a thoughtful debater with strong opinions."} Respond in 2 sentences. Stay in character, be engaging, and address other debaters by name when responding to their points.`
  );
}

interface EducationalConfig {
  enabled: boolean;
  gradeLevel?: string;
  socraticLevel?: string;
  vocabularyHighlights?: boolean;
}

/** Build classroom response instructions, or return an empty suffix when educational mode is disabled. */
function buildEducationalSuffix(config?: EducationalConfig): string {
  if (!config?.enabled) return "";

  const parts: string[] = [];

  parts.push(
    "EDUCATIONAL MODE: You are in a classroom setting. After your in-character debate response, include the following educational elements:"
  );

  // Vocabulary highlights
  if (config.vocabularyHighlights !== false) {
    parts.push(
      "- [Vocabulary: term — definition] for any specialized terms you use"
    );
  }

  // Fact citation
  parts.push(
    "- [Fact: ...] citing a specific real historical event, study, or principle that supports your argument, with a date or source"
  );

  // Socratic questioning
  const socratic = config.socraticLevel || "medium";
  if (socratic === "high") {
    parts.push(
      "- [Question: ...] end with a deep Socratic question that probes assumptions, explores logical contradictions, examines edge cases, or challenges the fundamental premises of both arguments. Push thinking to its limits."
    );
  } else if (socratic === "medium") {
    parts.push(
      "- [Question: ...] end with a thought-provoking question that challenges assumptions and asks the audience to examine the reasoning behind the arguments. Use the Socratic method to explore contradictions."
    );
  } else if (socratic === "low") {
    parts.push(
      "- [Question: ...] end with a simple clarifying question that helps the audience understand the reasoning behind your argument."
    );
  }

  // Grade-level language
  if (config.gradeLevel) {
    const levelMap: Record<string, string> = {
      "6-8": "Use vocabulary and concepts appropriate for middle school students (ages 11-14). Explain complex ideas simply.",
      "9-10": "Use vocabulary appropriate for early high school students. You can introduce more complex concepts but explain them clearly.",
      "11-12": "Use vocabulary appropriate for upper high school students. You can discuss nuanced concepts and expect some prior knowledge.",
      "college": "Use college-level vocabulary and references. You can assume familiarity with major historical and scientific concepts.",
    };
    const instruction = levelMap[config.gradeLevel];
    if (instruction) {
      parts.push(`- Language level: ${instruction}`);
    }
  }

  return "\n\n" + parts.join("\n");
}

/** Build the debate prompt from the latest eight entries, audience input, and optional classroom instructions. */
function buildUserPrompt(
  persona: Persona,
  topic: DebateTopic,
  recentTranscript: TranscriptEntry[],
  allPersonas: Persona[],
  mode: string,
  educationalConfig?: EducationalConfig
): string {
  const recent = recentTranscript.slice(-8);
  const context = recent
    .map((entry) => {
      if (entry.personaId === "human") return `[Audience Member]: ${entry.text}`;
      const speaker = allPersonas.find((p) => p.id === entry.personaId);
      return `${speaker?.name || "Unknown"}: ${entry.text}`;
    })
    .join("\n");

  const lastHumanEntry = recent.filter((e) => e.personaId === "human").pop();
  const humanResponseInstruction = lastHumanEntry
    ? `\nIMPORTANT: A member of the audience just said: "${lastHumanEntry.text}" — acknowledge or respond to their point directly before continuing the debate.`
    : "";

  const educationalSuffix =
    mode === "educational"
      ? buildEducationalSuffix(educationalConfig || { enabled: true })
      : "";

  return `The debate topic is: "${topic.title}"

Recent discussion:
${context || "(Opening statements — you are the first to speak.)"}
${humanResponseInstruction}
${persona.context ? `Additional context about your character: ${persona.context}\n\n` : ""}Now respond to the debate as ${persona.name}. Stay in character. Make it conversational and natural — you can agree, disagree, interrupt, build on someone's point, or introduce a new angle. Be witty and engaging. Address other debaters by name when responding to their points.${educationalSuffix}`;
}

/** Request an xAI completion, preserving auth and quota error statuses for the client circuit breaker. */
async function chat(system: string, user: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.AI_PROXY_KEY || process.env.XAI_API_KEY;
  if (!apiKey) throw new HttpError(503, "XAI_API_KEY is not configured");
  const baseUrl = (process.env.AI_PROXY_URL || "https://api.x.ai/v1").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      // grok-3-mini (the old model) has been retired by xAI.
      model: process.env.XAI_MODEL || "grok-4.3",
      reasoning_effort: process.env.XAI_REASONING_EFFORT || "none",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("xAI error", res.status, detail.slice(0, 500));
    // Pass 401/403/429 through so the app's circuit breaker can back off.
    const status = [401, 403, 429].includes(res.status) ? res.status : 502;
    throw new HttpError(status, "AI request failed");
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || "";
}

/** Generate a persona response or rotating narrator summary, returning validation and upstream errors as JSON. */
export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "ai", 60);
    const body = await readJson<Record<string, any>>(req);
    const { action, persona, topic, recentTranscript, allPersonas, mode, fullTranscript, educationalConfig } = body;
    if (!topic?.title) throw new HttpError(400, "topic is required");

    if (action === "persona_response") {
      if (!persona?.name) throw new HttpError(400, "persona is required");
      const text = await chat(
        getSystemPrompt(persona),
        buildUserPrompt(persona, topic, recentTranscript || [], allPersonas || [], mode || "standard", educationalConfig),
        mode === "educational" ? 250 : 150,
        0.9
      );
      return json({ text: text || "..." });
    }

    if (action === "debate_summary") {
      const transcriptText = ((fullTranscript || []) as TranscriptEntry[])
        .slice(-200)
        .map((entry) => {
          if (entry.personaId === "human") return `[Audience Member]: ${entry.text}`;
          const speaker = ((allPersonas || []) as Persona[]).find((p) => p.id === entry.personaId);
          return `${speaker?.name || "Unknown"}: ${entry.text}`;
        })
        .join("\n");

      const narrator = summaryNarrators[summaryIndex % summaryNarrators.length];
      summaryIndex++;
      const educationalSuffix =
        mode === "educational"
          ? "\n\nInclude 2-3 key takeaways that the audience can learn from this debate, noting which arguments were well-supported by evidence."
          : "";
      const text = await chat(
        narrator.prompt,
        `Summarize this debate on "${topic.title}":\n\n${transcriptText}${educationalSuffix}`,
        300,
        0.8
      );
      return json({ text: text || "A spirited debate, indeed.", narratorId: narrator.id });
    }

    throw new HttpError(400, `Unknown action: ${action}`);
  } catch (err) {
    return errorResponse(err);
  }
}

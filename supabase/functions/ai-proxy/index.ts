import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://esm.sh/openai@4.67.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting (in-memory, per-instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

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
      "- [Question: ...] end with a thought-provoking Socratic question that challenges the audience to think critically about both sides of the argument"
    );
  } else if (socratic === "medium") {
    parts.push(
      "- [Question: ...] end with a brief discussion question for the audience"
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("XAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "XAI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
    });

    const body = await req.json();
    const { action, persona, topic, recentTranscript, allPersonas, mode, fullTranscript, educationalConfig } = body;

    if (action === "persona_response") {
      const systemPrompt = getSystemPrompt(persona);
      const userPrompt = buildUserPrompt(
        persona,
        topic,
        recentTranscript || [],
        allPersonas || [],
        mode || "standard",
        educationalConfig
      );

      // Educational mode gets more tokens for the extra markers
      const maxTokens = mode === "educational" ? 250 : 150;

      const completion = await openai.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: maxTokens,
      });

      return new Response(
        JSON.stringify({
          text: completion.choices[0]?.message?.content || "...",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "debate_summary") {
      const transcriptText = (fullTranscript || [])
        .map((entry: TranscriptEntry) => {
          if (entry.personaId === "human")
            return `[Audience Member]: ${entry.text}`;
          const speaker = (allPersonas || []).find(
            (p: Persona) => p.id === entry.personaId
          );
          return `${speaker?.name || "Unknown"}: ${entry.text}`;
        })
        .join("\n");

      const narrator = summaryNarrators[summaryIndex % summaryNarrators.length];
      summaryIndex++;

      const educationalSuffix =
        mode === "educational"
          ? "\n\nInclude 2-3 key takeaways that the audience can learn from this debate, noting which arguments were well-supported by evidence."
          : "";

      const completion = await openai.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: narrator.prompt },
          {
            role: "user",
            content: `Summarize this debate on "${topic.title}":\n\n${transcriptText}${educationalSuffix}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      return new Response(
        JSON.stringify({
          text:
            completion.choices[0]?.message?.content ||
            "A spirited debate, indeed.",
          narratorId: narrator.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ai-proxy error:", error);
    const status = (error as { status?: number }).status || 500;
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Internal server error",
        status,
      }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

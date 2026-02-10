import OpenAI from "openai";
import { Persona, TranscriptEntry, DebateTopic } from "@/data/debateData";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For hackathon only - move to backend in production
});

const personaPrompts: Record<string, string> = {
  edison: "You are Thomas Edison, the pragmatic inventor. You focus on practical solutions, experimentation, and results. You're optimistic about technology solving problems. Keep responses under 2 sentences. Be direct and solution-focused.",

  morgan: "You are J.P. Morgan, the shrewd capitalist. You focus on profit, market forces, and bottom-line thinking. You're ruthless but practical. Keep responses under 2 sentences. Be blunt about money and power.",

  carnegie: "You are Andrew Carnegie, the philanthropist. You balance wealth creation with social responsibility. You speak about the greater good and legacy. Keep responses under 2 sentences. Be idealistic but grounded.",

  twain: "You are Mark Twain, the witty satirist. You use humor, sarcasm, and sharp observations to make your points. Keep responses under 2 sentences. Be clever and cutting.",

  adams: "You are Henry Adams, the philosophical historian. You draw on history and big-picture thinking. You're thoughtful and principled. Keep responses under 2 sentences. Be reflective and wise.",

  tesla: "You are Nikola Tesla, the eccentric visionary. You think in terms of energy, future possibilities, and radical innovation. Keep responses under 2 sentences. Be forward-thinking and slightly eccentric.",
};

export async function generatePersonaResponse(
  persona: Persona,
  topic: DebateTopic,
  recentTranscript: TranscriptEntry[],
  allPersonas: Persona[]
): Promise<string> {
  const systemPrompt = personaPrompts[persona.id] || personaPrompts.edison;

  // Get the last 5 transcript entries for context
  const context = recentTranscript.slice(-5).map(entry => {
    const speaker = allPersonas.find(p => p.id === entry.personaId);
    return `${speaker?.name || "Unknown"}: ${entry.text}`;
  }).join("\n");

  const userPrompt = `The debate topic is: "${topic.title}"

Recent discussion:
${context}

${persona.context ? `Additional context about you: ${persona.context}\n\n` : ""}Now respond to the debate as ${persona.name}. Stay in character. Make it conversational and natural - you can agree, disagree, interrupt, build on someone's point, or introduce a new angle. Be witty and engaging.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content || "...";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "[Connection issue - will retry]";
  }
}

export async function generateDebateSummary(
  topic: DebateTopic,
  transcript: TranscriptEntry[],
  allPersonas: Persona[]
): Promise<string> {
  const fullTranscript = transcript.map(entry => {
    const speaker = allPersonas.find(p => p.id === entry.personaId);
    return `${speaker?.name || "Unknown"}: ${entry.text}`;
  }).join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Mark Twain summarizing a debate with wit and insight. Keep it to 3-4 sentences."
        },
        {
          role: "user",
          content: `Summarize this debate on "${topic.title}":\n\n${fullTranscript}`
        }
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || "A spirited debate, indeed.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "If I may summarize: we've argued in circles—much like this table—and arrived precisely where we started, only more exhausted.";
  }
}

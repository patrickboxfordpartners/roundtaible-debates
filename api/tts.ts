// Text-to-speech via ElevenLabs. Moved from the old Supabase "tts-proxy" edge function.

import { HttpError, errorResponse, rateLimit, readJson } from "./_lib/http.js";
import { db } from "./_lib/db.js";

// ElevenLabs voice configurations per persona
interface VoiceConfig {
  voiceId: string;
  stability: number;
  similarityBoost: number;
}

const personaVoices: Record<string, VoiceConfig> = {
  edison: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    stability: 0.75,
    similarityBoost: 0.75,
  },
  morgan: {
    voiceId: "TxGEqnHWrfWFTfGW9XjX",
    stability: 0.85,
    similarityBoost: 0.8,
  },
  carnegie: {
    voiceId: "ErXwobaYiN019PkySvjV",
    stability: 0.7,
    similarityBoost: 0.75,
  },
  twain: {
    voiceId: "onwK4e9ZLuTAKqWW03F9",
    stability: 0.6,
    similarityBoost: 0.7,
  },
  adams: {
    voiceId: "VR6AewLTigWG4xSOukaG",
    stability: 0.8,
    similarityBoost: 0.8,
  },
  tesla: {
    voiceId: "IKne3meq5aSn9XLyUdCD",
    stability: 0.65,
    similarityBoost: 0.7,
  },
  wilde: {
    voiceId: "ErXwobaYiN019PkySvjV",
    stability: 0.65,
    similarityBoost: 0.75,
  },
  einstein: {
    voiceId: "VR6AewLTigWG4xSOukaG",
    stability: 0.75,
    similarityBoost: 0.8,
  },
  cleopatra: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    stability: 0.75,
    similarityBoost: 0.75,
  },
  darwin: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    stability: 0.8,
    similarityBoost: 0.8,
  },
  hypatia: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    stability: 0.8,
    similarityBoost: 0.75,
  },
  machiavelli: {
    voiceId: "onwK4e9ZLuTAKqWW03F9",
    stability: 0.75,
    similarityBoost: 0.75,
  },
  curie: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    stability: 0.8,
    similarityBoost: 0.8,
  },
  "sun-tzu": {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    stability: 0.85,
    similarityBoost: 0.8,
  },
  human: {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    stability: 0.75,
    similarityBoost: 0.75,
  },
};

/** Validate and truncate speech input, then stream ElevenLabs audio using the selected persona or default voice. */
export async function POST(req: Request): Promise<Response> {
  try {
    rateLimit(req, "tts", 60);
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new HttpError(503, "ELEVENLABS_API_KEY is not configured");
    const { text, personaId } = await readJson<{ text?: string; personaId?: string }>(req, 32 * 1024);
    if (!text || typeof text !== "string") throw new HttpError(400, "text is required");
    const config = personaVoices[personaId || ""] || personaVoices.human;

    // A shared budget across instances also caps guests who rotate forwarded IPs.
    const quota = await db()`
      INSERT INTO rt_api_quotas (name, window_start, requests)
      VALUES ('tts', date_trunc('minute', NOW()), 1)
      ON CONFLICT (name) DO UPDATE
        SET window_start = EXCLUDED.window_start,
            requests = CASE WHEN rt_api_quotas.window_start < EXCLUDED.window_start THEN 1 ELSE rt_api_quotas.requests + 1 END
        WHERE rt_api_quotas.window_start < EXCLUDED.window_start OR rt_api_quotas.requests < 60
      RETURNING requests`;
    if (!quota[0]) throw new HttpError(429, "TTS quota exceeded. Try again next minute.");

    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey, Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2", // eleven_monolingual_v1 was shut down Jul 2026
        voice_settings: { stability: config.stability, similarity_boost: config.similarityBoost },
      }),
    });
    if (!upstream.ok) {
      console.error("ElevenLabs error", upstream.status, (await upstream.text().catch(() => "")).slice(0, 300));
      throw new HttpError(502, "TTS generation failed");
    }
    return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

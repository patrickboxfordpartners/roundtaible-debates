import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { text, personaId } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = personaVoices[personaId] || personaVoices.human;

    // Call ElevenLabs REST API directly
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: config.stability,
            similarity_boost: config.similarityBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "TTS generation failed",
          status: response.status,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the audio response back to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("tts-proxy error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

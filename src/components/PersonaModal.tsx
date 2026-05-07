import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Persona } from "@/data/debateData";
import { X } from "lucide-react";
import { PhotoCredit } from "@/components/PhotoCredit";

interface PersonaModalProps {
  persona: Persona | null;
  open: boolean;
  onClose: () => void;
}

// Extract key accomplishments from context
function extractAccomplishments(context: string): string[] {
  // Find sentences that mention accomplishments, inventions, writings, achievements
  const sentences = context.split(". ");
  const accomplishments: string[] = [];

  for (const sentence of sentences) {
    if (
      sentence.match(/You (invented|wrote|published|developed|discovered|founded|created|built|organized|designed|pioneered)/i) ||
      sentence.match(/patents|Nobel Prize|published|served as|became|rose from/i)
    ) {
      accomplishments.push(sentence.trim() + (sentence.endsWith(".") ? "" : "."));
    }
  }

  return accomplishments.slice(0, 5); // Top 5 key achievements
}

// Extract mindset/philosophy from context
function extractMindset(context: string): string[] {
  const sentences = context.split(". ");
  const mindset: string[] = [];

  for (const sentence of sentences) {
    if (
      sentence.match(/You believe|You distrust|You think|You are|You speak|You see/i) ||
      sentence.match(/In debates|Your theory|Your philosophy|Your core principles/i)
    ) {
      mindset.push(sentence.trim() + (sentence.endsWith(".") ? "" : "."));
    }
  }

  return mindset.slice(0, 6); // Key philosophical points
}

export default function PersonaModal({ persona, open, onClose }: PersonaModalProps) {
  if (!persona) return null;

  const accomplishments = extractAccomplishments(persona.context);
  const mindset = extractMindset(persona.context);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 border-0 overflow-y-auto [&>button]:hidden">
        <div className="relative min-h-full">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          {/* Content */}
          <div className="relative z-[1] px-8 py-12 md:px-12">
            {/* Hero Section */}
            <div className="mb-8">
              <div
                className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm"
                style={{
                  backgroundColor: `${persona.color}20`,
                  color: persona.color,
                  borderColor: persona.color,
                  borderWidth: '1px'
                }}
              >
                {persona.role}
              </div>
              <h1 className="font-playfair text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                {persona.name}
              </h1>

              {/* Famous Quotes */}
              <div className="space-y-4 mb-8">
                {persona.quotes.map((quote, i) => (
                  <blockquote
                    key={i}
                    className="border-l-4 pl-5 py-2 italic font-lora text-lg md:text-xl text-white/90 leading-relaxed"
                    style={{ borderColor: persona.color }}
                  >
                    "{quote}"
                  </blockquote>
                ))}
              </div>

              {/* Photo Credit */}
              {persona.photoCredit && (
                <div className="rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 p-4">
                  <PhotoCredit credit={persona.photoCredit} personaName={persona.name} />
                </div>
              )}
            </div>

            {/* Content Cards */}
            <div className="space-y-6 max-w-3xl">
              {/* Key Accomplishments */}
              {accomplishments.length > 0 && (
                <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6">
                  <h3 className="font-playfair text-2xl font-bold mb-4 text-white">
                    Key Accomplishments
                  </h3>
                  <ul className="space-y-3 font-lora text-sm leading-relaxed text-white/80">
                    {accomplishments.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: persona.color }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mindset & Thought Process */}
              {mindset.length > 0 && (
                <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6">
                  <h3 className="font-playfair text-2xl font-bold mb-4 text-white">
                    Mindset & Thought Process
                  </h3>
                  <div className="space-y-3 font-lora text-sm leading-relaxed text-white/75">
                    {mindset.map((item, i) => (
                      <p key={i} className="pl-4 border-l-2 border-white/20">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Context - Collapsed by default */}
              <details className="group rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6">
                <summary className="font-playfair text-xl font-bold cursor-pointer text-white hover:text-white/80 transition-colors list-none flex items-center gap-3">
                  <span className="inline-block transition-transform group-open:rotate-90 text-lg" style={{ color: persona.color }}>
                    ▶
                  </span>
                  Complete Historical Profile
                </summary>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="font-lora text-sm leading-relaxed text-white/70">
                    {persona.context}
                  </p>
                </div>
              </details>
            </div>

            {/* Bottom padding for scroll */}
            <div className="h-12" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

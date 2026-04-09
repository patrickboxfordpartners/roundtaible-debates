import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Persona } from "@/data/debateData";
import { X } from "lucide-react";

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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Hero Section with Large Avatar */}
        <div className="flex flex-col items-center pt-6 pb-8 border-b border-border">
          <div
            className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 shadow-2xl"
            style={{ borderColor: persona.color }}
          >
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="font-playfair text-3xl font-bold mb-2">
              {persona.name}
            </DialogTitle>
            <p className="text-lg text-muted-foreground font-lora italic">
              {persona.role}
            </p>
          </DialogHeader>
        </div>

        <div className="py-6 space-y-8">
          {/* Famous Quotes */}
          <div>
            <h3 className="font-playfair text-xl font-semibold mb-4 text-foreground">
              Famous Quotes
            </h3>
            <div className="space-y-3">
              {persona.quotes.map((quote, i) => (
                <blockquote
                  key={i}
                  className="border-l-4 pl-4 py-2 italic font-lora text-muted-foreground"
                  style={{ borderColor: persona.color }}
                >
                  "{quote}"
                </blockquote>
              ))}
            </div>
          </div>

          {/* Key Accomplishments */}
          {accomplishments.length > 0 && (
            <div>
              <h3 className="font-playfair text-xl font-semibold mb-4 text-foreground">
                Key Accomplishments
              </h3>
              <ul className="space-y-3 font-lora text-sm leading-relaxed text-foreground/90">
                {accomplishments.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
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
            <div>
              <h3 className="font-playfair text-xl font-semibold mb-4 text-foreground">
                Mindset & Thought Process
              </h3>
              <div className="space-y-3 font-lora text-sm leading-relaxed text-muted-foreground">
                {mindset.map((item, i) => (
                  <p key={i} className="pl-4 border-l border-border">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Full Context - Collapsed by default */}
          <details className="group">
            <summary className="font-playfair text-lg font-semibold cursor-pointer text-foreground hover:text-primary transition-colors list-none flex items-center gap-2">
              <span className="inline-block transition-transform group-open:rotate-90">▶</span>
              Complete Historical Profile
            </summary>
            <div className="mt-4 pl-6 border-l-2 border-border">
              <p className="font-lora text-sm leading-relaxed text-muted-foreground">
                {persona.context}
              </p>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}

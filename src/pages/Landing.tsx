import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { allPersonas, Persona } from "@/data/debateData";
import { supabase } from "@/services/supabaseClient";
import Footer from "@/components/Footer";
import PersonaModal from "@/components/PersonaModal";

const USE_CASES = [
  {
    icon: "🏛️",
    title: "Decision Support",
    description:
      "Before your next big meeting, watch history's sharpest strategists debate your actual question. Walk in with every angle already considered.",
  },
  {
    icon: "⚡",
    title: "Sales & Demos",
    description:
      "Drop it on a tablet at your next event. People walk up, pick a topic, and suddenly you have the most interesting conversation in the room.",
  },
  {
    icon: "🎓",
    title: "Education",
    description:
      "Primary sources debating modern topics. Pause for class discussion. Resume. A history class that actually holds attention.",
  },
];

const STEPS = [
  { n: "1", heading: "Pick a topic", body: "From AI rights to whether empires create progress — or bring your own question." },
  { n: "2", heading: "Watch the debate", body: "Historical personas argue in their authentic voices, citing real philosophy, real experience." },
  { n: "3", heading: "Jump in", body: "Pitch your own idea, vote for the best argument, or take the personality quiz to find your historical match." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const waitlistRef = useRef<HTMLDivElement>(null);

  const scrollToWaitlist = () => {
    waitlistRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handlePersonaClick = (persona: Persona) => {
    setSelectedPersona(persona);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedPersona(null), 200); // Delay cleanup for animation
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Database not configured");

      const { error: dbError } = await supabase
        .from("rt_waitlist")
        .insert({ email: email.trim().toLowerCase(), name: name.trim() || null });

      if (dbError) {
        if (dbError.code === "23505") {
          // Duplicate — treat as success
          setSubmitted(true);
          return;
        }
        throw new Error(dbError.message);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-playfair text-lg font-bold tracking-tight">Roundtaible</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/quiz")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Take the Quiz
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/app")}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Enter the Debate
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-6">
          theroundtaible.com
        </p>
        <h1 className="font-playfair text-5xl md:text-7xl font-bold leading-tight mb-6">
          History's Greatest Minds.
          <br />
          <span className="text-primary">Your Hardest Questions.</span>
        </h1>
        <p className="font-lora text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Roundtaible puts history's sharpest minds at your table — debating the
          questions your team is actually wrestling with.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/app")}
            className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg"
          >
            Watch a Debate
          </button>
          <button
            onClick={scrollToWaitlist}
            className="px-8 py-4 rounded-lg border-2 border-border bg-card font-semibold text-base hover:border-primary/60 hover:bg-primary/10 transition-all"
          >
            Join the Waitlist
          </button>
        </div>
      </section>

      {/* Persona grid */}
      <section className="py-16 bg-card/50 border-y border-border overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8 font-semibold">
            14 Historical Minds. Infinite Debates.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
            {allPersonas.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePersonaClick(p)}
                className="flex flex-col items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg p-2 -m-2"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all group-hover:scale-110 group-hover:shadow-lg cursor-pointer"
                  style={{ borderColor: p.color }}
                >
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-lora text-muted-foreground text-center leading-tight hidden sm:block group-hover:text-foreground transition-colors">
                  {p.name.split(" ").pop()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center mb-16">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-5">
                <span className="font-playfair font-bold text-lg text-primary">{s.n}</span>
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">{s.heading}</h3>
              <p className="font-lora text-muted-foreground text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-center mb-4">
            Debate Anything. With Everyone Who Ever Mattered.
          </h2>
          <p className="font-lora text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            One engine. Three very different rooms.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="bg-card rounded-xl border border-border p-7 hover:border-primary/40 transition-colors"
              >
                <div className="text-3xl mb-4">{uc.icon}</div>
                <h3 className="font-playfair text-xl font-semibold mb-3">{uc.title}</h3>
                <p className="font-lora text-muted-foreground text-sm leading-relaxed">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz callout */}
      <section className="py-24 px-6 max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
          Personality Quiz
        </p>
        <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-5">
          Which Historical Mind Are You?
        </h2>
        <p className="font-lora text-muted-foreground mb-8 leading-relaxed">
          Seven questions. One historical archetype. Find out whether you think like
          Edison, argue like Machiavelli, or see the world through Curie's eyes.
        </p>
        <button
          onClick={() => navigate("/quiz")}
          className="px-8 py-4 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all hover:scale-[1.02]"
        >
          Take the Quiz
        </button>
      </section>

      {/* Waitlist */}
      <section ref={waitlistRef} className="py-24 px-6 bg-card/50 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
            Early Access
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
            Get a Seat at the Table
          </h2>
          <p className="font-lora text-muted-foreground mb-10 leading-relaxed">
            Roundtaible is rolling out to teams and classrooms. Drop your email and
            we'll reach out when your spot is ready.
          </p>

          {submitted ? (
            <div className="bg-primary/10 border border-primary/30 rounded-xl px-8 py-10">
              <p className="font-playfair text-2xl font-semibold mb-2">You're on the list.</p>
              <p className="font-lora text-muted-foreground text-sm">
                We'll be in touch. In the meantime — the debate is already live.
              </p>
              <button
                onClick={() => navigate("/app")}
                className="mt-6 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Enter the Debate
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-lora"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-lora"
              />
              {error && (
                <p className="text-sm text-destructive font-lora">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Join the Waitlist"}
              </button>
              <p className="text-xs text-muted-foreground font-lora">
                No spam. No pitches. Just access when it's ready.
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />

      {/* Persona Modal */}
      <PersonaModal
        persona={selectedPersona}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

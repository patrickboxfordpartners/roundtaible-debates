import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { allPersonas, Persona } from "@/data/debateData";
import Footer from "@/components/Footer";
import { Logo } from "@/components/Logo";
import PersonaModal from "@/components/PersonaModal";
import { ContactForm } from "@/components/ContactForm";

const TESTIMONIALS = [
  {
    quote: "I used it before a board meeting on AI strategy. Having Jefferson and Machiavelli argue both sides in 20 minutes clarified my thinking more than any consultant deck.",
    name: "David K.",
    role: "Strategy Director",
    avatar: "DK",
  },
  {
    quote: "My students were bored by primary sources. I put Roundtaible on the projector and asked Lincoln and Marx to debate student debt. They didn't stop talking for 40 minutes.",
    name: "Ms. Rachel T.",
    role: "AP History Teacher",
    avatar: "RT",
  },
  {
    quote: "Set it up at our booth with 'Does price or trust win the sale?' Three historical minds debating it drew a crowd every time. Best demo tool we've ever had.",
    name: "Marcus W.",
    role: "Sales Leader",
    avatar: "MW",
  },
];

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
  { n: "1", heading: "Pick a topic", body: "From AI rights to whether empires create progress, or bring your own question." },
  { n: "2", heading: "Watch the debate", body: "Historical personas argue in their authentic voices, citing real philosophy, real experience." },
  { n: "3", heading: "Jump in", body: "Pitch your own idea, vote for the best argument, or take the personality quiz to find your historical match." },
];

export default function Landing() {
  const navigate = useNavigate();
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
    setTimeout(() => setSelectedPersona(null), 200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="md" />
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
          Historical AI Platform
        </p>
        <h1 className="font-playfair text-5xl md:text-7xl font-bold leading-tight mb-6">
          History's Greatest Minds.
          <br />
          <span className="text-primary">Your Hardest Questions.</span>
        </h1>
        <p className="font-lora text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Roundtaible puts history's sharpest minds at your table, debating the
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

      {/* Debate Preview */}
      <section className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">See It Live</p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              The Table Is Already Set.
            </h2>
            <p className="font-lora text-muted-foreground max-w-xl mx-auto">
              A round table. History's sharpest minds. Your question in the middle.
            </p>
          </div>

          {/* Browser chrome + app mockup */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-3 rounded-3xl bg-primary/5 blur-2xl pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              {/* Chrome bar */}
              <div className="bg-card border-b border-border px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/25" />
                </div>
                <div className="flex-1 max-w-xs mx-auto bg-background/60 rounded px-3 py-1 text-[10px] text-muted-foreground font-mono text-center">
                  theroundtaible.com/app
                </div>
              </div>

              {/* Debate mockup */}
              <div className="bg-[#f5f0e8] p-6 md:p-10">
                <p className="font-playfair text-center text-sm text-foreground/50 mb-6 tracking-wide">
                  Algonquin Roundtaible, <span className="italic">Where history's greatest minds debate the future</span>
                </p>

                {/* Round table visual */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  {[
                    { name: "Jefferson", color: "#8B6914", initial: "J" },
                    { name: "Curie", color: "#4A7C8E", initial: "C" },
                    { name: "Machiavelli", color: "#6B3A3A", initial: "M" },
                    { name: "Lincoln", color: "#2D5016", initial: "L" },
                  ].map((p) => (
                    <div key={p.name} className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: p.color, borderColor: p.color }}
                      >
                        {p.initial}
                      </div>
                      <span className="font-lora text-[10px] text-foreground/50">{p.name}</span>
                    </div>
                  ))}
                </div>

                {/* Sample transcript */}
                <div className="bg-background/60 rounded-xl border border-border/50 p-5 space-y-4 max-w-2xl mx-auto text-sm font-lora">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B6914" }}>Jefferson</span>
                    <p className="text-foreground/80 mt-1 leading-relaxed">"The question is not whether AI shall govern, but whether men shall govern AI. Every technology is merely an extension of the will that directs it."</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B3A3A" }}>Machiavelli</span>
                    <p className="text-foreground/80 mt-1 leading-relaxed">"A prince who relies upon others' virtue shall soon find himself without either. AI is a new form of power, and power, unchecked, does not wait for philosophy."</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary/70 text-xs pt-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>Curie is formulating a response...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-2 md:-right-6 bg-card border border-border rounded-xl shadow-xl px-4 py-3 flex items-center gap-2.5">
              <span className="text-lg">🎭</span>
              <div>
                <p className="text-xs font-semibold text-foreground">14 historical personas</p>
                <p className="text-[10px] text-muted-foreground">Any question. Any topic.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/app")}
              className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg"
            >
              Watch a Live Debate
            </button>
          </div>
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

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">What People Say</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold">
            From the Table.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-card rounded-xl border border-border p-7 flex flex-col">
              <p className="font-lora text-sm text-muted-foreground leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-playfair text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="font-lora text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
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

      {/* Contact */}
      <section ref={waitlistRef} className="py-24 px-6 bg-card/50 border-t border-border">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
              Get Access
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold mb-4">
              Get a Seat at the Table
            </h2>
            <p className="font-lora text-muted-foreground leading-relaxed">
              Roundtaible is rolling out to teams and classrooms. Tell us how you'd
              use it and we'll reach out when your spot is ready.
            </p>
          </div>
          <ContactForm />
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

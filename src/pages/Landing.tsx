import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { allPersonas, Persona } from "@/data/debateData";
import Footer from "@/components/Footer";
import { Logo } from "@/components/Logo";
import PersonaModal from "@/components/PersonaModal";
import { FAQSection, featuredFaqs } from "@/components/FAQSection";

const DEBATE_TURNS = [
  { speaker: "Jefferson", color: "#8B6914", text: "The question is not whether AI shall govern, but whether men shall govern AI. Every technology is merely an extension of the will that directs it." },
  { speaker: "Machiavelli", color: "#6B3A3A", text: "A prince who relies upon others' virtue shall soon find himself without either. AI is a new form of power — and power, unchecked, does not wait for philosophy." },
  { speaker: "Curie", color: "#4A7C8E", text: "We must not fear what we have discovered. The question is not whether to govern AI, but whether we have the discipline to govern ourselves first." },
  { speaker: "Lincoln", color: "#2D5016", text: "A house divided cannot stand — and neither can a civilization that builds instruments of governance it does not yet understand. Let us proceed, but proceed carefully." },
];

const TYPING_SPEED = 22; // ms per character
const PAUSE_AFTER = 2200; // ms to hold after full message
const LOOP_PAUSE = 1800; // ms before restarting

function DebateTranscript() {
  const [visibleTurns, setVisibleTurns] = useState<number[]>([]);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [typing, setTyping] = useState(true);
  const [nextSpeaker, setNextSpeaker] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = DEBATE_TURNS[typingIndex];

    if (typing) {
      if (typedChars < current.text.length) {
        timeoutRef.current = setTimeout(() => {
          setTypedChars((c) => c + 1);
        }, TYPING_SPEED);
      } else {
        // Finished typing this turn
        timeoutRef.current = setTimeout(() => {
          setVisibleTurns((prev) => [...prev, typingIndex]);
          setTyping(false);

          const nextIdx = (typingIndex + 1) % DEBATE_TURNS.length;
          if (nextIdx === 0) {
            // About to loop — show "thinking" pause then reset
            setNextSpeaker(DEBATE_TURNS[0].speaker);
            timeoutRef.current = setTimeout(() => {
              setVisibleTurns([]);
              setTypingIndex(0);
              setTypedChars(0);
              setNextSpeaker(null);
              setTyping(true);
            }, LOOP_PAUSE);
          } else {
            setNextSpeaker(DEBATE_TURNS[nextIdx].speaker);
            timeoutRef.current = setTimeout(() => {
              setTypingIndex(nextIdx);
              setTypedChars(0);
              setNextSpeaker(null);
              setTyping(true);
            }, PAUSE_AFTER);
          }
        }, 0);
      }
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [typing, typedChars, typingIndex]);

  const currentTurn = DEBATE_TURNS[typingIndex];

  return (
    <div className="bg-background/70 rounded-xl border border-border/60 p-6 max-w-2xl mx-auto min-h-[220px]">
      <div className="space-y-5">
        {/* Completed turns */}
        {visibleTurns.map((idx) => {
          const turn = DEBATE_TURNS[idx];
          return (
            <div key={idx} className={idx > 0 ? "border-t border-border/50 pt-5" : ""}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: turn.color }}>
                {turn.speaker}
              </span>
              <p className="font-lora text-sm text-foreground/80 mt-1.5 leading-relaxed">
                "{turn.text}"
              </p>
            </div>
          );
        })}

        {/* Currently typing turn */}
        {typing && (
          <div className={visibleTurns.length > 0 ? "border-t border-border/50 pt-5" : ""}>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: currentTurn.color }}>
              {currentTurn.speaker}
            </span>
            <p className="font-lora text-sm text-foreground/80 mt-1.5 leading-relaxed">
              "{currentTurn.text.slice(0, typedChars)}
              <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 align-middle animate-pulse" />
            </p>
          </div>
        )}

        {/* Thinking indicator */}
        {!typing && nextSpeaker && (
          <div className="flex items-center gap-2 text-primary/60 text-xs pt-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="font-lora">{nextSpeaker} is formulating a response...</span>
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function Landing() {
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePersonaClick = (persona: Persona) => {
    setSelectedPersona(persona);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedPersona(null), 200);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: featuredFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="min-h-dvh bg-background text-foreground pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/faq")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              FAQ
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── 1. HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-24 sm:pt-36 pb-16 sm:pb-28 px-4 sm:px-6 text-center overflow-hidden">
        {/* Rotating round table background motif */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <motion.svg
            viewBox="0 0 400 400"
            className="w-[600px] h-[600px] opacity-[0.07]"
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
          >
            {/* Outer ring */}
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="1.5" />
            {/* Inner table surface */}
            <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {/* 14 seat positions */}
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * 2 * Math.PI - Math.PI / 2;
              const cx = 200 + 180 * Math.cos(a);
              const cy = 200 + 180 * Math.sin(a);
              return <circle key={i} cx={cx} cy={cy} r="10" fill="currentColor" />;
            })}
            {/* Spoke lines */}
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * 2 * Math.PI - Math.PI / 2;
              const x1 = 200 + 95 * Math.cos(a);
              const y1 = 200 + 95 * Math.sin(a);
              const x2 = 200 + 165 * Math.cos(a);
              const y2 = 200 + 165 * Math.sin(a);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.75" />;
            })}
          </motion.svg>
        </div>

        {/* Radial amber glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-6">
            Historical AI Debate Platform
          </p>
          <h1 className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
            History's Greatest Minds.
            <br />
            <span className="text-primary">Your Hardest Questions.</span>
          </h1>
          <p className="font-lora text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Pick a question. Watch Edison, Machiavelli, Curie, and eleven others argue it in real time — in their own voices, from their own eras.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/25"
            >
              Try 3 debates free
            </button>
            <p className="text-sm text-muted-foreground">No credit card required</p>
          </div>
        </div>
      </section>

      {/* ─── 2. PERSONAS ─────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 border-y border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-8 sm:mb-12">
            14 Historical Minds at the Table
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 sm:gap-6">
            {allPersonas.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePersonaClick(p)}
                className="flex flex-col items-center gap-3 group focus:outline-none"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20"
                  style={{ borderColor: p.color }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        const parent = t.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = p.color;
                          parent.innerHTML = `<span style="color:white;font-weight:700;font-size:1.1rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${p.name.charAt(0)}</span>`;
                        }
                      }}
                    />
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
          <p className="text-center text-xs text-muted-foreground mt-10 font-lora">
            Click any figure to learn their philosophy and debate style
          </p>
        </div>
      </section>

      {/* ─── 3. LIVE MOCKUP ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">See It In Action</p>
            <h2 className="font-playfair text-3xl md:text-5xl font-bold mb-4">
              The Table Is Already Set.
            </h2>
            <p className="font-lora text-muted-foreground max-w-lg mx-auto text-lg">
              A round table. History's sharpest minds. Your question in the middle.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-primary/8 blur-3xl pointer-events-none" />

            {/* Browser chrome */}
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="flex-1 max-w-xs mx-auto bg-background/60 rounded px-3 py-1 text-[10px] text-muted-foreground font-mono text-center">
                  theroundtaible.com/app
                </div>
              </div>

              <div className="bg-parchment p-8 md:p-12">
                <p className="font-playfair text-center text-sm text-foreground/40 mb-6 tracking-wide italic">
                  Should AI be allowed to govern?
                </p>

                {/* Animated transcript */}
                <DebateTranscript />
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/app")}
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Watch a Live Debate
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. TWO-COLUMN: EDUCATORS + TEAMS ───────────────────────── */}
      <section className="py-14 sm:py-24 border-y border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              One Engine. Two Very Different Rooms.
            </h2>
            <p className="font-lora text-muted-foreground max-w-lg mx-auto">
              Built for the classroom. Deployed at the conference table.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Educators */}
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-8">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-bold mb-2">For Educators</h3>
              <p className="font-lora text-muted-foreground text-sm mb-6 leading-relaxed">
                Primary sources debating modern topics. Pause for class discussion. Resume. A history class that actually holds attention.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Grade-level settings — middle school to college",
                  "Class management with 6-character join codes",
                  "Curriculum-aligned topics: Revolution, Cold War, civil rights",
                  "Socratic questioning mode built in",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-lora text-foreground/80">
                    <span className="text-primary mt-0.5 shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth?role=teacher")}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Set up your classroom
              </button>
            </div>

            {/* Teams */}
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-8">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-playfair text-xl font-bold mb-2">For Teams & Sales</h3>
              <p className="font-lora text-muted-foreground text-sm mb-6 leading-relaxed">
                Before your next big decision, watch history's sharpest strategists argue it from every angle. Walk into the room with no blind spots.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Decision support before board meetings or pitches",
                  "Conference booth demo — draws a crowd every time",
                  "Kiosk mode for events and trade shows",
                  "Any question, any industry, in under 5 minutes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-lora text-foreground/80">
                    <span className="text-primary mt-0.5 shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/auth")}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Start a debate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">From the Table</p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold">
              What People Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
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
        </div>
      </section>

      {/* ─── 5. BOTTOM CTA ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 bg-secondary text-secondary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            The Table Is Open.
          </h2>
          <p className="font-lora text-lg opacity-70 mb-10 leading-relaxed">
            Three debates free. No credit card. Start in under a minute.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-xl shadow-primary/30"
          >
            Try 3 debates free
          </button>
        </div>
      </section>

      <FAQSection />
      <Footer />

      <PersonaModal
        persona={selectedPersona}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

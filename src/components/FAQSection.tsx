import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const faqs = [
  // ── What is Roundtaible ────────────────────────────────────────────────
  {
    category: "What is Roundtaible",
    featured: true,
    question: "What is Roundtaible?",
    answer:
      "Roundtaible is an AI debate platform that lets you have structured, multi-turn debates with historical figures, thinkers, and expert personas. You pick a topic and the personas argue opposing sides using their actual documented positions and reasoning styles. It's a tool for sharper thinking — built for students, educators, and professionals who want to stress-test ideas before committing to them.",
  },
  {
    category: "What is Roundtaible",
    featured: true,
    question: "Who are the debate personas?",
    answer:
      "Roundtaible includes a growing roster of historical and intellectual figures — philosophers, scientists, statesmen, and thinkers — each grounded in their documented worldview and argumentation style. Each persona has a voice, a set of core beliefs, and a debate style that reflects how they actually argued. You can also create custom personas for professional or classroom use.",
  },
  {
    category: "What is Roundtaible",
    featured: false,
    question: "How is this different from just asking ChatGPT?",
    answer:
      "ChatGPT gives you answers. Roundtaible forces productive disagreement. The platform is structured around debate — opposing positions, turn-taking, Socratic questioning, and argument steelmanning. The goal is to surface the strongest version of every side, not to generate a single answer. That structure is what develops critical thinking, not just information retrieval.",
  },
  {
    category: "What is Roundtaible",
    featured: false,
    question: "Can I debate any topic?",
    answer:
      "Yes, with the constraint that the topic has genuine intellectual tension. Abstract ethics, policy questions, historical decisions, scientific controversies, philosophical thought experiments — all work well. The platform performs best when there is a real and defensible position on multiple sides.",
  },

  // ── For Educators ──────────────────────────────────────────────────────
  {
    category: "For Educators",
    featured: true,
    question: "How do teachers use Roundtaible in the classroom?",
    answer:
      "Teachers assign debate topics tied to their curriculum, create classes with join codes, and track student debate transcripts. Students engage in structured AI debates as assignments, with the AI adapting its Socratic questioning to their grade level. Teachers review transcripts to assess argument quality, evidence use, and reasoning. It replaces worksheet-style comprehension checks with active intellectual engagement.",
  },
  {
    category: "For Educators",
    featured: true,
    question: "What grade levels does Roundtaible support?",
    answer:
      "Roundtaible supports grade levels from middle school through university. The AI automatically adjusts vocabulary, complexity, and Socratic challenge level based on the grade level set by the teacher. A middle school student debating the ethics of technology gets a different level of pushback than a college senior in a philosophy seminar.",
  },
  {
    category: "For Educators",
    featured: false,
    question: "Does Roundtaible align with academic standards?",
    answer:
      "Yes. The debate format directly develops skills tied to Common Core ELA standards (argumentation, evidence evaluation, speaking and listening) and NGSS science practices. Teachers can map specific debate assignments to their standards. We provide suggested topic banks organized by subject and grade level.",
  },
  {
    category: "For Educators",
    featured: false,
    question: "Can students use Roundtaible for research and writing prep?",
    answer:
      "Absolutely. Debates are one of the best ways to stress-test a thesis before writing an essay. Students who argue both sides of a question before writing produce stronger, more nuanced arguments. Many teachers assign a debate first, then have students write from the position they found most defensible.",
  },

  // ── For Professionals ──────────────────────────────────────────────────
  {
    category: "For Professionals",
    featured: false,
    question: "How do professionals use Roundtaible?",
    answer:
      "Strategy teams use it to pressure-test decisions before committing. Consultants use it to anticipate client objections. Lawyers use it for argument rehearsal. Executives use it to surface blind spots in strategic proposals. The core use case is the same as in education: if your argument can't survive a structured challenge, it's not ready.",
  },
  {
    category: "For Professionals",
    featured: false,
    question: "Can I create custom personas for my industry?",
    answer:
      "Yes. Enterprise and team plans include custom persona creation. You can build a persona grounded in a specific regulatory framework, a competitor's known strategic stance, or a fictional but representative stakeholder. Custom personas let you simulate the exact pressure your idea will face in the real world.",
  },

  // ── Pricing & Access ───────────────────────────────────────────────────
  {
    category: "Pricing & Access",
    featured: true,
    question: "How many debates can I have for free?",
    answer:
      "You get three free debates before being asked to subscribe. No credit card required to start. The free debates are full debates — not demos — so you can experience the full product before committing.",
  },
  {
    category: "Pricing & Access",
    featured: false,
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no cancellation fees. You can cancel from your account settings at any time and retain access through the end of your billing period.",
  },
  {
    category: "Pricing & Access",
    featured: false,
    question: "Is there a discount for schools and universities?",
    answer:
      "Yes. Educational institutions get preferential pricing on classroom and institutional plans. Contact us with your institution name and intended use and we will set up the right plan.",
  },
];

export const featuredFaqs = faqs.filter((f) => f.featured);

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Common questions.
          </h2>
        </motion.div>

        <div>
          {featuredFaqs.map((faq, i) => (
            <div key={i} className="border-t border-border">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-5 text-left group"
              >
                <span className="font-body text-base font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 mt-0.5 text-xl leading-none text-muted-foreground group-hover:text-primary transition-colors"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p className="font-body text-sm text-muted-foreground leading-relaxed pb-5">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div className="border-t border-border" />
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/faq"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See all frequently asked questions &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

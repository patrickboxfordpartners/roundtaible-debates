import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";
import { faqs } from "@/components/FAQSection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const categories = Array.from(new Set(faqs.map((f) => f.category)));

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function FAQPage() {
  usePageMeta({
    title: "FAQ - Roundtaible",
    description: "Answers to common questions about Roundtaible's AI debate platform for educators, students, and professionals.",
  });

  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/faq")}
              className="text-sm text-foreground font-semibold transition-colors hidden sm:block"
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

      {/* Breadcrumbs */}
      <div className="pt-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs items={[{ label: "FAQ" }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="pt-8 pb-14 px-4 sm:px-6 text-center border-b border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">FAQ</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
            Frequently Asked Questions
          </h1>
          <p className="font-body text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Everything you need to know about Roundtaible — AI-powered debate for sharper thinking.
          </p>
        </motion.div>
      </section>

      {/* Category nav */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border overflow-x-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-0">
          {categories.map((cat) => {
            const anchor = cat.toLowerCase().replace(/\s+/g, "-");
            return (
              <a
                key={cat}
                href={`#${anchor}`}
                className="inline-block px-4 py-3.5 text-sm font-medium text-muted-foreground whitespace-nowrap border-b-2 border-transparent hover:text-primary hover:border-primary transition-colors"
              >
                {cat}
              </a>
            );
          })}
        </div>
      </div>

      {/* FAQ sections */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 pb-24">
        {categories.map((cat) => {
          const items = faqs.filter((f) => f.category === cat);
          const anchor = cat.toLowerCase().replace(/\s+/g, "-");
          return (
            <section
              key={cat}
              id={anchor}
              className="mb-14"
              style={{ scrollMarginTop: 120 }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-6 pb-3 border-b border-border">
                {cat}
              </h2>

              <div>
                {items.map((faq) => {
                  const key = `${cat}:${faq.question}`;
                  const isOpen = openKey === key;
                  return (
                    <div key={key} className="border-t border-border">
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
                      >
                        <span className="font-body text-base font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0 mt-0.5 text-xl leading-none text-muted-foreground group-hover:text-primary transition-colors"
                        >
                          +
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                          >
                            <p className="font-body text-sm text-muted-foreground leading-relaxed pb-5 max-w-[640px]">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                <div className="border-t border-border" />
              </div>
            </section>
          );
        })}

        {/* Still have questions */}
        <div className="mt-4 rounded-2xl border border-border bg-card/50 p-10 text-center">
          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            Still have questions?
          </h3>
          <p className="font-body text-sm text-muted-foreground mb-6 leading-relaxed">
            Reach out and we will get back to you within one business day.
          </p>
          <a
            href="mailto:hello@boxfordpartners.com"
            className="inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Contact us
          </a>
        </div>

        {/* Related pages */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="text-muted-foreground">Explore:</span>
          <Link to="/pricing" className="text-primary hover:underline font-medium">Pricing</Link>
          <span className="text-muted-foreground/40">|</span>
          <Link to="/blog" className="text-primary hover:underline font-medium">Blog</Link>
          <span className="text-muted-foreground/40">|</span>
          <Link to="/auth" className="text-primary hover:underline font-medium">Try Roundtaible</Link>
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 border-t border-border text-center bg-card/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Roundtaible</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-5">
            Ready to think harder?
          </h2>
          <p className="font-body text-base text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            Three free debates. No credit card required. Debate history, philosophy, science, ethics, and more — with personas who push back.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center bg-primary text-primary-foreground text-sm font-semibold px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Start Debating Free
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

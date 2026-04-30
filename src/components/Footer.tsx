import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const Footer = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!supabase) throw new Error("Contact form unavailable");

      const { error } = await supabase.from("rt_contact_submissions").insert([
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          source: "footer",
          user_agent: navigator.userAgent,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Send failed",
        description: "Please email us directly at hello@boxfordpartners.com",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Contact Form */}
        <div className="mb-16 rounded-2xl border border-border bg-card/50 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="font-playfair text-2xl font-bold text-foreground md:text-3xl">
              Get in Touch
            </h3>
            <p className="font-lora mt-4 text-muted-foreground">
              Questions about Roundtaible? Want to bring it to your team or classroom? Let's talk.
            </p>
            <form onSubmit={handleContactSubmit} className="mt-8 flex flex-col gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="font-lora w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="font-lora w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you're interested in..."
                rows={4}
                className="font-lora w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
            <p className="font-lora mt-4 text-xs text-muted-foreground">
              Or email us directly at{" "}
              <a href="mailto:hello@boxfordpartners.com" className="text-foreground hover:text-primary transition-colors">
                hello@boxfordpartners.com
              </a>
            </p>
          </div>
        </div>

        <div className="grid gap-12 text-center md:grid-cols-4 md:text-left">
          {/* Brand */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start">
            <Logo size="md" />
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground/60 mt-3 border border-border rounded px-3 py-1.5 inline-block">
              A Boxford Partners Company
            </p>
            <a
              href="mailto:hello@boxfordpartners.com"
              className="text-muted-foreground text-xs mt-4 block hover:text-primary transition-colors"
            >
              hello@boxfordpartners.com
            </a>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Products
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="https://reviewsniper.app/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  reviewSNIPER
                </a>
              </li>
              <li>
                <a href="https://gravitasindex.com/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  Gravitas Index
                </a>
              </li>
              <li>
                <a href="https://loanhubos.com/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  LoanHub OS
                </a>
              </li>
              <li>
                <a href="https://theroundtaible.com/" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  Roundtaible
                </a>
              </li>
              <li>
                <a href="https://mail.boxfordpartners.com/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  mailBOXFORD
                </a>
              </li>
              <li>
                <a href="https://crm.boxfordpartners.com/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">
                  Boxford CRM
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h4>
            <ul className="space-y-3">
              <li><a href="https://www.boxfordpartners.com/about" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">About</a></li>
              <li><a href="https://www.boxfordpartners.com/services" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">Services</a></li>
              <li><a href="https://www.boxfordpartners.com/labs" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">Labs</a></li>
              <li><a href="https://www.boxfordpartners.com/faq" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">FAQ</a></li>
              <li><a href="https://www.boxfordpartners.com/audit" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">AI Readiness Audit</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-3">
              <li><a href="https://www.boxfordpartners.com/privacy" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">Privacy Policy</a></li>
              <li><a href="https://www.boxfordpartners.com/terms" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">Terms of Service</a></li>
              <li><a href="https://www.boxfordpartners.com/acceptable-use" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-foreground/80 transition-colors hover:text-foreground">Acceptable Use</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-6 text-center md:text-left">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Boxford Partners LLC DBA ROUNDTAIBLE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

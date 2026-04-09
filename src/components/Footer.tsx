import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!supabase) throw new Error("Newsletter signup unavailable");

      const { error } = await supabase.from("newsletter_signups").insert([
        {
          email,
          source: "footer",
          user_agent: navigator.userAgent,
        },
      ]);

      if (error) throw error;

      toast({
        title: "You're subscribed!",
        description: "We'll send you weekly insights on AI & product development.",
      });
      setEmail("");
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast({
        title: "Subscription failed",
        description: "Please try again or email us at hello@boxfordpartners.com",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        {/* Newsletter Signup */}
        <div className="mb-16 rounded-2xl border border-border bg-card/50 p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="font-playfair text-2xl font-bold text-foreground md:text-3xl">
              Weekly Product Insights
            </h3>
            <p className="font-lora mt-4 text-muted-foreground">
              Get practical advice on building products, AI integration, and operations — no fluff, just what works.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="font-lora flex-1 rounded-full border border-border bg-background px-6 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-md"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
            <p className="font-lora mt-4 text-xs text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="https://www.boxfordpartners.com" target="_blank" rel="noopener noreferrer" className="inline-block">
              <span className="font-playfair text-lg font-bold text-foreground">Boxford Partners</span>
            </a>
            <p className="font-lora mt-4 text-sm leading-relaxed text-muted-foreground">
              Product studio for service &amp; B2B companies. Bottom-up problem solving, not top-down tech.
            </p>
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

        <div className="mt-16 border-t border-border pt-8">
          <p className="font-lora text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Boxford Partners. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

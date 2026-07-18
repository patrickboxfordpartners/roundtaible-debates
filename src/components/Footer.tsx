import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div className="opacity-70">
            <Logo size="md" />
          </div>

          {/* Tagline */}
          <p className="font-lora max-w-sm text-sm text-muted-foreground">
            AI debate and critical thinking for classrooms and sales teams.
          </p>

          {/* Nav row */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            <Link to="/blog" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link to="/faq" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </Link>
            <a href="https://reviewsniper.app/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              reviewSNIPER
            </a>
            <a href="https://gravitasindex.com/" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              Gravitas Index
            </a>
            <a href="https://www.boxfordpartners.com/about" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              About
            </a>
            <a href="https://www.boxfordpartners.com/services" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              Services
            </a>
            <a href="https://www.linkedin.com/company/boxfordpartners" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              LinkedIn
            </a>
          </nav>

          {/* Contact row */}
          <div className="flex items-center gap-4">
            <a href="mailto:hello@boxfordpartners.com" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              hello@boxfordpartners.com
            </a>
            <span className="text-muted-foreground/40">·</span>
            <a href="https://cal.com/boxfordpartners" target="_blank" rel="noopener noreferrer" className="font-lora text-sm text-muted-foreground transition-colors hover:text-foreground">
              Book a call
            </a>
          </div>

          {/* Legal bar */}
          <div className="w-full pt-6 border-t border-border flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            <p className="text-xs text-muted-foreground/50">
              &copy; {year} Boxford Partners LLC DBA ROUNDTAIBLE. All rights reserved.
            </p>
            <span className="text-muted-foreground/30 text-xs hidden sm:inline">·</span>
            <a href="https://www.boxfordpartners.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              Privacy
            </a>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <a href="https://www.boxfordpartners.com/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              Terms
            </a>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <a href="https://www.boxfordpartners.com/acceptable-use" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground">
              Acceptable Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

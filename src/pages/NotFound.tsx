import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page Not Found - Roundtaible";
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <Link
            to="/auth"
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Try Free
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-6xl font-playfair font-bold text-primary mb-4">404</p>
          <h1 className="text-2xl font-playfair font-bold mb-3">Page Not Found</h1>
          <p className="text-muted-foreground font-lora mb-8 leading-relaxed">
            The page you are looking for does not exist or has been moved. Try one of these instead:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/blog"
              className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/faq"
              className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-card transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;

import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";
import { posts } from "@/data/posts";

export function Blog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="focus:outline-none">
            <Logo size="md" />
          </button>
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
              className="px-4 py-1.5 rounded-lg bg-[#C17F24] text-white text-sm font-semibold hover:bg-[#C17F24]/90 transition-colors"
            >
              Try Free
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-background border-b border-border pt-28 pb-16 px-4 sm:px-6 text-center">
        <p className="text-xs uppercase tracking-widest text-[#C17F24] font-semibold mb-4">
          The Roundtaible Blog
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          Ideas Worth Arguing
        </h1>
        <p className="font-body text-muted-foreground max-w-lg mx-auto text-lg">
          Research, education, and the case for structured disagreement.
        </p>
      </header>

      {/* Article list */}
      <main className="bg-background py-16 px-4 sm:px-6 min-h-[40vh]">
        <div className="max-w-3xl mx-auto">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-[#1a1a2e]/10 py-10 first:pt-0"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C17F24]/15 text-[#C17F24] text-[10px] font-semibold uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-[#1a1a2e]/40 text-xs font-body">{post.readTime}</span>
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-[#1a1a2e] mb-3 leading-snug">
                {post.title}
              </h2>
              <p className="font-body text-[#1a1a2e]/65 text-sm leading-relaxed mb-4 max-w-2xl">
                {post.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-body text-[#1a1a2e]/40">
                  <a
                    href={post.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#C17F24] transition-colors"
                  >
                    {post.author}
                  </a>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
                <button
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="text-sm font-semibold text-[#C17F24] hover:text-[#C17F24]/80 transition-colors"
                >
                  Read more &rarr;
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

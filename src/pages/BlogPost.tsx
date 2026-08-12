import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import Footer from "@/components/Footer";
import { BlogFAQ } from "@/components/BlogFAQ";
import { getPost } from "@/data/posts";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? getPost(slug) : undefined;

  usePageMeta({
    title: post ? `${post.title} - Roundtaible Blog` : "Post Not Found - Roundtaible",
    description: post?.description ?? "Blog post not found on Roundtaible.",
  });

  // Inject Article JSON-LD schema
  useEffect(() => {
    if (!post) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "blog-post-schema";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: {
        "@type": "Person",
        name: post.author,
        url: post.authorUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "Roundtaible",
        url: "https://theroundtaible.com",
      },
      url: post.canonical,
    });

    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById("blog-post-schema");
      if (existing) existing.remove();
    };
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-muted-foreground mb-4">Post not found.</p>
          <button
            onClick={() => navigate("/blog")}
            className="text-sm font-semibold text-[#C17F24] hover:text-[#C17F24]/80 transition-colors"
          >
            &larr; Back to Blog
          </button>
        </div>
      </div>
    );
  }

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

      {/* Hero */}
      <header className="bg-background border-b border-border pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs
            items={[
              { label: "Blog", to: "/blog" },
              { label: post.title },
            ]}
            className="mb-8"
          />
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C17F24]/20 text-[#C17F24] text-[10px] font-semibold uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-muted-foreground/50 text-xs font-body">{post.readTime}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
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
        </div>
      </header>

      {/* Body */}
      <main className="bg-background px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Direct Answer box */}
          <div className="border-l-4 border-[#C17F24] bg-white/70 rounded-r-lg px-6 py-5 mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C17F24] mb-2">
              Direct Answer
            </p>
            <p className="font-body text-[#1a1a2e]/80 text-sm leading-relaxed">
              {post.description}
            </p>
          </div>

          <style>{`
            .blog-body h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin: 2.5rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(26,26,46,0.12); line-height: 1.3; letter-spacing: -0.01em; }
            .blog-body h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.05rem; font-weight: 600; color: #1a1a2e; margin: 1.75rem 0 0.5rem; }
            .blog-body p { margin: 0 0 1.25rem; color: rgba(26,26,46,0.75); line-height: 1.8; font-size: 0.9375rem; }
            .blog-body ul, .blog-body ol { margin: 0 0 1.25rem; padding-left: 1.5rem; color: rgba(26,26,46,0.75); }
            .blog-body li { margin-bottom: 0.4rem; line-height: 1.7; }
            .blog-body a { color: #C17F24; text-decoration: underline; }
            .blog-body strong { font-weight: 600; color: #1a1a2e; }
          `}</style>
          {/* Article body */}
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>
      </main>

      <BlogFAQ />

      {/* CTA */}
      <section className="bg-secondary py-20 px-4 sm:px-6 text-center border-t border-border">
        <div className="max-w-xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C17F24] font-semibold mb-4">
            Roundtaible
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary-foreground mb-5">
            Ready to think harder?
          </h2>
          <p className="font-body text-secondary-foreground/60 text-base mb-8 leading-relaxed">
            Three debates free. No credit card. Pick a question and watch history's
            sharpest minds argue both sides in real time.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3.5 rounded-lg bg-[#C17F24] text-white font-semibold text-base hover:bg-[#C17F24]/90 transition-all hover:scale-[1.02] shadow-lg shadow-[#C17F24]/25"
          >
            Try 3 debates free
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

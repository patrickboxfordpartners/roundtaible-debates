import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnsplashPhoto } from "@/hooks/useUnsplashPhoto";
import { Logo } from "@/components/Logo";
import { allPersonas } from "@/data/debateData";

// Brand colors (hex versions of the CSS variables in index.css). Clerk renders in its
// own styling scope, so it needs literal values rather than Tailwind classes.
const BRAND = {
  wood: "#33201a",
  woodMuted: "#8a685c",
  amber: "#f5a124",
  amberHover: "#e8921a",
  card: "#f7ebd4",
  parchment: "#fdf5e2",
  border: "#d8cab6",
};

/**
 * Clerk renders inside our card, so strip Clerk's own card chrome (border, shadow,
 * padding, header) and hide its footer link -- we show a single sign-in/sign-up switch.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: BRAND.amber,
    colorTextOnPrimaryBackground: BRAND.wood,
    colorText: BRAND.wood,
    colorTextSecondary: BRAND.woodMuted,
    colorBackground: BRAND.card,
    colorInputBackground: BRAND.parchment,
    colorInputText: BRAND.wood,
    colorNeutral: BRAND.wood,
    borderRadius: "0.625rem",
    fontFamily: '"Inter", sans-serif',
    fontFamilyButtons: '"Inter", sans-serif',
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: {
      width: "100%",
      maxWidth: "100%",
      boxShadow: "none",
      border: "none",
      borderRadius: 0,
      background: "transparent",
      overflow: "visible",
    },
    card: {
      width: "100%",
      background: "transparent",
      boxShadow: "none",
      border: "none",
      borderRadius: 0,
      padding: 0,
      gap: "1.25rem",
    },
    header: { display: "none" },
    footer: {
      background: "transparent",
      marginTop: "0.25rem",
      // Clerk draws a rule above its "Secured by" row; we already separate sections.
      "& > div": { background: "transparent", borderTop: "none !important" },
    },
    footerAction: { display: "none" },
    socialButtonsBlockButton: {
      height: "2.75rem",
      backgroundColor: BRAND.parchment,
      border: `1px solid ${BRAND.border}`,
      boxShadow: "none",
      color: BRAND.wood,
      "&:hover": { backgroundColor: "#fbeed3" },
    },
    socialButtonsBlockButtonText: { fontWeight: 500, fontSize: "0.9375rem" },
    dividerLine: { backgroundColor: BRAND.border },
    dividerText: { color: BRAND.woodMuted },
    formFieldLabel: { fontWeight: 500, color: BRAND.wood },
    formFieldInput: {
      height: "2.75rem",
      backgroundColor: BRAND.parchment,
      border: `1px solid ${BRAND.border}`,
      boxShadow: "none",
      "&:focus": { borderColor: BRAND.amber, boxShadow: `0 0 0 3px rgba(245, 161, 36, 0.25)` },
    },
    formButtonPrimary: {
      height: "2.75rem",
      fontSize: "0.9375rem",
      fontWeight: 600,
      textTransform: "none",
      backgroundColor: BRAND.amber,
      color: BRAND.wood,
      boxShadow: "none",
      border: "none",
      "&:hover, &:focus": { backgroundColor: BRAND.amberHover },
      "&::after": { display: "none" },
    },
    formFieldAction: { color: BRAND.wood, fontWeight: 500 },
    identityPreviewEditButton: { color: BRAND.wood },
    otpCodeFieldInput: { borderColor: BRAND.border },
  },
};

const FEATURED = ["edison", "curie", "twain", "cleopatra", "tesla", "machiavelli"];

export default function Auth() {
  const { isAuthenticated, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSignUp = searchParams.get("signup") === "true";
  const [role, setRole] = useState<"teacher" | "student">(() => {
    const stored = localStorage.getItem("roundtaible_signup_role");
    return stored === "teacher" ? "teacher" : "student";
  });
  const photo = useUnsplashPhoto();

  // Persist role selection so AuthContext can read it after Clerk signup
  useEffect(() => {
    localStorage.setItem("roundtaible_signup_role", role);
  }, [role]);

  if (isAuthenticated) {
    return <Navigate to={isTeacher ? "/teacher" : "/student"} replace />;
  }

  function switchMode() {
    // Keep the mode in the URL so refresh and the back button behave.
    setSearchParams(isSignUp ? {} : { signup: "true" }, { replace: true });
  }

  const featured = FEATURED.map((id) => allPersonas.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-2">
      {/* Form side */}
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 sm:py-8">
        <Link to="/" className="self-start text-foreground" aria-label="Roundtaible home">
          <Logo size="sm" />
        </Link>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[420px]">
            <div className="rounded-2xl border border-border bg-card px-5 py-7 shadow-[0_1px_2px_rgba(51,32,26,0.06),0_12px_32px_-12px_rgba(51,32,26,0.22)] sm:px-8 sm:py-9">
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]">
                {isSignUp ? "Join the table" : "Welcome back"}
              </h1>
              <p className="mt-1.5 font-body text-[15px] text-muted-foreground">
                {isSignUp
                  ? "Create a free account. Your first 3 debates are on us."
                  : "Sign in to continue your debates."}
              </p>

              {isSignUp && (
                <fieldset className="mt-6">
                  <legend className="mb-2 font-body text-sm font-medium">I'm joining as a</legend>
                  <div
                    role="radiogroup"
                    className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/60 p-1"
                  >
                    {(["student", "teacher"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={role === r}
                        onClick={() => setRole(r)}
                        className={`h-10 rounded-lg font-body text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          role === r
                            ? "bg-secondary text-secondary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="mt-6">
                {isSignUp ? (
                  <SignUp routing="hash" appearance={clerkAppearance} forceRedirectUrl="/auth" />
                ) : (
                  <SignIn routing="hash" appearance={clerkAppearance} forceRedirectUrl="/auth" />
                )}
              </div>

              <p className="mt-6 border-t border-border pt-5 text-center font-body text-[15px] text-muted-foreground">
                {isSignUp ? "Already have an account?" : "New to Roundtaible?"}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => navigate("/app?demo=true")}
                className="font-body text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Just looking? Watch a demo debate without an account
              </button>
            </div>
          </div>
        </div>

        <footer className="flex justify-center gap-5 font-body text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground">Privacy</a>
          <a href="/terms" className="hover:text-foreground">Terms</a>
        </footer>
      </main>

      {/* Photo side (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-[hsl(var(--wood-dark))] lg:block">
        <img
          src={photo.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--wood-dark))] via-[hsl(var(--wood-dark)/0.75)] to-[hsl(var(--wood-dark)/0.35)]" />

        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Historical AI debate platform
          </p>
          <h2 className="mt-4 max-w-md font-display text-4xl font-bold leading-tight text-[hsl(var(--parchment))] xl:text-5xl">
            History's greatest minds. <span className="text-primary">Your hardest questions.</span>
          </h2>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {featured.map((p) => (
                <img
                  key={p!.id}
                  src={p!.avatar}
                  alt={p!.name}
                  title={p!.name}
                  className="h-11 w-11 rounded-full border-2 border-[hsl(var(--wood-dark))] object-cover grayscale-[30%]"
                />
              ))}
            </div>
            <p className="font-body text-sm text-[hsl(var(--parchment)/0.75)]">
              Edison, Curie, Twain and 11 more are waiting.
            </p>
          </div>

          <p className="mt-12 font-body text-[11px] text-[hsl(var(--parchment)/0.5)]">
            Photo by{" "}
            <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[hsl(var(--parchment))]">
              {photo.photographer}
            </a>{" "}
            on{" "}
            <a
              href="https://unsplash.com?utm_source=boxford&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[hsl(var(--parchment))]"
            >
              Unsplash
            </a>
          </p>
        </div>
      </aside>
    </div>
  );
}

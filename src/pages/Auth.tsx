import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";

const PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
];

const clerkAppearance = {
  elements: {
    rootBox: { width: "100%" },
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
      padding: 0,
      border: "none",
    },
    formButtonPrimary: {
      backgroundColor: "#111827",
      borderRadius: "0.5rem",
      height: "3rem",
      fontSize: "15px",
    },
    formFieldInput: {
      backgroundColor: "#f9fafb",
      borderColor: "#e5e7eb",
      borderRadius: "0.5rem",
      height: "3rem",
      fontSize: "15px",
    },
    headerTitle: { display: "none" as const },
    headerSubtitle: { display: "none" as const },
    footerActionLink: { color: "#111827" },
  },
};

export default function Auth() {
  const { isAuthenticated, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("signup") === "true"
  );
  const [role, setRole] = useState<"teacher" | "student">(() => {
    const stored = localStorage.getItem("roundtaible_signup_role");
    return stored === "teacher" ? "teacher" : "student";
  });
  const [photoIndex] = useState(() =>
    Math.floor(Math.random() * PHOTOS.length)
  );

  // Persist role selection so AuthContext can read it after Clerk signup
  useEffect(() => {
    localStorage.setItem("roundtaible_signup_role", role);
  }, [role]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(isTeacher ? "/teacher" : "/student", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left -- Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex justify-center mb-14">
            <img
              src="/favicon.svg"
              alt="Roundtaible logo"
              className="h-10 w-auto"
            />
          </div>

          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            {isSignUp ? "Get started" : "Welcome back"}
          </h1>
          <p className="text-gray-500 text-[15px] mb-8">
            AI-powered debate platform for education
          </p>

          {/* Role selector (only shown before signup) */}
          {isSignUp && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 h-12 rounded-lg text-[15px] font-medium transition-colors ${
                    role === "student"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 h-12 rounded-lg text-[15px] font-medium transition-colors ${
                    role === "teacher"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>
          )}

          {/* Clerk auth component */}
          {isSignUp ? (
            <SignUp
              routing="hash"
              appearance={clerkAppearance}
              forceRedirectUrl="/auth"
            />
          ) : (
            <SignIn
              routing="hash"
              appearance={clerkAppearance}
              forceRedirectUrl="/auth"
            />
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-[15px] text-gray-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-900 font-medium hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          {/* Demo link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/app?demo=true")}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              or try the demo without an account
            </button>
          </div>

          {/* Legal footer */}
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* Right -- Photo */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src={PHOTOS[photoIndex]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

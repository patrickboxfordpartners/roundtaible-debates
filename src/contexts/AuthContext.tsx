import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { dataCall, setTokenGetter } from "@/services/api";
import { posthog } from "@/lib/posthog";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "teacher" | "student" | "admin";
  avatar_url: string | null;
  subscription_tier: "free" | "pro" | "edu";
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Provide Clerk session state, the server-backed profile, role flags, and sign-in controls to descendants. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const userId = clerkUser?.id ?? null;
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;

  // Let /api calls attach the Clerk session token. Set during render so it is
  // ready before any child component's effects run.
  setTokenGetter(() => getToken());

  // Fetch (or create) profile when Clerk user changes
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    fetchOrCreateProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the signed-in user changes
  }, [isLoaded, isSignedIn, userId]);

  // Pick up subscription changes from the Stripe webhook when the user comes back to the tab
  // (replaces the old Supabase realtime listener)
  useEffect(() => {
    if (!profile?.id) return;
    /** Refresh the profile quietly when the document becomes visible so billing changes can appear. */
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchOrCreateProfile(true);
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-register only when the profile changes
  }, [profile?.id]);

  /** Load or create the session profile; quiet refreshes preserve existing data on failure and skip analytics. */
  async function fetchOrCreateProfile(quiet = false) {
    try {
      const storedRole = localStorage.getItem("roundtaible_signup_role") as "teacher" | "student" | null;
      const { profile: data, created } = await dataCall<{ profile: Profile | null; created: boolean }>(
        "profile.get",
        { role: storedRole || "student" }
      );
      if (created) localStorage.removeItem("roundtaible_signup_role");
      setProfile(data);
      if (data && !quiet) identify(data);
    } catch (_err) {
      if (!quiet) setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  // The welcome email is now sent by the server when the profile is first created.
  /** Associate the loaded profile and subscription tier with the PostHog user. */
  function identify(data: Profile) {
    posthog.identify(data.id, {
      email: data.email,
      name: data.full_name,
      role: data.role,
      plan: data.subscription_tier ?? "free",
    });
  }

  function signIn() {
    window.location.href = "/auth";
  }

  function signUp() {
    window.location.href = "/auth?signup=true";
  }

  async function signOut() {
    await clerk.signOut();
    posthog.reset();
    setProfile(null);
  }

  const user: AuthUser | null =
    isSignedIn && userId ? { id: userId, email: userEmail } : null;

  const loading = !isLoaded || (!!isSignedIn && profileLoading);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!isSignedIn,
        isTeacher: profile?.role === "teacher",
        isStudent: profile?.role === "student",
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { supabase } from "@/services/supabaseClient";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const userId = clerkUser?.id ?? null;
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;

  // Fetch (or create) profile when Clerk user changes
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    fetchOrCreateProfile(userId);
  }, [isLoaded, isSignedIn, userId]);

  // Listen for profile changes (subscription updates from Stripe webhook)
  useEffect(() => {
    if (!supabase || !profile?.id) return;

    const channel = supabase
      .channel(`profile:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rt_profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const newProfile = payload.new as Profile;
          if (newProfile.subscription_tier !== profile.subscription_tier) {
            fetchOrCreateProfile(profile.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.subscription_tier]);

  async function fetchOrCreateProfile(uid: string) {
    if (!supabase) { setProfileLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("rt_profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist yet -- create one for new Clerk user
        const storedRole = localStorage.getItem("roundtaible_signup_role") as "teacher" | "student" | null;
        const role = storedRole || "student";
        const fullName = clerkUser?.fullName || clerkUser?.firstName || "";
        const email = clerkUser?.primaryEmailAddress?.emailAddress || "";

        const { data: newProfile } = await supabase
          .from("rt_profiles")
          .insert({
            id: uid,
            email,
            full_name: fullName,
            role,
            subscription_tier: "free",
            subscription_status: "active",
          })
          .select()
          .single();

        if (newProfile) {
          localStorage.removeItem("roundtaible_signup_role");
          setProfile(newProfile as Profile);
          identifyAndWelcome(uid, newProfile as Profile, true);
          return;
        }
        setProfile(null);
        return;
      }

      if (error) {
        setProfile(null);
        return;
      }

      setProfile(data as Profile);
      if (data) {
        identifyAndWelcome(uid, data as Profile, false);
      }
    } catch (_err) {
      // Silent fail -- non-critical error
    } finally {
      setProfileLoading(false);
    }
  }

  function identifyAndWelcome(uid: string, data: Profile, isNew: boolean) {
    posthog.identify(uid, {
      email: data.email,
      name: data.full_name,
      role: data.role,
      plan: data.subscription_tier ?? "free",
    });

    // Fire welcome email for newly created profiles
    const shouldWelcome =
      isNew ||
      (data.subscription_tier === "free" &&
        (data as Record<string, unknown>).created_at &&
        Date.now() - new Date((data as Record<string, unknown>).created_at as string).getTime() < 30_000);

    if (shouldWelcome) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email: data.email,
          name: data.full_name,
          role: data.role,
        }),
      }).catch(() => {
        // Fire and forget -- do not block auth on email failure
      });
    }
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

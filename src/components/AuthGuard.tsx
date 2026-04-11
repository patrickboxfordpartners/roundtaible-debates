import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "teacher" | "student";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, profile, loading } = useAuth();
  const [searchParams] = useSearchParams();

  // Allow demo mode to bypass auth
  if (searchParams.get("demo") === "true") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return <>{children}</>;
}

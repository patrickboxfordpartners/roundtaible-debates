import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DebateModeProvider } from "@/contexts/DebateModeContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";

const Landing = lazy(() => import("./pages/Landing"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Auth = lazy(() => import("./pages/Auth"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ClassView = lazy(() => import("./pages/ClassView"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground font-body">Loading...</div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
  <AuthProvider>
    <DebateModeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<ErrorBoundary><Index /></ErrorBoundary>} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/teacher"
              element={
                <AuthGuard requiredRole="teacher">
                  <TeacherDashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/student"
              element={
                <AuthGuard requiredRole="student">
                  <StudentDashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/class/:classId"
              element={
                <AuthGuard>
                  <ClassView />
                </AuthGuard>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </DebateModeProvider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;

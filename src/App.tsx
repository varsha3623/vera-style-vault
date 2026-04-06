import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import AppShell from "@/components/AppShell";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Wardrobe from "@/pages/Wardrobe";
import Outfits from "@/pages/Outfits";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Preferences from "@/pages/Preferences";
import Contact from "@/pages/Contact";
import Reviews from "@/pages/Reviews";
import Wishlist from "@/pages/Wishlist";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/onboarding" element={
        !isAuthenticated ? <Navigate to="/login" replace /> :
        user?.onboarded ? <Navigate to="/" replace /> :
        <Onboarding />
      } />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/wardrobe" element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
      <Route path="/outfits" element={<ProtectedRoute><Outfits /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

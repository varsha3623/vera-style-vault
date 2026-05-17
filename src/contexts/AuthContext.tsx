import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SupaUser } from '@supabase/supabase-js';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarded: boolean;
}

interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  onboarded: boolean;
}

interface AuthContextType {
  user: SafeUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  markOnboarded: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toSafe(u: SupaUser, profile: Profile | null): SafeUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: profile?.display_name ?? u.user_metadata?.display_name ?? (u.email?.split('@')[0] ?? 'You'),
    avatar: profile?.avatar_url ?? undefined,
    onboarded: profile?.onboarded ?? false,
  };
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    if (!s?.user) { setUser(null); return; }
    const profile = await loadProfile(s.user.id);
    setUser(toSafe(s.user, profile));
  };

  useEffect(() => {
    // Listener first
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer DB calls outside the auth callback
      setTimeout(() => { hydrate(s); }, 0);
    });
    // Then initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      hydrate(s).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signup = async (name: string, email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { display_name: name } },
    });
    return error?.message ?? null;
  };

  const logout = async () => { await supabase.auth.signOut(); };

  const markOnboarded = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);
    setUser({ ...user, onboarded: true });
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    const profile = await loadProfile(session.user.id);
    setUser(toSafe(session.user, profile));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, markOnboarded, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, type User } from '@/lib/storage';

// Safe user type without password hash exposed to components
type SafeUser = Omit<User, 'passwordHash'>;

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  markOnboarded: () => void;
  refreshUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'vera_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface SessionRecord {
  email: string;
  issuedAt: number;
  expiresAt: number;
}

function readSession(): SessionRecord | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionRecord;
    if (!parsed?.email || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(email: string) {
  const now = Date.now();
  const record: SessionRecord = {
    email,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(record));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function toSafeUser(u: User): SafeUser {
  const { passwordHash: _, ...safe } = u;
  return safe;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const restore = useCallback(() => {
    // Prefer hardened session record; fall back to legacy current-user key.
    const session = readSession();
    const email = session?.email || storage.getCurrentUser();
    if (email) {
      const u = storage.findUser(email);
      if (u) {
        setUser(toSafeUser(u));
        // Promote legacy session into new format.
        if (!session) writeSession(email);
      } else {
        clearSession();
        storage.logout();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    const session = readSession();
    const email = session?.email || storage.getCurrentUser();
    if (email) {
      const u = storage.findUser(email);
      if (u) setUser(toSafeUser(u));
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  // Cross-tab session sync: react if another tab logs in/out.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === 'vera_current_user') {
        restore();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [restore]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const u = storage.findUser(email);
    if (!u) return 'No account found with this email';
    const valid = await storage.verifyPassword(u, password);
    if (!valid) return 'Incorrect password';
    storage.setCurrentUser(email);
    writeSession(email);
    setUser(toSafeUser(u));
    return null;
  };

  const signup = async (name: string, email: string, password: string): Promise<string | null> => {
    if (storage.findUser(email)) return 'An account with this email already exists';
    await storage.addUser(name, email, password);
    storage.setCurrentUser(email);
    writeSession(email);
    const newUser = storage.findUser(email);
    if (newUser) setUser(toSafeUser(newUser));
    return null;
  };

  const markOnboarded = () => {
    if (user) {
      storage.markOnboarded(user.email);
      setUser({ ...user, onboarded: true });
    }
  };

  const logout = () => {
    storage.logout();
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, markOnboarded, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

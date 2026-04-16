import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, type User } from '@/lib/storage';

// Safe user type without password hash exposed to components
type SafeUser = Omit<User, 'passwordHash'>;

interface AuthContextType {
  user: SafeUser | null;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  markOnboarded: () => void;
  refreshUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toSafeUser(u: User): SafeUser {
  const { passwordHash: _, ...safe } = u;
  return safe;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);

  const refreshUser = useCallback(() => {
    const email = storage.getCurrentUser();
    if (email) {
      const u = storage.findUser(email);
      if (u) setUser(toSafeUser(u));
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const u = storage.findUser(email);
    if (!u) return 'No account found with this email';
    const valid = await storage.verifyPassword(u, password);
    if (!valid) return 'Incorrect password';
    storage.setCurrentUser(email);
    setUser(toSafeUser(u));
    return null;
  };

  const signup = async (name: string, email: string, password: string): Promise<string | null> => {
    if (storage.findUser(email)) return 'An account with this email already exists';
    await storage.addUser(name, email, password);
    storage.setCurrentUser(email);
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, markOnboarded, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { storage, type User } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string) => string | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const email = storage.getCurrentUser();
    if (email) {
      const u = storage.findUser(email);
      if (u) setUser(u);
    }
  }, []);

  const login = (email: string, password: string): string | null => {
    const u = storage.findUser(email);
    if (!u) return 'No account found with this email';
    if (u.password !== password) return 'Incorrect password';
    storage.setCurrentUser(email);
    setUser(u);
    return null;
  };

  const signup = (name: string, email: string, password: string): string | null => {
    if (storage.findUser(email)) return 'An account with this email already exists';
    const newUser: User = { name, email, password, onboarded: false };
    storage.addUser(newUser);
    storage.setCurrentUser(email);
    setUser(newUser);
    return null;
  };

  const logout = () => {
    storage.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

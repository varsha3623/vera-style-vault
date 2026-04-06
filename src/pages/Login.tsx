import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(email, password);
    if (err) setError(err);
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold tracking-wide text-gold-gradient">VÉRA</h1>
          <p className="text-muted-foreground mt-2 font-body text-sm tracking-widest uppercase">AI Personal Styling</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-lg tracking-wide uppercase text-sm hover:opacity-90 transition-opacity shadow-luxury"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8 font-body">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}

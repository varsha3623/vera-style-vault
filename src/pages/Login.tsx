import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX feel
    setTimeout(() => {
      const err = login(email, password);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/');
      }
    }, 300);
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
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 text-center animate-scale-in font-body">
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
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl tracking-wide uppercase text-sm hover:opacity-90 transition-opacity shadow-luxury disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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

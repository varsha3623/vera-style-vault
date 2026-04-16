import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Passwords match', ok: password.length > 0 && password === confirm },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setTimeout(() => {
      const err = signup(name, email, password);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/onboarding');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold tracking-wide text-gold-gradient">VÉRA</h1>
          <p className="text-muted-foreground mt-2 font-body text-sm tracking-widest uppercase">Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 text-center animate-scale-in font-body">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="Your name" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="your@email.com" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Confirm Password</label>
            <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="••••••••" />
          </div>

          {/* Password strength indicators */}
          {password.length > 0 && (
            <div className="space-y-1">
              {passwordChecks.map(check => (
                <div key={check.label} className="flex items-center gap-2">
                  {check.ok ? <Check size={12} className="text-accent" /> : <X size={12} className="text-muted-foreground" />}
                  <span className={`font-body text-[11px] ${check.ok ? 'text-accent' : 'text-muted-foreground'}`}>{check.label}</span>
                </div>
              ))}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl tracking-wide uppercase text-sm hover:opacity-90 transition-opacity shadow-luxury disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8 font-body">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

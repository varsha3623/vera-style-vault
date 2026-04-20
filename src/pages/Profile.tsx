import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { Settings, LogOut, Heart, Shirt, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const email = user?.email || '';
  const prefs = storage.getPreferences(email);
  const wardrobe = storage.getWardrobe(email);
  const outfits = storage.getOutfits(email);
  const wishlist = storage.getWishlist(email) || [];

  const initial = user?.name?.charAt(0).toUpperCase() || 'V';

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in pb-12">
      {/* Hero card with glass + gold hairline */}
      <div className="relative rounded-3xl overflow-hidden shadow-luxury border border-border/40 mb-6"
        style={{
          background:
            'radial-gradient(120% 100% at 30% 0%, hsl(var(--burgundy-light)/0.45) 0%, hsl(var(--burgundy)/0.65) 50%, hsl(var(--espresso)/0.9) 100%)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px gold-hairline" />
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(60% 50% at 70% 20%, hsl(var(--gold)/0.4) 0%, transparent 60%)' }} />

        <div className="relative px-5 pt-7 pb-5 flex flex-col items-center text-center">
          <span className="font-display text-[10px] tracking-[0.4em] text-[hsl(var(--gold-light))] mb-3">VÉRA · MEMBER</span>

          <div className="relative mb-3">
            <div className="absolute -inset-1.5 rounded-full gold-gradient opacity-70 blur-md" />
            <div className="relative w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-luxury ring-2 ring-[hsl(var(--gold-light)/0.4)]">
              <span className="text-primary font-display font-bold text-2xl">{initial}</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-[hsl(var(--cream))]">{user?.name}</h1>
          <p className="font-body text-xs text-[hsl(var(--cream)/0.7)] mt-0.5">{user?.email}</p>

          <div className="h-px w-12 bg-[hsl(var(--gold)/0.5)] my-3" />

          {prefs?.style && (
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--gold-light)/0.85)]">
              {prefs.style} · {prefs.lifestyle}
            </p>
          )}
        </div>
        <div className="h-1 gold-gradient opacity-60" />
      </div>

      {/* Stat trio with glassmorphism */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pieces', value: wardrobe.length, icon: Shirt },
          { label: 'Outfits', value: outfits.length, icon: Sparkles },
          { label: 'Saved', value: wishlist.length, icon: Heart },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative rounded-2xl p-4 text-center glass-bubble shadow-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px gold-hairline opacity-60" />
              <Icon size={14} className="text-accent mx-auto mb-1.5" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Preferences summary card */}
      {prefs && (
        <div className="relative rounded-2xl p-5 glass-bubble shadow-card mb-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px gold-hairline" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-foreground tracking-wide">Style Profile</h2>
            <Link to="/preferences" className="font-body text-[10px] uppercase tracking-widest text-accent hover:text-[hsl(var(--gold-dark))] transition-colors">
              Edit
            </Link>
          </div>
          <div>
            {[
              { label: 'Location', value: prefs.location || '—' },
              { label: 'Lifestyle', value: prefs.lifestyle },
              { label: 'Style', value: prefs.style },
              { label: 'Sleeveless', value: prefs.restrictions.sleevelessAllowed ? 'Allowed' : 'Not allowed' },
              { label: 'Short outfits', value: prefs.restrictions.shortOutfitsAllowed ? 'Allowed' : 'Not allowed' },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-body text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  <span className="font-body text-sm text-foreground capitalize">{item.value}</span>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-border/40" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/preferences" className="relative rounded-2xl p-4 glass-bubble shadow-card flex items-center gap-3 hover:border-accent/40 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px gold-hairline opacity-60" />
          <Settings size={16} className="text-accent" />
          <span className="font-body text-xs font-medium text-foreground">Preferences</span>
        </Link>
        <button onClick={() => logout()} className="relative rounded-2xl p-4 glass-bubble shadow-card flex items-center gap-3 hover:border-destructive/40 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px gold-hairline opacity-60" />
          <LogOut size={16} className="text-destructive" />
          <span className="font-body text-xs font-medium text-foreground">Sign out</span>
        </button>
      </div>
    </div>
  );
}

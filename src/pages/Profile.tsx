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
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in pb-12 space-y-6">
      {/* Editorial hero card with arched image */}
      <div className="relative bg-cream rounded-3xl overflow-hidden shadow-arch border border-border/40">
        {/* Top arched portrait area */}
        <div className="relative h-44 nude-gradient overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=85&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cream/0 to-cream" />
        </div>

        <div className="relative -mt-14 px-6 pb-7 flex flex-col items-center text-center">
          {/* Soft avatar disc */}
          <div className="w-24 h-24 rounded-full bg-cream border border-border/60 shadow-soft flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full nude-gradient flex items-center justify-center">
              <span className="font-display text-3xl italic font-medium text-foreground">{initial}</span>
            </div>
          </div>

          <p className="font-body text-[10px] uppercase tracking-[0.4em] text-taupe mb-1.5">VÉRA · Member</p>
          <h1 className="font-display text-3xl font-light italic text-foreground">{user?.name}</h1>
          <p className="font-body text-[11px] text-muted-foreground mt-1">{user?.email}</p>

          <div className="h-px w-12 bg-nude-deep/50 my-4" />

          {prefs?.style && (
            <p className="font-body text-[10px] uppercase tracking-[0.3em] text-taupe">
              {prefs.style} · {prefs.lifestyle}
            </p>
          )}
        </div>
      </div>

      {/* Stat trio */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pieces', value: wardrobe.length, icon: Shirt },
          { label: 'Looks', value: outfits.length, icon: Sparkles },
          { label: 'Saved', value: wishlist.length, icon: Heart },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-cream rounded-2xl p-4 text-center border border-border/40 shadow-card">
              <Icon size={14} className="text-taupe mx-auto mb-2" strokeWidth={1.5} />
              <p className="font-display text-2xl font-light italic text-foreground">{stat.value}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Style profile */}
      {prefs && (
        <div className="bg-cream rounded-3xl p-6 border border-border/40 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.3em] text-taupe">Style profile</p>
              <h2 className="font-display text-xl italic font-light text-foreground mt-1">Your taste</h2>
            </div>
            <Link to="/preferences" className="font-body text-[10px] uppercase tracking-[0.25em] text-foreground italic hover:text-taupe transition-colors">
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
                <div className="flex justify-between items-center py-3">
                  <span className="font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{item.label}</span>
                  <span className="font-display text-sm italic text-foreground capitalize">{item.value}</span>
                </div>
                {i < arr.length - 1 && <div className="h-px bg-border/50" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/preferences" className="bg-cream rounded-full p-4 border border-border/40 shadow-card flex items-center justify-center gap-2.5 hover:bg-nude-soft transition-colors">
          <Settings size={15} className="text-taupe" strokeWidth={1.5} />
          <span className="font-body text-xs text-foreground tracking-wide">Preferences</span>
        </Link>
        <button onClick={() => logout()} className="bg-cream rounded-full p-4 border border-border/40 shadow-card flex items-center justify-center gap-2.5 hover:bg-destructive/5 transition-colors">
          <LogOut size={15} className="text-destructive" strokeWidth={1.5} />
          <span className="font-body text-xs text-foreground tracking-wide">Sign out</span>
        </button>
      </div>
    </div>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';

export default function Profile() {
  const { user } = useAuth();
  const prefs = storage.getPreferences();
  const wardrobe = storage.getWardrobe();
  const outfits = storage.getOutfits();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-3 shadow-luxury">
          <span className="text-primary font-display font-bold text-2xl">{user?.name?.charAt(0) || 'V'}</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{user?.name}</h1>
        <p className="font-body text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Items', value: wardrobe.length },
          { label: 'Outfits', value: outfits.length },
          { label: 'Style', value: prefs?.style || '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-xl p-4 text-center shadow-card border border-border/50">
            <p className="font-display text-lg font-bold text-foreground">{stat.value}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {prefs && (
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-3">
          <h2 className="font-display text-sm font-bold text-foreground mb-3">Your Preferences</h2>
          {[
            { label: 'Location', value: prefs.location },
            { label: 'Lifestyle', value: prefs.lifestyle },
            { label: 'Style', value: prefs.style },
            { label: 'Sleeveless', value: prefs.restrictions.sleevelessAllowed ? 'Allowed' : 'Not allowed' },
            { label: 'Short outfits', value: prefs.restrictions.shortOutfitsAllowed ? 'Allowed' : 'Not allowed' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <span className="font-body text-xs text-muted-foreground">{item.label}</span>
              <span className="font-body text-sm text-foreground capitalize">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

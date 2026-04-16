import { useState } from 'react';
import { storage, type UserPreferences } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Briefcase, Palette, Shield, Save } from 'lucide-react';

export default function Preferences() {
  const { user } = useAuth();
  const existing = storage.getPreferences();
  const [location, setLocation] = useState(existing?.location || '');
  const [lifestyle, setLifestyle] = useState<UserPreferences['lifestyle']>(existing?.lifestyle || 'corporate');
  const [style, setStyle] = useState<UserPreferences['style']>(existing?.style || 'elegant');
  const [sleevelessAllowed, setSleevelessAllowed] = useState(existing?.restrictions.sleevelessAllowed ?? true);
  const [shortAllowed, setShortAllowed] = useState(existing?.restrictions.shortOutfitsAllowed ?? true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const prefs: UserPreferences = {
      location,
      lifestyle,
      style,
      restrictions: { sleevelessAllowed, shortOutfitsAllowed: shortAllowed },
    };
    storage.setPreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">Preferences</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">Update your styling preferences</p>

      <div className="space-y-4">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-accent" />
            <h3 className="font-display text-sm font-bold text-foreground">Location</h3>
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Your city"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent/50" />
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={16} className="text-accent" />
            <h3 className="font-display text-sm font-bold text-foreground">Lifestyle</h3>
          </div>
          <div className="flex gap-2">
            {(['student', 'corporate', 'other'] as const).map(l => (
              <button key={l} onClick={() => setLifestyle(l)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-body font-medium capitalize transition-all ${
                  lifestyle === l ? 'gold-gradient text-primary' : 'bg-background border border-border text-foreground hover:border-accent/40'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-accent" />
            <h3 className="font-display text-sm font-bold text-foreground">Style</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['casual', 'elegant', 'trendy', 'minimal'] as const).map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`py-2.5 rounded-xl text-xs font-body font-medium capitalize transition-all ${
                  style === s ? 'gold-gradient text-primary' : 'bg-background border border-border text-foreground hover:border-accent/40'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-accent" />
            <h3 className="font-display text-sm font-bold text-foreground">Restrictions</h3>
          </div>
          {[
            { label: 'Sleeveless outfits', value: sleevelessAllowed, onChange: setSleevelessAllowed },
            { label: 'Short outfits', value: shortAllowed, onChange: setShortAllowed },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between py-3">
              <span className="font-body text-sm text-foreground">{t.label}</span>
              <button onClick={() => t.onChange(!t.value)}
                className={`w-12 h-7 rounded-full transition-all relative ${t.value ? 'bg-accent' : 'bg-muted'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow-sm transition-transform ${t.value ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 gold-gradient text-primary font-body font-semibold py-3.5 rounded-xl text-sm shadow-luxury hover:opacity-90 transition-opacity">
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

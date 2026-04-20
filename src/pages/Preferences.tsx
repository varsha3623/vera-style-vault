import { useState } from 'react';
import { storage, type UserPreferences } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Briefcase, Palette, Shield, Save, Check } from 'lucide-react';

export default function Preferences() {
  const { user } = useAuth();
  const email = user?.email || '';
  const existing = storage.getPreferences(email);
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
    storage.setPreferences(email, prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in pb-12">
      <div className="mb-5">
        <p className="font-display text-[10px] tracking-[0.35em] text-accent/80 uppercase mb-1">Atelier</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Preferences</h1>
        <p className="font-body text-xs text-muted-foreground mt-1">Tune VÉRA's recommendations to your taste</p>
      </div>

      <div className="space-y-3">
        <PreferenceCard icon={MapPin} title="Location">
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Your city"
            className="w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
          />
        </PreferenceCard>

        <PreferenceCard icon={Briefcase} title="Lifestyle">
          <div className="flex gap-2">
            {(['student', 'corporate', 'other'] as const).map(l => (
              <ChoiceChip key={l} active={lifestyle === l} onClick={() => setLifestyle(l)} label={l} />
            ))}
          </div>
        </PreferenceCard>

        <PreferenceCard icon={Palette} title="Style">
          <div className="grid grid-cols-2 gap-2">
            {(['casual', 'elegant', 'trendy', 'minimal'] as const).map(s => (
              <ChoiceChip key={s} active={style === s} onClick={() => setStyle(s)} label={s} />
            ))}
          </div>
        </PreferenceCard>

        <PreferenceCard icon={Shield} title="Restrictions">
          {[
            { label: 'Sleeveless outfits', value: sleevelessAllowed, onChange: setSleevelessAllowed },
            { label: 'Short outfits', value: shortAllowed, onChange: setShortAllowed },
          ].map((t, i, arr) => (
            <div key={t.label}>
              <div className="flex items-center justify-between py-3">
                <span className="font-body text-sm text-foreground">{t.label}</span>
                <button
                  onClick={() => t.onChange(!t.value)}
                  className={`w-12 h-7 rounded-full transition-all relative ${t.value ? 'gold-gradient shadow-gold' : 'bg-muted'}`}
                  aria-pressed={t.value}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow-sm transition-all duration-300 ${t.value ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {i < arr.length - 1 && <div className="h-px bg-border/40" />}
            </div>
          ))}
        </PreferenceCard>

        <button
          onClick={handleSave}
          className={`relative w-full flex items-center justify-center gap-2 font-body font-semibold py-3.5 rounded-2xl text-sm shadow-luxury transition-all overflow-hidden ${
            saved ? 'bg-accent text-accent-foreground' : 'gold-gradient text-primary hover:opacity-95'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
          {saved ? <><Check size={16} />Saved</> : <><Save size={16} />Save Preferences</>}
        </button>
      </div>
    </div>
  );
}

function PreferenceCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl p-5 glass-bubble shadow-card overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px gold-hairline" />
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-accent" />
        <h3 className="font-display text-xs font-bold text-foreground tracking-widest uppercase">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ChoiceChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-xs font-body font-medium capitalize transition-all duration-300 ${
        active
          ? 'gold-gradient text-primary shadow-gold'
          : 'bg-background/60 border border-border text-foreground hover:border-accent/40'
      }`}
    >
      {label}
    </button>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { storage, type UserPreferences } from '@/lib/storage';
import { MapPin, Briefcase, Palette, Shield, ChevronRight, ChevronLeft } from 'lucide-react';

const steps = [
  { key: 'Location', icon: MapPin, desc: 'Where are you based?' },
  { key: 'Lifestyle', icon: Briefcase, desc: 'What describes your day?' },
  { key: 'Style', icon: Palette, desc: 'What\'s your vibe?' },
  { key: 'Restrictions', icon: Shield, desc: 'Any preferences?' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState('');
  const [lifestyle, setLifestyle] = useState<UserPreferences['lifestyle']>('corporate');
  const [style, setStyle] = useState<UserPreferences['style']>('elegant');
  const [sleevelessAllowed, setSleevelessAllowed] = useState(true);
  const [shortAllowed, setShortAllowed] = useState(true);
  const { markOnboarded } = useAuth();
  const navigate = useNavigate();

  const next = () => step < 3 ? setStep(step + 1) : finish();
  const back = () => step > 0 && setStep(step - 1);

  const finish = () => {
    const prefs: UserPreferences = {
      location,
      lifestyle,
      style,
      restrictions: { sleevelessAllowed, shortOutfitsAllowed: shortAllowed },
    };
    storage.setPreferences(prefs);
    markOnboarded();
    navigate('/');
  };

  const lifestyleOptions = [
    { value: 'student' as const, label: 'Student', emoji: '📚', desc: 'Campus & social life' },
    { value: 'corporate' as const, label: 'Corporate', emoji: '💼', desc: 'Office & professional' },
    { value: 'other' as const, label: 'Other', emoji: '✨', desc: 'Freelance, creative & more' },
  ];

  const styleOptions = [
    { value: 'casual' as const, label: 'Casual', emoji: '👟', desc: 'Relaxed & comfortable' },
    { value: 'elegant' as const, label: 'Elegant', emoji: '🥂', desc: 'Refined & sophisticated' },
    { value: 'trendy' as const, label: 'Trendy', emoji: '🔥', desc: 'Fashion-forward looks' },
    { value: 'minimal' as const, label: 'Minimal', emoji: '🤍', desc: 'Clean & simple' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gold-gradient">Style Assessment</h1>
          <p className="text-muted-foreground mt-2 font-body text-sm">Help VÉRA understand your style</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'gold-gradient' : 'bg-muted'}`} />
              <div className="flex items-center justify-center gap-1 mt-2">
                <s.icon size={10} className={i <= step ? 'text-accent' : 'text-muted-foreground'} />
                <p className={`text-[10px] font-body ${i <= step ? 'text-accent font-medium' : 'text-muted-foreground'}`}>{s.key}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="min-h-[280px]">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-3">
                  <MapPin size={24} className="text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Your Location</h2>
                <p className="font-body text-xs text-muted-foreground mt-1">We'll use this for weather-based styling</p>
              </div>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g., New York, London, Mumbai"
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={24} className="text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Your Lifestyle</h2>
              </div>
              {lifestyleOptions.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLifestyle(l.value)}
                  className={`w-full flex items-center gap-4 py-3.5 px-5 rounded-xl border font-body text-sm transition-all ${
                    lifestyle === l.value
                      ? 'border-accent bg-accent/10 shadow-card'
                      : 'border-border bg-card hover:border-accent/40'
                  }`}
                >
                  <span className="text-2xl">{l.emoji}</span>
                  <div className="text-left">
                    <p className={`font-medium ${lifestyle === l.value ? 'text-accent' : 'text-foreground'}`}>{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-3">
                  <Palette size={24} className="text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Your Style</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center gap-2 py-5 px-4 rounded-xl border font-body text-sm transition-all ${
                      style === s.value
                        ? 'border-accent bg-accent/10 shadow-card'
                        : 'border-border bg-card hover:border-accent/40'
                    }`}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <p className={`font-medium ${style === s.value ? 'text-accent' : 'text-foreground'}`}>{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-3">
                  <Shield size={24} className="text-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Preferences</h2>
                <p className="font-body text-xs text-muted-foreground mt-1">We'll respect these in recommendations</p>
              </div>
              {[
                { label: 'Sleeveless outfits', value: sleevelessAllowed, onChange: setSleevelessAllowed },
                { label: 'Short outfits', value: shortAllowed, onChange: setShortAllowed },
              ].map(toggle => (
                <div key={toggle.label} className="flex items-center justify-between py-4 px-5 rounded-xl border border-border bg-card">
                  <span className="font-body text-sm text-foreground">{toggle.label}</span>
                  <button
                    onClick={() => toggle.onChange(!toggle.value)}
                    className={`w-12 h-7 rounded-full transition-all relative ${toggle.value ? 'bg-accent' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-background shadow-sm transition-transform ${toggle.value ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={back} className="flex items-center justify-center gap-1 flex-1 border border-border py-3 rounded-xl font-body text-sm text-muted-foreground hover:bg-card transition-colors">
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <button
            onClick={next}
            disabled={step === 0 && !location}
            className="flex items-center justify-center gap-1 flex-1 gold-gradient text-primary font-body font-semibold py-3 rounded-xl tracking-wide uppercase text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-luxury"
          >
            {step === 3 ? 'Complete' : 'Continue'}
            {step < 3 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

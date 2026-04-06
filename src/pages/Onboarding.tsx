import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { storage, type UserPreferences } from '@/lib/storage';

const steps = ['Location', 'Lifestyle', 'Style', 'Restrictions'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState('');
  const [lifestyle, setLifestyle] = useState<UserPreferences['lifestyle']>('corporate');
  const [style, setStyle] = useState<UserPreferences['style']>('elegant');
  const [sleevelessAllowed, setSleevelessAllowed] = useState(true);
  const [shortAllowed, setShortAllowed] = useState(true);
  const { user } = useAuth();
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
    if (user) storage.markOnboarded(user.email);
    navigate('/');
  };

  const Option = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full py-3 px-5 rounded-lg border font-body text-sm transition-all ${
        selected
          ? 'border-accent bg-accent/10 text-accent font-medium shadow-card'
          : 'border-border bg-card text-foreground hover:border-accent/40'
      }`}
    >
      {label}
    </button>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 px-5 rounded-lg border border-border bg-card">
      <span className="font-body text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-accent' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );

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
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? 'gold-gradient' : 'bg-muted'}`} />
              <p className={`text-[10px] mt-1 font-body text-center ${i <= step ? 'text-accent' : 'text-muted-foreground'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 min-h-[240px]">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Your City</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g., New York, London, Mumbai"
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Lifestyle</label>
              {(['student', 'corporate', 'other'] as const).map(l => (
                <Option key={l} label={l.charAt(0).toUpperCase() + l.slice(1)} selected={lifestyle === l} onClick={() => setLifestyle(l)} />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Style Preference</label>
              {(['casual', 'elegant', 'trendy', 'minimal'] as const).map(s => (
                <Option key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} selected={style === s} onClick={() => setStyle(s)} />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <label className="text-xs font-body font-medium uppercase tracking-wider text-muted-foreground">Restrictions</label>
              <Toggle label="Sleeveless outfits allowed" value={sleevelessAllowed} onChange={setSleevelessAllowed} />
              <Toggle label="Short outfits allowed" value={shortAllowed} onChange={setShortAllowed} />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={back} className="flex-1 border border-border py-3 rounded-lg font-body text-sm text-muted-foreground hover:bg-card transition-colors">
              Back
            </button>
          )}
          <button
            onClick={next}
            disabled={step === 0 && !location}
            className="flex-1 gold-gradient text-primary font-body font-semibold py-3 rounded-lg tracking-wide uppercase text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-luxury"
          >
            {step === 3 ? 'Complete' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

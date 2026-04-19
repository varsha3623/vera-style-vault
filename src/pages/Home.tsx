import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOutfits } from '@/lib/recommendations';
import { getWeather, type WeatherData } from '@/lib/weather';
import { Calendar as CalendarIcon, Cloud, Sun, CloudRain, Snowflake, Wind, Plus, MapPin, Shirt, Sparkles, TrendingUp, CloudFog, CloudLightning } from 'lucide-react';

const WeatherIcon = ({ condition }: { condition: string }) => {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <CloudLightning className="text-accent" size={28} />;
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="text-accent" size={28} />;
  if (c.includes('snow')) return <Snowflake className="text-accent" size={28} />;
  if (c.includes('fog')) return <CloudFog className="text-accent" size={28} />;
  if (c.includes('cloud')) return <Cloud className="text-accent" size={28} />;
  if (c.includes('wind')) return <Wind className="text-accent" size={28} />;
  return <Sun className="text-accent" size={28} />;
};

export default function HomePage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData>({ temp: 24, condition: 'Clear', code: 0 });
  const [time, setTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const prefs = storage.getPreferences(email);
  const wardrobe = storage.getWardrobe(email);
  const events = storage.getEvents(email);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real weather via Open-Meteo (no API key). Tries GPS, falls back to preferences city.
  useEffect(() => {
    let cancelled = false;
    getWeather(prefs?.location).then(w => {
      if (!cancelled && w) setWeather(w);
    });
    return () => { cancelled = true; };
  }, [prefs?.location]);

  const outfits = useMemo(() =>
    generateOutfits(wardrobe, weather, prefs, undefined, 7),
    [wardrobe, weather, prefs]
  );

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  const handleAddEvent = () => {
    if (selectedDate && eventName) {
      storage.addEvent(email, { date: selectedDate, event: eventName, location: eventLocation });
      setShowEventForm(false);
      setEventName('');
      setEventLocation('');
    }
  };

  const formatDate = (day: number) => {
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${today.getFullYear()}-${m}-${d}`;
  };

  const clockPositions = Array.from({ length: 7 }, (_, i) => {
    const angle = (i * 360 / 7) - 90;
    const rad = (angle * Math.PI) / 180;
    return { x: 50 + 35 * Math.cos(rad), y: 50 + 35 * Math.sin(rad) };
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayIndex = today.getDay();

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-8">
      {/* Greeting + Weather */}
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">{greeting()}, {user?.name?.split(' ')[0] || 'there'}!</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Let's find your perfect outfit today</p>
      </div>

      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex-1 flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card border border-border/50">
          <WeatherIcon condition={weather.condition} />
          <div>
            <p className="font-display text-xl font-bold text-foreground">{weather.temp}°C</p>
            <p className="font-body text-[10px] text-muted-foreground">{weather.condition}</p>
          </div>
        </div>
        <div className="flex-1 p-4 bg-card rounded-2xl shadow-card border border-border/50 text-right">
          <p className="font-display text-xl font-bold text-foreground">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="font-body text-[10px] text-muted-foreground truncate">
            {prefs?.location || 'Set location'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {[
          { icon: Shirt, label: 'Wardrobe', path: '/wardrobe', count: wardrobe.length },
          { icon: Sparkles, label: 'Outfits', path: '/outfits', count: storage.getOutfits(email).length },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex-1 flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card border border-border/50 hover:shadow-luxury transition-shadow text-left"
          >
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
              <action.icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-body text-sm font-medium text-foreground">{action.label}</p>
              <p className="font-body text-[10px] text-muted-foreground">{action.count} {action.count === 1 ? 'item' : 'items'}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Outfit Clock */}
      <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Weekly Outfit Plan</h2>
        <div className="relative w-full aspect-square max-w-xs mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-luxury animate-pulse-gold">
              <div className="text-center">
                <p className="font-display text-xs font-bold text-primary">TODAY</p>
                <p className="font-body text-[10px] text-primary/70">{dayLabels[todayDayIndex]}</p>
              </div>
            </div>
          </div>

          {clockPositions.map((pos, i) => {
            const dayIdx = (todayDayIndex + i) % 7;
            const hasOutfit = outfits[i] && outfits[i].length > 0;
            return (
              <div
                key={i}
                className="absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={`w-full h-full rounded-xl border shadow-card flex items-center justify-center transition-transform hover:scale-110 ${
                  i === 0 ? 'border-accent bg-accent/10' : 'border-border bg-card'
                }`}>
                  {hasOutfit && outfits[i][0].image ? (
                    <img src={outfits[i][0].image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="text-center">
                      <p className="font-body text-[9px] text-muted-foreground">{dayLabels[dayIdx]}</p>
                      <p className="font-body text-[8px] text-muted-foreground/60">{hasOutfit ? `${outfits[i].length} pcs` : '—'}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">{currentMonth}</h2>
          <CalendarIcon size={18} className="text-muted-foreground" />
        </div>

        <div className="bg-card rounded-2xl shadow-card p-4 border border-border/50">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map(d => (
              <div key={d} className="text-center text-[10px] font-body text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day);
              const isToday = day === today.getDate();
              const hasEvent = events.some(e => e.date === dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => { setSelectedDate(dateStr); setShowEventForm(true); }}
                  className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-body transition-all ${
                    isToday ? 'gold-gradient text-primary font-bold' :
                    isSelected ? 'bg-accent/20 text-accent font-medium' :
                    'text-foreground hover:bg-muted'
                  }`}
                >
                  {day}
                  {hasEvent && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        </div>

        {showEventForm && (
          <div className="mt-3 p-4 bg-card rounded-xl border border-border shadow-card animate-scale-in">
            <p className="font-body text-xs text-muted-foreground mb-3">Add event for {selectedDate}</p>
            {storage.getEventForDate(email, selectedDate) && (
              <div className="mb-3 p-2 bg-accent/10 rounded-lg border border-accent/20">
                <p className="font-body text-xs text-accent">📌 {storage.getEventForDate(email, selectedDate)!.event}</p>
              </div>
            )}
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Event name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground font-body text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-accent/50" />
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
              <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowEventForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-body text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleAddEvent} disabled={!eventName.trim()} className="flex-1 py-2.5 rounded-xl gold-gradient text-primary text-xs font-body font-semibold disabled:opacity-50">
                <Plus size={12} className="inline mr-1" />Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Must-Have Wardrobe */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">Must-Have Essentials</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {['Classic White Shirt', 'Tailored Blazer', 'Little Black Dress', 'Quality Denim', 'Versatile Sneakers'].map((item, i) => (
            <div key={i} className="flex-shrink-0 w-28">
              <div className="w-28 h-36 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center shadow-card border border-border/30">
                <span className="font-body text-xs text-muted-foreground text-center px-2">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">Trending Looks</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {['Quiet Luxury', 'Old Money', 'Coastal Chic', 'Minimalist', 'Power Dressing'].map((trend, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="w-32 h-44 rounded-xl bg-gradient-to-br from-card to-secondary flex items-end shadow-card overflow-hidden border border-border/30">
                <div className="w-full p-3 glass">
                  <p className="font-body text-xs font-medium text-foreground">{trend}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

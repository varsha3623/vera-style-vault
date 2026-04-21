import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOutfits } from '@/lib/recommendations';
import { getWeather, type WeatherData } from '@/lib/weather';
import { Calendar as CalendarIcon, Plus, MapPin, Shirt, Sparkles, TrendingUp, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import LuxuryHero from '@/components/LuxuryHero';

// Curated luxury fashion imagery (Unsplash, royalty-free)
const ESSENTIALS = [
  { name: 'Classic White Shirt', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80&auto=format&fit=crop' },
  { name: 'Tailored Blazer',     img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80&auto=format&fit=crop' },
  { name: 'Little Black Dress',  img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80&auto=format&fit=crop' },
  { name: 'Quality Denim',       img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80&auto=format&fit=crop' },
  { name: 'Versatile Sneakers',  img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&auto=format&fit=crop' },
];

const TRENDS = [
  { name: 'Quiet Luxury',    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80&auto=format&fit=crop' },
  { name: 'Old Money',       img: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=500&q=80&auto=format&fit=crop' },
  { name: 'Coastal Chic',    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=80&auto=format&fit=crop' },
  { name: 'Minimalist',      img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80&auto=format&fit=crop' },
  { name: 'Power Dressing',  img: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=500&q=80&auto=format&fit=crop' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
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

  const currentMonthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const handleAddEvent = () => {
    if (selectedDate && eventName) {
      storage.addEvent(email, { date: selectedDate, event: eventName, location: eventLocation });
      setShowEventForm(false);
      setEventName('');
      setEventLocation('');
    }
  };

  const formatDate = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const yearRange = Array.from({ length: 12 }, (_, i) => today.getFullYear() - 5 + i);

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
      {/* Luxury 3D Hero */}
      <div className="animate-fade-in">
        <LuxuryHero
          name={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
          greeting="Today's Forecast"
          weather={weather}
          time={time}
          location={prefs?.location}
        />
        <p className="font-body text-xs text-muted-foreground mt-3 text-center italic">
          Let's curate your perfect look
        </p>
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

      {/* Calendar — collapsible */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => setCalendarOpen(o => !o)}
          aria-expanded={calendarOpen}
          className="w-full flex items-center justify-between p-4 bg-card rounded-2xl shadow-card border border-border/50 hover:shadow-luxury transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
              <CalendarIcon size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-bold text-foreground">{currentMonthLabel}</p>
              <p className="font-body text-[10px] text-muted-foreground">
                {events.length} {events.length === 1 ? 'event' : 'events'} planned
              </p>
            </div>
          </div>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform duration-300 ${calendarOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {calendarOpen && (
          <div className="mt-3 bg-card rounded-2xl shadow-card p-4 border border-border/50 animate-scale-in">
            {/* Month / Year navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goPrevMonth}
                aria-label="Previous month"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft size={18} className="text-foreground" />
              </button>

              <button
                onClick={() => setShowYearPicker(p => !p)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-display text-sm font-bold text-foreground">{MONTH_NAMES[viewMonth]}</span>
                <span className="font-body text-sm text-accent font-medium">{viewYear}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={goNextMonth}
                aria-label="Next month"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight size={18} className="text-foreground" />
              </button>
            </div>

            {showYearPicker ? (
              <div className="grid grid-cols-4 gap-2 animate-fade-in">
                {yearRange.map(y => (
                  <button
                    key={y}
                    onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                    className={`py-2 rounded-lg font-body text-sm transition-all ${
                      y === viewYear ? 'gold-gradient text-primary font-semibold' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
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
                    const isToday = isCurrentMonth && day === today.getDate();
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
              </>
            )}
          </div>
        )}

        {showEventForm && calendarOpen && (
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
          {ESSENTIALS.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-28">
              <div className="relative w-28 h-36 rounded-xl overflow-hidden shadow-card border border-border/30 group">
                <img
                  src={item.img}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="font-body text-[10px] font-medium text-white leading-tight">{item.name}</p>
                </div>
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
          {TRENDS.map((trend, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="relative w-32 h-44 rounded-xl overflow-hidden shadow-card border border-border/30 group">
                <img
                  src={trend.img}
                  alt={trend.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 glass">
                  <p className="font-body text-xs font-medium text-foreground">{trend.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

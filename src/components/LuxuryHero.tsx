import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import type { WeatherData } from '@/lib/weather';
import { MapPin } from 'lucide-react';

// Code-split the heavy 3D scene (three / @react-three/fiber / drei) into its own chunk.
// It only loads after the hero mounts, keeping the initial bundle lean for mobile.
const WeatherHero3D = lazy(() => import('./WeatherHero3D'));

function HeroSceneFallback() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Soft animated gold glow placeholder while the 3D scene loads */}
      <div
        className="absolute inset-0 opacity-60 animate-pulse"
        style={{
          background:
            'radial-gradient(50% 40% at 70% 25%, hsl(var(--gold)/0.45) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

type Props = {
  name: string;
  greeting: string;
  weather: WeatherData;
  time: Date;
  location?: string;
};

/**
 * Luxury full-bleed hero featuring a 3D weather scene with pointer parallax,
 * soft burgundy radial wash, and a glassmorphism greeting card.
 */
export default function LuxuryHero({ name, greeting, weather, time, location }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const handlePointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setParallax({ x, y });
    };
    const handleOrient = (e: DeviceOrientationEvent) => {
      // Map device tilt → small parallax range
      const x = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 60));
      const y = Math.max(-0.5, Math.min(0.5, (e.beta ?? 0) / 90 - 0.3));
      setParallax({ x, y });
    };

    el.addEventListener('pointermove', handlePointer);
    window.addEventListener('deviceorientation', handleOrient);
    return () => {
      el.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('deviceorientation', handleOrient);
    };
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-72 rounded-3xl overflow-hidden shadow-luxury border border-border/40"
      style={{
        background:
          'radial-gradient(120% 100% at 30% 0%, hsl(var(--burgundy-light)/0.35) 0%, hsl(var(--burgundy)/0.55) 45%, hsl(var(--espresso)/0.85) 100%)',
      }}
    >
      {/* 3D scene layer — lazy-loaded to keep initial bundle small */}
      <Suspense fallback={<HeroSceneFallback />}>
        <WeatherHero3D weather={weather} parallax={parallax} />
      </Suspense>

      {/* Subtle gold grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
        style={{
          background:
            'radial-gradient(60% 50% at 70% 20%, hsl(var(--gold)/0.35) 0%, transparent 60%)',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Glass greeting card */}
      <div
        className="absolute left-4 right-4 bottom-4 rounded-2xl p-4 backdrop-blur-xl border border-white/15 animate-fade-in-up"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--cream)/0.18) 0%, hsl(var(--cream)/0.06) 100%)',
          boxShadow: '0 10px 40px -12px hsl(var(--espresso) / 0.6), inset 0 1px 0 hsl(var(--cream)/0.25)',
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-cream/70">{greeting}</p>
            <h1 className="font-display text-2xl font-semibold text-cream truncate mt-0.5">
              {name}
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={11} className="text-gold-light/80 flex-shrink-0" />
              <p className="font-body text-[11px] text-cream/70 truncate">
                {location || weather.city || 'Locating…'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display text-3xl font-bold text-cream leading-none">
              {weather.temp}°
            </p>
            <p className="font-body text-[10px] uppercase tracking-[0.18em] text-gold-light mt-1">
              {weather.condition}
            </p>
            <p className="font-body text-[10px] text-cream/60 mt-0.5">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* Top monogram */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="font-display text-[10px] tracking-[0.4em] text-gold-light/90">VÉRA</span>
        <span className="h-px w-6 bg-gold-light/40" />
      </div>
    </div>
  );
}

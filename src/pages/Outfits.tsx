import { useState, useMemo, useRef } from 'react';
import { storage, type WardrobeItem } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOutfits } from '@/lib/recommendations';
import { Heart, RefreshCw, Bookmark, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function OutfitsPage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [refresh, setRefresh] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exitDir, setExitDir] = useState<null | 'left' | 'right' | 'up'>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const wardrobe = storage.getWardrobe(email);
  const prefs = storage.getPreferences(email);
  const weather = { temp: 24, condition: 'Clear' };

  const outfits = useMemo(
    () => generateOutfits(wardrobe, weather, prefs, undefined, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wardrobe, prefs, refresh]
  );

  const handleSave = (items: WardrobeItem[], idx: number) => {
    storage.saveOutfit(email, {
      id: Date.now().toString(),
      items,
      date: new Date().toISOString(),
    });
    setSavedIds(prev => new Set(prev).add(idx));
    toast({ title: 'Saved to your looks', description: 'Find it in your wardrobe.' });
  };

  const handleLike = (idx: number) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const advance = (dir: 'left' | 'right' | 'up') => {
    setExitDir(dir);
    window.setTimeout(() => {
      setActiveIndex(i => Math.min(i + 1, outfits.length));
      setDrag({ x: 0, y: 0, active: false });
      setExitDir(null);
    }, 280);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || !drag.active) return;
    setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, active: true });
  };

  const onPointerUp = () => {
    if (!startRef.current) return;
    const { x, y } = drag;
    const threshold = 90;
    if (x > threshold) {
      handleSave(outfits[activeIndex], activeIndex);
      advance('right');
    } else if (x < -threshold) {
      advance('left');
    } else if (y < -threshold) {
      handleLike(activeIndex);
      advance('up');
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
    startRef.current = null;
  };

  const reset = () => {
    setActiveIndex(0);
    setSavedIds(new Set());
    setLikedIds(new Set());
    setRefresh(r => r + 1);
  };

  if (wardrobe.length === 0) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full glass-bubble mx-auto flex items-center justify-center mb-4 shadow-gold">
          <span className="font-display text-2xl text-gold-gradient">01</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">Your atelier is empty</h2>
        <p className="font-body text-sm text-muted-foreground">Add pieces to your wardrobe to receive curated looks.</p>
      </div>
    );
  }

  const remaining = outfits.length - activeIndex;
  const allDone = activeIndex >= outfits.length;

  return (
    <div className="relative px-4 py-6 max-w-lg mx-auto">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 -right-20 w-72 h-72 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-burgundy/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative flex items-end justify-between mb-2">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] text-accent uppercase mb-1">Curated · Today</p>
          <h1 className="font-display text-3xl font-semibold text-foreground tracking-tight">Looks</h1>
        </div>
        <button
          onClick={reset}
          aria-label="Refresh outfits"
          className="w-10 h-10 rounded-full glass-bubble flex items-center justify-center hover:border-accent/40 transition-colors"
        >
          <RefreshCw size={16} className="text-foreground" />
        </button>
      </div>
      <div className="relative h-px gold-hairline mb-6" />

      {/* Counter */}
      <div className="relative flex items-center justify-between mb-4 px-1">
        <span className="font-body text-xs text-muted-foreground tracking-wider">
          {allDone ? 'Atelier complete' : `${activeIndex + 1} / ${outfits.length}`}
        </span>
        <div className="flex gap-1">
          {outfits.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 rounded-full transition-all ${
                i < activeIndex ? 'w-2 bg-accent/60' : i === activeIndex ? 'w-6 bg-accent' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative h-[460px] perspective-[1200px]">
        {allDone ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center glass-bubble rounded-3xl animate-fade-in">
            <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mb-4 shadow-gold">
              <Check size={22} className="text-primary" strokeWidth={2.4} />
            </div>
            <h3 className="font-display text-xl text-foreground mb-1">All looks reviewed</h3>
            <p className="font-body text-sm text-muted-foreground mb-5">Saved {savedIds.size} · Liked {likedIds.size}</p>
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-full gold-gradient text-primary font-body text-sm font-semibold shadow-gold hover:scale-105 active:scale-95 transition-transform"
            >
              Curate again
            </button>
          </div>
        ) : (
          outfits.slice(activeIndex, activeIndex + 3).map((outfit, stackIdx) => {
            const realIdx = activeIndex + stackIdx;
            const isTop = stackIdx === 0;
            const rotate = isTop ? drag.x * 0.06 : 0;
            const exitX = exitDir === 'right' ? 600 : exitDir === 'left' ? -600 : 0;
            const exitY = exitDir === 'up' ? -700 : 0;
            const tx = isTop ? (exitDir ? exitX : drag.x) : 0;
            const ty = isTop ? (exitDir ? exitY : drag.y * 0.4) : 0;
            const scale = 1 - stackIdx * 0.04;
            const translateY = stackIdx * 12;
            const opacity = stackIdx === 2 ? 0.5 : 1;

            return (
              <div
                key={realIdx}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: `translate3d(${tx}px, ${ty + translateY}px, 0) rotate(${rotate}deg) scale(${scale})`,
                  transition: drag.active && isTop ? 'none' : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
                  zIndex: 10 - stackIdx,
                  opacity,
                  touchAction: 'none',
                  cursor: isTop ? (drag.active ? 'grabbing' : 'grab') : 'default',
                }}
              >
                <OutfitCard
                  items={outfit}
                  saved={savedIds.has(realIdx)}
                  liked={likedIds.has(realIdx)}
                  showSaveOverlay={isTop && drag.x > 40}
                  showSkipOverlay={isTop && drag.x < -40}
                  showLikeOverlay={isTop && drag.y < -40}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Action bar */}
      {!allDone && (
        <div className="relative mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => advance('left')}
            aria-label="Skip"
            className="w-12 h-12 rounded-full glass-bubble flex items-center justify-center hover:border-destructive/40 transition-colors active:scale-95"
          >
            <span className="font-display text-xl text-muted-foreground">×</span>
          </button>
          <button
            onClick={() => { handleLike(activeIndex); advance('up'); }}
            aria-label="Wear today"
            className="w-14 h-14 rounded-full burgundy-gradient flex items-center justify-center shadow-luxury hover:scale-105 active:scale-95 transition-transform"
          >
            <Heart
              size={20}
              className={likedIds.has(activeIndex) ? 'text-accent fill-accent' : 'text-accent'}
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => { handleSave(outfits[activeIndex], activeIndex); advance('right'); }}
            aria-label="Save look"
            className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center shadow-gold hover:scale-105 active:scale-95 transition-transform"
          >
            <Bookmark size={18} className="text-primary" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {!allDone && (
        <p className="relative text-center mt-3 font-body text-[11px] text-muted-foreground/80 tracking-wider">
          Swipe right to save · up to wear · left to skip
        </p>
      )}
    </div>
  );
}

function OutfitCard({
  items,
  saved,
  liked,
  showSaveOverlay,
  showSkipOverlay,
  showLikeOverlay,
}: {
  items: WardrobeItem[];
  saved: boolean;
  liked: boolean;
  showSaveOverlay: boolean;
  showSkipOverlay: boolean;
  showLikeOverlay: boolean;
}) {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden glass-bubble shadow-luxury select-none">
      {/* Decorative gold corner */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none">
        <div className="absolute top-3 right-3 w-12 h-px bg-accent/50" />
        <div className="absolute top-3 right-3 h-12 w-px bg-accent/50" />
      </div>

      {/* Item stage */}
      <div className="relative h-[72%] flex items-center justify-center bg-gradient-to-br from-secondary/40 via-cream/30 to-nude/40" style={{ perspective: '700px' }}>
        {items.map((item, j) => (
          <div
            key={item.id}
            className="absolute transition-transform duration-500"
            style={{
              transform: `translateZ(${j * 18}px) translateX(${(j - items.length / 2) * 38}px) translateY(${j * -6}px) rotateY(${(j - 1) * 4}deg)`,
              zIndex: j,
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.type}
                draggable={false}
                className="w-28 h-36 object-cover rounded-2xl shadow-shelf border border-gold/20"
              />
            ) : (
              <div className="w-28 h-36 rounded-2xl glass-bubble flex flex-col items-center justify-center">
                <span className="font-display text-xs text-gold-gradient tracking-wider">
                  {String(j + 1).padStart(2, '0')}
                </span>
                <span className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {item.type}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Swipe overlays */}
        {showSaveOverlay && (
          <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full gold-gradient text-primary font-body text-xs font-bold tracking-wider rotate-[-12deg] shadow-gold">
            SAVE
          </div>
        )}
        {showSkipOverlay && (
          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-foreground/80 text-background font-body text-xs font-bold tracking-wider rotate-[12deg]">
            SKIP
          </div>
        )}
        {showLikeOverlay && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full burgundy-gradient text-accent font-body text-xs font-bold tracking-wider shadow-luxury">
            WEAR
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="relative h-[28%] px-5 py-4 flex flex-col justify-between bg-card/60 backdrop-blur-xl border-t border-gold/15">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[10px] tracking-[0.25em] text-accent uppercase">Curated Look</p>
            <div className="flex gap-1">
              {saved && <span className="font-body text-[9px] text-accent tracking-wider uppercase">Saved</span>}
              {liked && <Heart size={11} className="text-accent fill-accent" />}
            </div>
          </div>
          <h3 className="font-display text-lg text-foreground leading-tight">
            {items.map(i => i.type).join(' · ')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 4).map(item => (
            <span
              key={item.id}
              className="font-body text-[10px] px-2 py-0.5 rounded-full bg-background/60 text-muted-foreground tracking-wider uppercase border border-border/40"
            >
              {item.color || item.type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

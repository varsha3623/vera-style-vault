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
        <div className="w-20 h-20 rounded-full nude-gradient mx-auto flex items-center justify-center mb-5 shadow-soft">
          <span className="font-display text-2xl italic text-foreground">01</span>
        </div>
        <h2 className="font-display text-2xl italic font-light text-foreground mb-2">Your atelier is empty</h2>
        <p className="font-body text-sm text-muted-foreground italic">Add pieces to your wardrobe to receive curated looks.</p>
      </div>
    );
  }

  const allDone = activeIndex >= outfits.length;

  return (
    <div className="relative px-4 py-6 max-w-lg mx-auto pb-10">
      {/* Editorial header */}
      <div className="text-center mb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-taupe mb-2">Curated for today</p>
        <h1 className="font-display text-3xl font-light italic text-foreground">Today's looks</h1>
        <button
          onClick={reset}
          aria-label="Refresh outfits"
          className="mx-auto mt-3 inline-flex items-center gap-1.5 text-xs font-body text-taupe hover:text-foreground transition-colors uppercase tracking-[0.25em]"
        >
          <RefreshCw size={12} strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between mb-5 px-1">
        <span className="font-body text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {allDone ? 'Atelier complete' : `${activeIndex + 1} of ${outfits.length}`}
        </span>
        <div className="flex gap-1">
          {outfits.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 rounded-full transition-all ${
                i < activeIndex ? 'w-2 bg-nude-deep/60' : i === activeIndex ? 'w-6 bg-foreground' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative h-[460px]">
        {allDone ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-cream rounded-3xl border border-border/40 shadow-card animate-fade-in">
            <div className="w-14 h-14 rounded-full nude-gradient flex items-center justify-center mb-4 shadow-soft">
              <Check size={20} className="text-foreground" strokeWidth={1.8} />
            </div>
            <h3 className="font-display text-2xl italic font-light text-foreground mb-1">All looks reviewed</h3>
            <p className="font-body text-xs text-muted-foreground mb-5 uppercase tracking-[0.2em]">Saved {savedIds.size} · Liked {likedIds.size}</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-full bg-foreground text-cream font-body text-xs uppercase tracking-[0.3em] hover:bg-taupe transition-colors"
            >
              Curate again
            </button>
          </div>
        ) : (
          outfits.slice(activeIndex, activeIndex + 3).map((outfit, stackIdx) => {
            const realIdx = activeIndex + stackIdx;
            const isTop = stackIdx === 0;
            const rotate = isTop ? drag.x * 0.05 : 0;
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
        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            onClick={() => advance('left')}
            aria-label="Skip"
            className="w-12 h-12 rounded-full bg-cream border border-border/50 flex items-center justify-center hover:border-destructive/40 transition-colors active:scale-95 shadow-soft"
          >
            <span className="font-display text-2xl text-muted-foreground italic">×</span>
          </button>
          <button
            onClick={() => { handleLike(activeIndex); advance('up'); }}
            aria-label="Wear today"
            className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center shadow-arch hover:bg-taupe active:scale-95 transition-all"
          >
            <Heart
              size={18}
              className={likedIds.has(activeIndex) ? 'text-cream fill-cream' : 'text-cream'}
              strokeWidth={1.8}
            />
          </button>
          <button
            onClick={() => { handleSave(outfits[activeIndex], activeIndex); advance('right'); }}
            aria-label="Save look"
            className="w-12 h-12 rounded-full nude-gradient flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-transform"
          >
            <Bookmark size={16} className="text-foreground" strokeWidth={1.8} />
          </button>
        </div>
      )}

      {!allDone && (
        <p className="text-center mt-3 font-body text-[10px] text-muted-foreground/80 uppercase tracking-[0.25em] italic">
          Swipe right to save · up to wear · left to skip
        </p>
      )}
    </div>
  );
}

function OutfitCard({
  items, saved, liked, showSaveOverlay, showSkipOverlay, showLikeOverlay,
}: {
  items: WardrobeItem[];
  saved: boolean;
  liked: boolean;
  showSaveOverlay: boolean;
  showSkipOverlay: boolean;
  showLikeOverlay: boolean;
}) {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cream border border-border/40 shadow-arch select-none">
      {/* Item stage */}
      <div className="relative h-[72%] flex items-center justify-center bg-gradient-to-br from-nude-soft via-cream to-sand/40" style={{ perspective: '700px' }}>
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
                className="w-28 h-36 object-cover rounded-2xl shadow-soft border border-border/50"
              />
            ) : (
              <div className="w-28 h-36 rounded-2xl bg-nude-soft border border-border/50 flex flex-col items-center justify-center">
                <span className="font-display text-base italic text-foreground">
                  {String(j + 1).padStart(2, '0')}
                </span>
                <span className="font-body text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">
                  {item.type}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Swipe overlays */}
        {showSaveOverlay && (
          <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full nude-gradient text-foreground font-body text-[10px] uppercase tracking-[0.3em] rotate-[-12deg] shadow-soft">
            Save
          </div>
        )}
        {showSkipOverlay && (
          <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-foreground text-cream font-body text-[10px] uppercase tracking-[0.3em] rotate-[12deg]">
            Skip
          </div>
        )}
        {showLikeOverlay && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-foreground text-cream font-body text-[10px] uppercase tracking-[0.3em] shadow-soft">
            Wear
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative h-[28%] px-5 py-4 flex flex-col justify-between bg-cream border-t border-border/40">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-body text-[10px] tracking-[0.3em] text-taupe uppercase">Curated look</p>
            <div className="flex gap-1.5">
              {saved && <span className="font-body text-[9px] text-taupe tracking-[0.25em] uppercase italic">Saved</span>}
              {liked && <Heart size={11} className="text-foreground fill-foreground" />}
            </div>
          </div>
          <h3 className="font-display text-lg italic font-light text-foreground leading-tight">
            {items.map(i => i.type).join(' · ')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 4).map(item => (
            <span
              key={item.id}
              className="font-body text-[10px] px-2.5 py-0.5 rounded-full bg-nude-soft text-foreground/70 tracking-wider uppercase border border-border/40"
            >
              {item.color || item.type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

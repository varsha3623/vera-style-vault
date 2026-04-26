import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { storage, type WardrobeItem } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOutfits } from '@/lib/recommendations';
import { Heart, RefreshCw, Bookmark, Check, X, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ---------- Spring physics ---------- */
type Spring = { x: number; y: number; vx: number; vy: number };
const SPRING_STIFFNESS = 0.18;
const SPRING_DAMPING = 0.72;

export default function OutfitsPage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [refresh, setRefresh] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exitDir, setExitDir] = useState<null | 'left' | 'right' | 'up'>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const springRef = useRef<Spring>({ x: 0, y: 0, vx: 0, vy: 0 });
  const rafRef = useRef<number | null>(null);

  const wardrobe = storage.getWardrobe(email);
  const prefs = storage.getPreferences(email);
  const weather = { temp: 24, condition: 'Clear' };

  const outfits = useMemo(
    () => generateOutfits(wardrobe, weather, prefs, undefined, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wardrobe, prefs, refresh]
  );

  /* ---------- Spring animation loop (used after release if not exiting) ---------- */
  const cancelSpring = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runSpringTo = useCallback((targetX: number, targetY: number, onDone?: () => void) => {
    cancelSpring();
    const tick = () => {
      const s = springRef.current;
      const ax = (targetX - s.x) * SPRING_STIFFNESS;
      const ay = (targetY - s.y) * SPRING_STIFFNESS;
      s.vx = (s.vx + ax) * SPRING_DAMPING;
      s.vy = (s.vy + ay) * SPRING_DAMPING;
      s.x += s.vx;
      s.y += s.vy;
      setDrag({ x: s.x, y: s.y, active: false });
      const settled = Math.abs(s.x - targetX) < 0.4 && Math.abs(s.y - targetY) < 0.4 && Math.abs(s.vx) < 0.4 && Math.abs(s.vy) < 0.4;
      if (settled) {
        s.x = targetX; s.y = targetY; s.vx = 0; s.vy = 0;
        setDrag({ x: targetX, y: targetY, active: false });
        rafRef.current = null;
        onDone?.();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelSpring(), []);

  const handleSave = (items: WardrobeItem[], idx: number) => {
    storage.saveOutfit(email, {
      id: Date.now().toString(),
      items,
      date: new Date().toISOString(),
    });
    setSavedIds(prev => new Set(prev).add(idx));
    toast({ title: 'Saved to your atelier', description: 'Find it in your saved looks.' });
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
    cancelSpring();
    setExitDir(dir);
    window.setTimeout(() => {
      setActiveIndex(i => Math.min(i + 1, outfits.length));
      springRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
      setDrag({ x: 0, y: 0, active: false });
      setExitDir(null);
    }, 360);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    cancelSpring();
    const t = performance.now();
    startRef.current = { x: e.clientX, y: e.clientY, t };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t };
    springRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    setDrag({ x: 0, y: 0, active: true });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || !drag.active) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDrag({ x: dx, y: dy, active: true });
  };

  const onPointerUp = () => {
    if (!startRef.current) return;
    const { x, y } = drag;
    const threshold = 100;
    // velocity-aware decision
    let vx = 0, vy = 0;
    if (lastMoveRef.current) {
      const dt = Math.max(8, performance.now() - (lastMoveRef.current.t - 16));
      vx = ((lastMoveRef.current.x - startRef.current.x) / dt) * 16; // px per frame
      vy = ((lastMoveRef.current.y - startRef.current.y) / dt) * 16;
    }
    springRef.current = { x, y, vx, vy };

    const flickRight = vx > 12;
    const flickLeft = vx < -12;
    const flickUp = vy < -14;

    if (x > threshold || flickRight) {
      handleSave(outfits[activeIndex], activeIndex);
      advance('right');
    } else if (x < -threshold || flickLeft) {
      advance('left');
    } else if (y < -threshold || flickUp) {
      handleLike(activeIndex);
      advance('up');
    } else {
      // Spring back to centre
      runSpringTo(0, 0);
    }
    startRef.current = null;
    lastMoveRef.current = null;
  };

  const reset = () => {
    cancelSpring();
    setActiveIndex(0);
    setSavedIds(new Set());
    setLikedIds(new Set());
    springRef.current = { x: 0, y: 0, vx: 0, vy: 0 };
    setDrag({ x: 0, y: 0, active: false });
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
  const dragRatio = Math.max(-1, Math.min(1, drag.x / 140));
  const liftRatio = Math.max(0, Math.min(1, -drag.y / 140));

  return (
    <div className="relative px-4 py-6 max-w-lg mx-auto pb-10">
      {/* Editorial header */}
      <div className="text-center mb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-taupe mb-2 inline-flex items-center gap-2 justify-center">
          <Sparkles size={11} className="text-gold" strokeWidth={1.5} />
          Curated for today
          <Sparkles size={11} className="text-gold" strokeWidth={1.5} />
        </p>
        <h1 className="font-display text-3xl font-light italic text-foreground">Today's looks</h1>
        <div className="mx-auto mt-2 h-px w-14 gold-accent-gradient opacity-70" />
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
              className={`h-0.5 rounded-full transition-all duration-500 ${
                i < activeIndex
                  ? 'w-2 gold-accent-gradient opacity-70'
                  : i === activeIndex
                  ? 'w-7 bg-foreground'
                  : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card stack */}
      <div className="relative h-[470px]">
        {allDone ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-cream rounded-3xl border border-border/40 shadow-arch animate-fade-in">
            <div className="w-16 h-16 rounded-full gold-accent-gradient flex items-center justify-center mb-4 shadow-gold">
              <Check size={22} className="text-cream" strokeWidth={2} />
            </div>
            <h3 className="font-display text-2xl italic font-light text-foreground mb-1">All looks reviewed</h3>
            <p className="font-body text-xs text-muted-foreground mb-5 uppercase tracking-[0.2em]">Saved {savedIds.size} · Liked {likedIds.size}</p>
            <button
              onClick={reset}
              className="px-7 py-2.5 rounded-full bg-foreground text-cream font-body text-xs uppercase tracking-[0.3em] hover:bg-taupe transition-colors shadow-soft"
            >
              Curate again
            </button>
          </div>
        ) : (
          outfits.slice(activeIndex, activeIndex + 3).map((outfit, stackIdx) => {
            const realIdx = activeIndex + stackIdx;
            const isTop = stackIdx === 0;
            const rotate = isTop ? drag.x * 0.06 : 0;
            const exitX = exitDir === 'right' ? 720 : exitDir === 'left' ? -720 : 0;
            const exitY = exitDir === 'up' ? -820 : 0;
            const exitRot = exitDir === 'right' ? 24 : exitDir === 'left' ? -24 : 0;
            const tx = isTop ? (exitDir ? exitX : drag.x) : 0;
            const ty = isTop ? (exitDir ? exitY : drag.y * 0.45) : 0;
            const rot = isTop ? (exitDir ? exitRot : rotate) : 0;
            // Underneath cards "rise" as top card moves
            const releaseProgress = isTop ? 0 : Math.min(1, (Math.abs(drag.x) + Math.abs(drag.y) * 0.6) / 220);
            const baseScale = 1 - stackIdx * 0.045;
            const scale = baseScale + releaseProgress * 0.045;
            const baseTranslateY = stackIdx * 14;
            const translateY = baseTranslateY - releaseProgress * 14;
            const opacity = stackIdx === 2 ? 0.45 : 1;

            return (
              <div
                key={realIdx}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: `translate3d(${tx}px, ${ty + translateY}px, 0) rotate(${rot}deg) scale(${scale})`,
                  transition: drag.active && isTop
                    ? 'none'
                    : exitDir && isTop
                    ? 'transform 0.42s cubic-bezier(0.32, 0.72, 0.24, 1.02), opacity 0.32s'
                    : 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s',
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
                  dragRatio={isTop ? dragRatio : 0}
                  liftRatio={isTop ? liftRatio : 0}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Action bar — gold-accented save & wear */}
      {!allDone && (
        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            onClick={() => advance('left')}
            aria-label="Skip"
            className="w-12 h-12 rounded-full bg-cream border border-border/50 flex items-center justify-center hover:border-destructive/40 hover:text-destructive transition-colors active:scale-95 shadow-soft text-muted-foreground"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => { handleLike(activeIndex); advance('up'); }}
            aria-label="Wear today"
            className="relative w-16 h-16 rounded-full gold-accent-gradient flex items-center justify-center shadow-gold hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-cream/40" />
            <Heart
              size={20}
              className={likedIds.has(activeIndex) ? 'text-cream fill-cream' : 'text-cream'}
              strokeWidth={1.8}
            />
          </button>
          <button
            onClick={() => { handleSave(outfits[activeIndex], activeIndex); advance('right'); }}
            aria-label="Save look"
            className="relative w-12 h-12 rounded-full bg-cream border border-gold/40 flex items-center justify-center shadow-soft hover:border-gold hover:scale-105 active:scale-95 transition-all"
          >
            <Bookmark size={16} className="text-gold-deep" strokeWidth={1.8} />
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

/* ---------- Card ---------- */
function OutfitCard({
  items, saved, liked, dragRatio, liftRatio,
}: {
  items: WardrobeItem[];
  saved: boolean;
  liked: boolean;
  dragRatio: number; // -1..1 (left..right)
  liftRatio: number; // 0..1 (up swipe)
}) {
  const saveOpacity = Math.max(0, dragRatio);
  const skipOpacity = Math.max(0, -dragRatio);
  const wearOpacity = liftRatio;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cream border border-border/40 shadow-arch select-none">
      {/* Subtle gold hairline at top */}
      <div className="absolute top-0 left-6 right-6 h-px gold-accent-gradient opacity-50 z-20" />

      {/* Item stage */}
      <div
        className="relative h-[72%] flex items-center justify-center bg-gradient-to-br from-nude-soft via-cream to-sand/40"
        style={{ perspective: '900px' }}
      >
        {items.map((item, j) => (
          <div
            key={item.id}
            className="absolute transition-transform duration-500"
            style={{
              transform: `translateZ(${j * 22}px) translateX(${(j - items.length / 2) * 40 + dragRatio * 8 * (j + 1)}px) translateY(${j * -7 - liftRatio * 6 * (j + 1)}px) rotateY(${(j - 1) * 5 + dragRatio * 4}deg)`,
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
              <div className="w-28 h-36 rounded-2xl bg-cream border border-border/50 flex flex-col items-center justify-center shadow-soft">
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

        {/* Swipe overlays — fade with drag */}
        <div
          className="absolute top-6 left-6 px-4 py-1.5 rounded-full gold-accent-gradient text-cream font-body text-[10px] uppercase tracking-[0.3em] shadow-gold pointer-events-none"
          style={{ opacity: saveOpacity, transform: `rotate(-12deg) scale(${0.8 + saveOpacity * 0.3})`, transition: 'opacity 0.12s' }}
        >
          Save
        </div>
        <div
          className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-foreground text-cream font-body text-[10px] uppercase tracking-[0.3em] pointer-events-none"
          style={{ opacity: skipOpacity, transform: `rotate(12deg) scale(${0.8 + skipOpacity * 0.3})`, transition: 'opacity 0.12s' }}
        >
          Skip
        </div>
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full gold-accent-gradient text-cream font-body text-[10px] uppercase tracking-[0.3em] shadow-gold pointer-events-none"
          style={{ opacity: wearOpacity, transform: `translateX(-50%) scale(${0.8 + wearOpacity * 0.3})`, transition: 'opacity 0.12s' }}
        >
          Wear today
        </div>
      </div>

      {/* Footer */}
      <div className="relative h-[28%] px-5 py-4 flex flex-col justify-between bg-cream border-t border-border/40">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-body text-[10px] tracking-[0.3em] text-taupe uppercase inline-flex items-center gap-1.5">
              <span className="inline-block h-px w-3 gold-accent-gradient" />
              Curated look
            </p>
            <div className="flex gap-2 items-center">
              {saved && (
                <span className="font-body text-[9px] text-gold-deep tracking-[0.25em] uppercase italic inline-flex items-center gap-1">
                  <Bookmark size={9} className="text-gold-deep" /> Saved
                </span>
              )}
              {liked && <Heart size={11} className="text-gold-deep fill-gold" />}
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

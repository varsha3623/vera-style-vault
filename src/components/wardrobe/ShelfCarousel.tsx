import { useRef, useState, useEffect, useCallback } from 'react';
import type { WardrobeItem } from '@/lib/storage';
import { Upload } from 'lucide-react';

interface Props {
  items: WardrobeItem[];
  onSelect: (item: WardrobeItem) => void;
  onUpload: () => void;
}

/**
 * Luxury 3D shelf carousel — horizontal stack with perspective tilt.
 * Cards rotate in 3D based on distance from center, evoking a rotating shelf.
 */
export default function ShelfCarousel({ items, onSelect, onUpload }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateMetrics = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setScrollX(el.scrollLeft);
    setContainerWidth(el.clientWidth);
  }, []);

  useEffect(() => {
    updateMetrics();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateMetrics, { passive: true });
    window.addEventListener('resize', updateMetrics);
    return () => {
      el.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [updateMetrics]);

  const CARD_W = 180;
  const GAP = 20;
  const STEP = CARD_W + GAP;
  const center = scrollX + containerWidth / 2;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-5 w-20 h-20 rounded-full border border-accent/40 flex items-center justify-center bg-card shadow-shelf">
          <Upload size={24} className="text-accent" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1">Empty Shelf</h3>
        <p className="font-body text-sm text-muted-foreground mb-6">Add your first piece to begin curating</p>
        <button onClick={onUpload} className="px-6 py-3 rounded-xl gold-gradient text-primary font-body font-semibold text-sm shadow-luxury">
          <Upload size={14} className="inline mr-2" />Upload Item
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={{ perspective: '1400px' }}>
      {/* Wood-grain shelf base */}
      <div className="absolute left-0 right-0 bottom-2 h-3 rounded-full bg-gradient-to-b from-[hsl(var(--gold-dark)/0.4)] via-[hsl(var(--burgundy)/0.6)] to-[hsl(var(--espresso))] shadow-luxury" />
      <div className="absolute left-4 right-4 -bottom-1 h-2 rounded-full bg-foreground/20 blur-md" />

      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-6 pt-4 snap-x snap-mandatory"
        style={{ scrollPaddingInline: `calc(50% - ${CARD_W / 2}px)`, paddingInline: `calc(50% - ${CARD_W / 2}px)`, transformStyle: 'preserve-3d' }}
      >
        {items.map((item, i) => {
          const cardCenter = i * STEP + CARD_W / 2 + (containerWidth / 2 - CARD_W / 2);
          const dist = (cardCenter - center) / STEP;
          const clamped = Math.max(-2.5, Math.min(2.5, dist));
          const rotateY = clamped * -22;
          const translateZ = -Math.abs(clamped) * 60;
          const scale = 1 - Math.min(0.18, Math.abs(clamped) * 0.08);
          const opacity = 1 - Math.min(0.55, Math.abs(clamped) * 0.22);

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="snap-center shrink-0 group"
              style={{
                width: CARD_W,
                transform: `translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s',
                opacity,
              }}
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-card shadow-luxury border border-border/60">
                <img src={item.image} alt={item.name || item.type} className="w-full h-full object-cover" />
                {/* Gold hairline frame */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[hsl(var(--gold)/0.25)] pointer-events-none" />
                {/* Bottom info plate */}
                <div className="absolute bottom-0 left-0 right-0 p-3 glass">
                  <p className="font-body text-xs text-foreground truncate">{item.name || item.type}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="font-body text-[10px] text-muted-foreground capitalize">{item.color}</p>
                    <p className="font-body text-[10px] text-accent">{item.wornCount}×</p>
                  </div>
                </div>
                {/* Specular highlight */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    background: `linear-gradient(${110 + rotateY}deg, transparent 40%, hsl(var(--gold) / 0.22) 50%, transparent 60%)`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

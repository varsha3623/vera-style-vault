import { useRef, useEffect } from 'react';

interface Props {
  sections: string[];
  active: string;
  counts: Record<string, number>;
  monogram: Record<string, string>;
  onSelect: (s: string) => void;
}

export default function CategoryTabs({ sections, active, counts, monogram, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
      {sections.map((s) => {
        const isActive = s === active;
        return (
          <button
            key={s}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(s)}
            className={`relative shrink-0 px-4 py-2.5 rounded-full font-body text-xs whitespace-nowrap transition-all duration-300 ${
              isActive
                ? 'gold-gradient text-primary shadow-gold font-semibold'
                : 'bg-card border border-border text-foreground/80 hover:border-accent/40'
            }`}
          >
            <span className={`font-display tracking-widest text-[10px] mr-2 ${isActive ? 'text-primary/70' : 'text-accent/70'}`}>
              {monogram[s] || '00'}
            </span>
            {s}
            <span className={`ml-2 text-[10px] ${isActive ? 'text-primary/80' : 'text-muted-foreground'}`}>
              {counts[s] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

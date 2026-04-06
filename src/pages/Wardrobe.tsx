import { useState, useRef, useCallback } from 'react';
import { storage, type WardrobeItem } from '@/lib/storage';
import { Plus, Upload, X, ChevronLeft, Trash2 } from 'lucide-react';

const DEFAULT_SECTIONS = ['Tops', 'Bottoms', 'Dresses', 'Traditional', 'Shoes', 'Accessories'];

const SECTION_EMOJIS: Record<string, string> = {
  Tops: '👚', Bottoms: '👖', Dresses: '👗', Traditional: '🥻', Shoes: '👠', Accessories: '💍',
};

export default function WardrobePage() {
  const [phase, setPhase] = useState<'doors' | 'inside'>('doors');
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [wardrobe, setWardrobe] = useState(storage.getWardrobe());
  const customSections = storage.getCustomSections();
  const allSections = [...DEFAULT_SECTIONS, ...customSections];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start door opening animation
  useState(() => {
    setTimeout(() => setDoorsOpen(true), 300);
    setTimeout(() => setPhase('inside'), 1400);
  });

  const sectionItems = useCallback((section: string) =>
    wardrobe.filter(i => i.type.toLowerCase() === section.toLowerCase()),
    [wardrobe]
  );

  const handleUpload = (section: string) => {
    const input = fileInputRef.current;
    if (!input) return;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const newItem: WardrobeItem = {
          id: Date.now().toString(),
          type: section,
          image: reader.result as string,
          color: 'neutral',
          wornCount: 0,
          name: file.name.replace(/\.[^.]+$/, ''),
        };
        storage.addWardrobeItem(newItem);
        setWardrobe(storage.getWardrobe());
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDelete = (id: string) => {
    storage.removeWardrobeItem(id);
    setWardrobe(storage.getWardrobe());
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      storage.addCustomSection(newSectionName.trim());
      setNewSectionName('');
      setShowAddSection(false);
    }
  };

  // Phase 1: Wardrobe Doors
  if (phase === 'doors') {
    return (
      <div className="fixed inset-0 z-40 bg-espresso flex items-center justify-center overflow-hidden">
        {/* Wardrobe frame */}
        <div className="relative w-[85vw] max-w-md h-[75vh] max-h-[600px]">
          {/* Top molding */}
          <div className="absolute -top-3 left-0 right-0 h-6 rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsl(25 20% 28%), hsl(25 18% 22%))',
            boxShadow: '0 -4px 12px hsl(25 20% 10% / 0.3)',
          }} />

          {/* Left Door */}
          <div
            className={`absolute left-0 top-0 w-1/2 h-full origin-left ${doorsOpen ? 'animate-door-open-left' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="w-full h-full wardrobe-door rounded-l-lg flex items-center justify-end pr-3">
              <div className="w-3 h-16 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(40 70% 55%), hsl(40 50% 40%))' }} />
            </div>
          </div>

          {/* Right Door */}
          <div
            className={`absolute right-0 top-0 w-1/2 h-full origin-right ${doorsOpen ? 'animate-door-open-right' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="w-full h-full wardrobe-door rounded-r-lg flex items-center pl-3">
              <div className="w-3 h-16 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(40 70% 55%), hsl(40 50% 40%))' }} />
            </div>
          </div>

          {/* Behind doors content (visible as doors open) */}
          <div className="absolute inset-0 bg-gradient-to-b from-card to-secondary rounded-lg flex items-center justify-center">
            <p className="font-display text-lg text-muted-foreground animate-pulse-gold">Opening your wardrobe...</p>
          </div>

          {/* Bottom molding */}
          <div className="absolute -bottom-2 left-0 right-0 h-4 rounded-b-xl" style={{
            background: 'linear-gradient(180deg, hsl(25 18% 22%), hsl(25 20% 18%))',
          }} />
        </div>
      </div>
    );
  }

  // Phase 2: Inside wardrobe - section detail view
  if (activeSection) {
    const items = sectionItems(activeSection);
    return (
      <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-bold text-foreground">{activeSection}</h1>
          <span className="font-body text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length} items</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative group">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card shadow-shelf border border-border/50 transition-transform duration-300 hover:scale-[1.03]">
                <img src={item.image} alt={item.name || item.type} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-2 glass">
                  <p className="font-body text-xs text-foreground truncate">{item.name || item.type}</p>
                  <p className="font-body text-[10px] text-muted-foreground">Worn {item.wornCount}x</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Upload button */}
          <button
            onClick={() => handleUpload(activeSection)}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 transition-colors bg-card/50"
          >
            <Upload size={24} className="text-muted-foreground" />
            <span className="font-body text-xs text-muted-foreground">Add Item</span>
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: Inside wardrobe - sections overview
  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your Wardrobe</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">Tap a section to explore</p>

      <div className="grid grid-cols-2 gap-4">
        {allSections.map((section, i) => {
          const items = sectionItems(section);
          const preview = items[0]?.image;
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-shelf transition-all duration-300 hover:scale-[1.03] hover:shadow-luxury group"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="aspect-square flex flex-col items-center justify-center p-4 relative">
                {preview ? (
                  <>
                    <img src={preview} alt={section} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  </>
                ) : null}
                <div className="relative z-10 text-center">
                  <span className="text-3xl mb-2 block">{SECTION_EMOJIS[section] || '📦'}</span>
                  <p className="font-display text-sm font-bold text-foreground">{section}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">{items.length} items</p>
                </div>
              </div>

              {/* Shelf effect */}
              <div className="h-1.5 gold-gradient opacity-40" />
            </button>
          );
        })}

        {/* Add Section */}
        <button
          onClick={() => setShowAddSection(true)}
          className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 transition-colors"
        >
          <Plus size={28} className="text-muted-foreground" />
          <span className="font-body text-xs text-muted-foreground">Add Section</span>
        </button>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAddSection(false)} />
          <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-sm shadow-luxury animate-scale-in">
            <button onClick={() => setShowAddSection(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <h3 className="font-display text-lg font-bold mb-4 text-foreground">New Section</h3>
            <input
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              placeholder="e.g., Lehenga, Jackets"
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4"
            />
            <button
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              Create Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

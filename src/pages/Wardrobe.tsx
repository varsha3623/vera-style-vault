import { useState, useRef, useEffect } from 'react';
import { storage, type WardrobeItem } from '@/lib/storage';
import { Plus, Upload, X, ChevronLeft, Trash2, Search, BarChart3, Eye } from 'lucide-react';

const DEFAULT_SECTIONS = ['Tops', 'Bottoms', 'Dresses', 'Traditional', 'Shoes', 'Accessories'];

const SECTION_EMOJIS: Record<string, string> = {
  Tops: '👚', Bottoms: '👖', Dresses: '👗', Traditional: '🥻', Shoes: '👠', Accessories: '💍',
};

const COLOR_OPTIONS = ['black', 'white', 'navy', 'beige', 'red', 'blue', 'green', 'pink', 'gray', 'brown', 'cream', 'denim', 'gold'];

export default function WardrobePage() {
  const [phase, setPhase] = useState<'doors' | 'inside'>('doors');
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [wardrobe, setWardrobe] = useState(storage.getWardrobe());
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [uploadColor, setUploadColor] = useState('neutral');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ section: string; dataUrl: string; name: string } | null>(null);
  const customSections = storage.getCustomSections();
  const allSections = [...DEFAULT_SECTIONS, ...customSections];
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setDoorsOpen(true), 300);
    const t2 = setTimeout(() => setPhase('inside'), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const sectionItems = (section: string) =>
    wardrobe.filter(i => i.type.toLowerCase() === section.toLowerCase());

  const filteredItems = (section: string) => {
    const items = sectionItems(section);
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => (i.name || i.type).toLowerCase().includes(q) || i.color.toLowerCase().includes(q));
  };

  const handleUpload = (section: string) => {
    const input = fileInputRef.current;
    if (!input) return;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPendingFile({ section, dataUrl: reader.result as string, name: file.name.replace(/\.[^.]+$/, '') });
        setUploadColor('neutral');
        setShowColorPicker(true);
      };
      reader.readAsDataURL(file);
    };
    input.value = '';
    input.click();
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    const newItem: WardrobeItem = {
      id: Date.now().toString(),
      type: pendingFile.section,
      image: pendingFile.dataUrl,
      color: uploadColor,
      wornCount: 0,
      name: pendingFile.name,
    };
    storage.addWardrobeItem(newItem);
    setWardrobe(storage.getWardrobe());
    setShowColorPicker(false);
    setPendingFile(null);
  };

  const handleDelete = (id: string) => {
    storage.removeWardrobeItem(id);
    setWardrobe(storage.getWardrobe());
  };

  const handleWorn = (id: string) => {
    storage.incrementWorn(id);
    setWardrobe(storage.getWardrobe());
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      storage.addCustomSection(newSectionName.trim());
      setNewSectionName('');
      setShowAddSection(false);
    }
  };

  const totalItems = wardrobe.length;
  const totalWorn = wardrobe.reduce((a, b) => a + b.wornCount, 0);
  const mostWorn = wardrobe.length > 0 ? [...wardrobe].sort((a, b) => b.wornCount - a.wornCount)[0] : null;
  const leastWorn = wardrobe.length > 0 ? [...wardrobe].sort((a, b) => a.wornCount - b.wornCount)[0] : null;

  // Phase 1: Wardrobe Doors
  if (phase === 'doors') {
    return (
      <div className="fixed inset-0 z-40 bg-espresso flex items-center justify-center overflow-hidden">
        <div className="relative w-[85vw] max-w-md h-[75vh] max-h-[600px]" style={{ perspective: '1200px' }}>
          <div className="absolute -top-3 left-0 right-0 h-6 rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsl(25 20% 28%), hsl(25 18% 22%))',
            boxShadow: '0 -4px 12px hsl(25 20% 10% / 0.3)',
          }} />

          <div className="absolute inset-0 bg-gradient-to-b from-card to-secondary rounded-lg flex items-center justify-center">
            <p className="font-display text-lg text-muted-foreground animate-pulse-gold">Opening your wardrobe...</p>
          </div>

          <div
            className={`absolute left-0 top-0 w-1/2 h-full origin-left ${doorsOpen ? 'animate-door-open-left' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="w-full h-full wardrobe-door rounded-l-lg flex items-center justify-end pr-3">
              <div className="w-3 h-16 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(40 70% 55%), hsl(40 50% 40%))' }} />
            </div>
          </div>

          <div
            className={`absolute right-0 top-0 w-1/2 h-full origin-right ${doorsOpen ? 'animate-door-open-right' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="w-full h-full wardrobe-door rounded-r-lg flex items-center pl-3">
              <div className="w-3 h-16 rounded-full" style={{ background: 'linear-gradient(180deg, hsl(40 70% 55%), hsl(40 50% 40%))' }} />
            </div>
          </div>

          <div className="absolute -bottom-2 left-0 right-0 h-4 rounded-b-xl" style={{
            background: 'linear-gradient(180deg, hsl(25 18% 22%), hsl(25 20% 18%))',
          }} />
        </div>
      </div>
    );
  }

  // Color picker modal
  if (showColorPicker && pendingFile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => { setShowColorPicker(false); setPendingFile(null); }} />
        <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-sm shadow-luxury animate-scale-in">
          <h3 className="font-display text-lg font-bold mb-2 text-foreground">Add Item</h3>
          <p className="font-body text-xs text-muted-foreground mb-4">Select the dominant color</p>
          <div className="w-full h-32 rounded-xl overflow-hidden mb-4 bg-card">
            <img src={pendingFile.dataUrl} alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => setUploadColor(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-body capitalize transition-all ${
                  uploadColor === c ? 'bg-accent text-accent-foreground shadow-card' : 'bg-card border border-border text-foreground hover:border-accent/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button onClick={confirmUpload} className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl text-sm shadow-luxury">
            Add to Wardrobe
          </button>
        </div>
      </div>
    );
  }

  // Section detail view
  if (activeSection) {
    const items = filteredItems(activeSection);
    const allItems = sectionItems(activeSection);
    return (
      <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setActiveSection(null); setSearchQuery(''); }} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">{activeSection}</h1>
            <p className="font-body text-xs text-muted-foreground">{allItems.length} items</p>
          </div>
          <button onClick={() => handleUpload(activeSection)} className="p-2 rounded-xl gold-gradient">
            <Plus size={18} className="text-primary" />
          </button>
        </div>

        {/* Search */}
        {allItems.length > 3 && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
        )}

        {items.length === 0 && allItems.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">{SECTION_EMOJIS[activeSection] || '📦'}</span>
            <h3 className="font-display text-lg font-bold text-foreground mb-1">Empty Section</h3>
            <p className="font-body text-sm text-muted-foreground mb-6">Add your first {activeSection.toLowerCase()} item</p>
            <button
              onClick={() => handleUpload(activeSection)}
              className="px-6 py-3 rounded-xl gold-gradient text-primary font-body font-semibold text-sm shadow-luxury"
            >
              <Upload size={14} className="inline mr-2" />Upload Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="relative group">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card shadow-shelf border border-border/50 transition-transform duration-300 hover:scale-[1.03]">
                  <img src={item.image} alt={item.name || item.type} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 glass">
                    <p className="font-body text-xs text-foreground truncate">{item.name || item.type}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="font-body text-[10px] text-muted-foreground capitalize">{item.color}</p>
                      <p className="font-body text-[10px] text-muted-foreground">Worn {item.wornCount}×</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleWorn(item.id)} className="p-1.5 rounded-full bg-background/80 text-accent" title="Mark as worn">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-full bg-background/80 text-destructive" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => handleUpload(activeSection)}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 transition-colors bg-card/50"
            >
              <Upload size={24} className="text-muted-foreground" />
              <span className="font-body text-xs text-muted-foreground">Add Item</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Sections overview
  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Your Wardrobe</h1>
        <button onClick={() => setShowStats(!showStats)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <BarChart3 size={18} className="text-muted-foreground" />
        </button>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-4">
        {totalItems} items · Tap a section to explore
      </p>

      {/* Stats panel */}
      {showStats && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-card mb-6 animate-scale-in">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">Wardrobe Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="font-display text-xl font-bold text-foreground">{totalItems}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Total Items</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center">
              <p className="font-display text-xl font-bold text-foreground">{totalWorn}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Total Wears</p>
            </div>
            {mostWorn && (
              <div className="bg-background rounded-xl p-3 col-span-2">
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Most Worn</p>
                <p className="font-body text-sm text-foreground">{mostWorn.name || mostWorn.type} ({mostWorn.wornCount}×)</p>
              </div>
            )}
            {leastWorn && leastWorn.wornCount === 0 && (
              <div className="bg-accent/10 rounded-xl p-3 col-span-2 border border-accent/20">
                <p className="font-body text-[10px] text-accent uppercase tracking-wider mb-1">Never Worn</p>
                <p className="font-body text-sm text-foreground">{leastWorn.name || leastWorn.type} — try it today!</p>
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="h-1.5 gold-gradient opacity-40" />
            </button>
          );
        })}

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
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4"
              onKeyDown={e => e.key === 'Enter' && handleAddSection()}
            />
            <button
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl text-sm disabled:opacity-50 shadow-luxury"
            >
              Create Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

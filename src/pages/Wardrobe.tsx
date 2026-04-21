import { useState, useRef, useMemo } from 'react';
import { storage, type WardrobeItem } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Upload, X, Search, BarChart3 } from 'lucide-react';
import CategoryTabs from '@/components/wardrobe/CategoryTabs';
import ShelfCarousel from '@/components/wardrobe/ShelfCarousel';
import ItemDrawer from '@/components/wardrobe/ItemDrawer';

const DEFAULT_SECTIONS = ['Tops', 'Bottoms', 'Dresses', 'Traditional', 'Shoes', 'Accessories'];

const SECTION_MONOGRAM: Record<string, string> = {
  Tops: '01', Bottoms: '02', Dresses: '03', Traditional: '04', Shoes: '05', Accessories: '06',
};

const COLOR_OPTIONS = ['black', 'white', 'navy', 'beige', 'red', 'blue', 'green', 'pink', 'gray', 'brown', 'cream', 'denim', 'gold'];

export default function WardrobePage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [wardrobe, setWardrobe] = useState(storage.getWardrobe(email));
  const customSections = storage.getCustomSections(email);
  const allSections = useMemo(() => [...DEFAULT_SECTIONS, ...customSections], [customSections]);

  const [activeSection, setActiveSection] = useState<string>(allSections[0]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [uploadColor, setUploadColor] = useState('neutral');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ section: string; dataUrl: string; name: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    allSections.forEach(s => { c[s] = wardrobe.filter(i => i.type.toLowerCase() === s.toLowerCase()).length; });
    return c;
  }, [wardrobe, allSections]);

  const sectionItems = (section: string) =>
    wardrobe.filter(i => i.type.toLowerCase() === section.toLowerCase());

  const filteredItems = useMemo(() => {
    const items = sectionItems(activeSection);
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => (i.name || i.type).toLowerCase().includes(q) || i.color.toLowerCase().includes(q));
  }, [wardrobe, activeSection, searchQuery]);

  const handleUpload = () => {
    const input = fileInputRef.current;
    if (!input) return;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPendingFile({ section: activeSection, dataUrl: reader.result as string, name: file.name.replace(/\.[^.]+$/, '') });
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
    storage.addWardrobeItem(email, newItem);
    setWardrobe(storage.getWardrobe(email));
    setShowColorPicker(false);
    setPendingFile(null);
  };

  const handleDelete = (id: string) => {
    storage.removeWardrobeItem(email, id);
    setWardrobe(storage.getWardrobe(email));
  };

  const handleWorn = (id: string) => {
    storage.incrementWorn(email, id);
    setWardrobe(storage.getWardrobe(email));
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      storage.addCustomSection(email, newSectionName.trim());
      setNewSectionName('');
      setShowAddSection(false);
    }
  };

  const totalItems = wardrobe.length;
  const totalWorn = wardrobe.reduce((a, b) => a + b.wornCount, 0);
  const mostWorn = wardrobe.length > 0 ? [...wardrobe].sort((a, b) => b.wornCount - a.wornCount)[0] : null;
  const leastWorn = wardrobe.length > 0 ? [...wardrobe].sort((a, b) => a.wornCount - b.wornCount)[0] : null;
  const showSearch = sectionItems(activeSection).length > 3;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in pb-12">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

      {/* Editorial header */}
      <div className="text-center mb-2">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-taupe mb-2">Atelier</p>
        <h1 className="font-display text-3xl font-light italic text-foreground">Your wardrobe</h1>
        <p className="font-body text-xs text-muted-foreground mt-2 italic">{totalItems} pieces · {totalWorn} total wears</p>
      </div>
      <div className="flex justify-center gap-2 mb-5 mt-3">
        <button
          onClick={() => setShowStats(!showStats)}
          aria-label="Toggle stats"
          className={`p-2.5 rounded-full border transition-all ${showStats ? 'bg-foreground border-foreground text-cream' : 'bg-cream border-border/50 text-foreground hover:border-taupe/40'}`}
        >
          <BarChart3 size={15} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => setShowAddSection(true)}
          aria-label="Add section"
          className="p-2.5 rounded-full bg-cream border border-border/50 text-foreground hover:border-taupe/40 transition-colors"
        >
          <Plus size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats panel */}
      {showStats && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-card mb-5 animate-scale-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-3 text-center border border-border/50">
              <p className="font-display text-2xl font-bold text-foreground">{totalItems}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Pieces</p>
            </div>
            <div className="bg-background rounded-xl p-3 text-center border border-border/50">
              <p className="font-display text-2xl font-bold text-foreground">{totalWorn}</p>
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Wears</p>
            </div>
            {mostWorn && (
              <div className="bg-background rounded-xl p-3 col-span-2 border border-border/50">
                <p className="font-body text-[10px] text-accent uppercase tracking-wider mb-1">Most Worn</p>
                <p className="font-body text-sm text-foreground">{mostWorn.name || mostWorn.type} ({mostWorn.wornCount}×)</p>
              </div>
            )}
            {leastWorn && leastWorn.wornCount === 0 && (
              <div className="bg-accent/10 rounded-xl p-3 col-span-2 border border-accent/20">
                <p className="font-body text-[10px] text-accent uppercase tracking-wider mb-1">Never Worn</p>
                <p className="font-body text-sm text-foreground">{leastWorn.name || leastWorn.type} — try it today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gold-accented category tabs */}
      <CategoryTabs
        sections={allSections}
        active={activeSection}
        counts={counts}
        monogram={SECTION_MONOGRAM}
        onSelect={(s) => { setActiveSection(s); setSearchQuery(''); }}
      />

      <div className="h-px gold-hairline my-3" />

      {/* Search */}
      {showSearch && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeSection.toLowerCase()}...`}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
      )}

      {/* 3D shelf carousel */}
      <ShelfCarousel
        items={filteredItems}
        onSelect={setSelectedItem}
        onUpload={handleUpload}
      />

      {/* Upload CTA */}
      {filteredItems.length > 0 && (
        <button
          onClick={handleUpload}
          className="mt-4 w-full py-3 rounded-xl border border-dashed border-accent/40 bg-card/50 hover:bg-accent/5 transition-colors flex items-center justify-center gap-2 font-body text-xs text-foreground/80"
        >
          <Upload size={14} className="text-accent" />
          Add another {activeSection.toLowerCase().replace(/s$/, '')}
        </button>
      )}

      {/* Detail drawer */}
      <ItemDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onWorn={handleWorn}
        onDelete={handleDelete}
        totalWornInWardrobe={totalWorn}
      />

      {/* Color picker modal */}
      {showColorPicker && pendingFile && (
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
                <button key={c} onClick={() => setUploadColor(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body capitalize transition-all ${
                    uploadColor === c ? 'gold-gradient text-primary shadow-card' : 'bg-card border border-border text-foreground hover:border-accent/40'
                  }`}>{c}</button>
              ))}
            </div>
            <button onClick={confirmUpload} className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl text-sm shadow-luxury">
              Add to Wardrobe
            </button>
          </div>
        </div>
      )}

      {/* Add section modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAddSection(false)} />
          <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-sm shadow-luxury animate-scale-in">
            <button onClick={() => setShowAddSection(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <h3 className="font-display text-lg font-bold mb-4 text-foreground">New Section</h3>
            <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="e.g., Lehenga, Jackets"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4"
              onKeyDown={e => e.key === 'Enter' && handleAddSection()} />
            <button onClick={handleAddSection} disabled={!newSectionName.trim()}
              className="w-full gold-gradient text-primary font-body font-semibold py-3 rounded-xl text-sm disabled:opacity-50 shadow-luxury">
              Create Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

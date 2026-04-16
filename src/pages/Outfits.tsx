import { useState, useMemo } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { generateOutfits } from '@/lib/recommendations';
import { Heart, RefreshCw, Bookmark } from 'lucide-react';

export default function OutfitsPage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [refresh, setRefresh] = useState(0);
  const wardrobe = storage.getWardrobe(email);
  const prefs = storage.getPreferences(email);
  const weather = { temp: 24, condition: 'Clear' };

  const outfits = useMemo(() =>
    generateOutfits(wardrobe, weather, prefs, undefined, 6),
    [wardrobe, prefs, refresh]
  );

  const handleSave = (items: typeof wardrobe) => {
    storage.saveOutfit(email, {
      id: Date.now().toString(),
      items,
      date: new Date().toISOString(),
    });
  };

  if (wardrobe.length === 0) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-card mx-auto flex items-center justify-center mb-4 shadow-card">
          <span className="text-3xl">👗</span>
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">No Items Yet</h2>
        <p className="font-body text-sm text-muted-foreground">Add items to your wardrobe to get outfit recommendations</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Outfit Ideas</h1>
          <p className="font-body text-sm text-muted-foreground">Curated looks from your wardrobe</p>
        </div>
        <button onClick={() => setRefresh(r => r + 1)} className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors">
          <RefreshCw size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-6">
        {outfits.map((outfit, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="relative h-56 bg-gradient-to-br from-secondary to-muted flex items-center justify-center"
                style={{ perspective: '600px' }}>
                {outfit.map((item, j) => (
                  <div
                    key={item.id}
                    className="absolute transition-transform duration-500"
                    style={{
                      transform: `translateZ(${j * 15}px) translateX(${(j - outfit.length / 2) * 30}px) rotateY(${(j - 1) * 3}deg)`,
                      zIndex: j,
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.type} className="w-24 h-32 object-cover rounded-xl shadow-shelf border border-border/30" />
                    ) : (
                      <div className="w-24 h-32 rounded-xl bg-card/80 shadow-shelf border border-border flex items-center justify-center">
                        <span className="font-body text-xs text-muted-foreground">{item.type}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {outfit.map(item => (
                    <span key={item.id} className="font-body text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {item.type}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(outfit)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gold-gradient text-primary font-body text-sm font-semibold"
                  >
                    <Bookmark size={14} />
                    Save Look
                  </button>
                  <button className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
                    <Heart size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

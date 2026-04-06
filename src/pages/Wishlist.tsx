import { storage } from '@/lib/storage';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  const wishlist = storage.getWishlist();
  const wardrobe = storage.getWardrobe();
  const items = wardrobe.filter(i => wishlist.includes(i.id));

  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Wishlist</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">Your favorite pieces</p>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">No items in your wishlist yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="rounded-xl overflow-hidden bg-card shadow-card border border-border/50">
              <img src={item.image} alt={item.type} className="w-full h-36 object-cover" />
              <div className="p-3">
                <p className="font-body text-xs text-foreground">{item.name || item.type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

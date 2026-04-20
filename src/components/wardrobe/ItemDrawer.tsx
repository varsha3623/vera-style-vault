import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { WardrobeItem } from '@/lib/storage';
import { Eye, Trash2, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  item: WardrobeItem | null;
  onClose: () => void;
  onWorn: (id: string) => void;
  onDelete: (id: string) => void;
  totalWornInWardrobe: number;
}

export default function ItemDrawer({ item, onClose, onWorn, onDelete, totalWornInWardrobe }: Props) {
  const open = !!item;
  const sharePct = item && totalWornInWardrobe > 0 ? Math.round((item.wornCount / totalWornInWardrobe) * 100) : 0;
  const status = !item ? '' : item.wornCount === 0 ? 'Never worn' : item.wornCount < 3 ? 'Rarely worn' : item.wornCount < 8 ? 'Loved' : 'Iconic';

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-background border-t border-accent/20 max-h-[90vh]">
        <div className="absolute top-0 left-0 right-0 h-px gold-hairline" />
        {item && (
          <>
            <DrawerHeader className="pb-2">
              <DrawerTitle className="font-display text-xl font-bold text-foreground text-left">
                {item.name || item.type}
              </DrawerTitle>
              <p className="font-body text-xs text-muted-foreground text-left capitalize">
                {item.type} · {item.color}
              </p>
            </DrawerHeader>

            <div className="px-4 pb-6 overflow-y-auto">
              <div className="aspect-[4/5] max-h-[40vh] rounded-2xl overflow-hidden bg-card shadow-luxury border border-border/60 mx-auto mb-5 relative">
                <img src={item.image} alt={item.name || item.type} className="w-full h-full object-contain" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-[hsl(var(--gold)/0.25)] pointer-events-none" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatCard label="Wears" value={item.wornCount.toString()} />
                <StatCard label="Share" value={`${sharePct}%`} />
                <StatCard label="Status" value={status} small />
              </div>

              {/* Wear timeline bar */}
              <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">Wardrobe Share</p>
                  <TrendingUp size={12} className="text-accent" />
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full gold-gradient rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(4, sharePct)}%` }}
                  />
                </div>
                <p className="font-body text-[11px] text-muted-foreground mt-2">
                  {item.wornCount === 0
                    ? 'This piece is waiting for its moment.'
                    : `Worn ${item.wornCount} time${item.wornCount === 1 ? '' : 's'} of ${totalWornInWardrobe} total.`}
                </p>
              </div>

              {/* Stylist tip */}
              <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-5">
                <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
                <p className="font-body text-xs text-foreground/80 leading-relaxed">
                  {item.wornCount === 0
                    ? 'Try styling this piece today — VÉRA can suggest a fresh outfit.'
                    : `A signature ${item.color} ${item.type.toLowerCase()} — pair with neutrals for an effortless look.`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => { onWorn(item.id); onClose(); }}
                  className="flex-1 gold-gradient text-primary font-body font-semibold py-3 rounded-xl text-sm shadow-luxury flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Mark as Worn
                </button>
                <button
                  onClick={() => { onDelete(item.id); onClose(); }}
                  className="px-4 rounded-xl bg-card border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 text-center shadow-card">
      <p className={`font-display font-bold text-foreground ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      <p className="font-body text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, ShirtIcon, Sparkles, MessageCircle, Menu, Heart, X, User, Settings, Mail, Star, LogOut } from 'lucide-react';

// Tabs that participate in horizontal swipe navigation, in order.
const SWIPE_ROUTES = ['/', '/wardrobe', '/outfits', '/chat'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Touch swipe state — only horizontal gestures with low vertical drift navigate.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const elapsed = Date.now() - start.t;
    if (elapsed > 600) return;
    if (Math.abs(dx) < 70) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.6) return; // ignore mostly-vertical swipes
    const idx = SWIPE_ROUTES.indexOf(location.pathname);
    if (idx === -1) return;
    const nextIdx = dx < 0 ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= SWIPE_ROUTES.length) return;
    navigate(SWIPE_ROUTES[nextIdx]);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/wardrobe', icon: ShirtIcon, label: 'Wardrobe' },
    { path: '/outfits', icon: Sparkles, label: 'Outfits' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const menuItems = [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Preferences', path: '/preferences' },
    { icon: Mail, label: 'Contact', path: '/contact' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSideMenuOpen(true)} className="p-2 text-foreground hover:text-accent transition-colors">
            <Menu size={20} />
          </button>
          <Link to="/" className="text-xl font-display font-bold tracking-widest text-gold-gradient">VÉRA</Link>
          <Link to="/wishlist" className="p-2 text-foreground hover:text-accent transition-colors">
            <Heart size={20} />
          </Link>
        </div>
      </header>

      {/* Side Menu Overlay */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSideMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border shadow-luxury animate-slide-in-left">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-display font-bold text-gold-gradient">VÉRA</h2>
                <button onClick={() => setSideMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              {user && (
                <div className="mb-8 pb-6 border-b border-border">
                  <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mb-3">
                    <span className="text-primary font-display font-bold text-lg">{user.name.charAt(0)}</span>
                  </div>
                  <p className="font-body font-medium text-foreground">{user.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}

              <nav className="space-y-1">
                {menuItems.map(item => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setSideMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-body text-foreground hover:bg-card hover:text-accent transition-colors"
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => { logout(); setSideMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-body text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                  active ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-body font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

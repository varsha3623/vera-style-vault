// Storage utilities for VÉRA app

export interface User {
  name: string;
  email: string;
  password: string;
  onboarded?: boolean;
}

export interface UserPreferences {
  location: string;
  lifestyle: 'student' | 'corporate' | 'other';
  style: 'casual' | 'elegant' | 'trendy' | 'minimal';
  restrictions: {
    sleevelessAllowed: boolean;
    shortOutfitsAllowed: boolean;
  };
}

export interface WardrobeItem {
  id: string;
  type: string;
  image: string;
  color: string;
  wornCount: number;
  name?: string;
}

export interface SavedOutfit {
  id: string;
  items: WardrobeItem[];
  occasion?: string;
  date?: string;
}

export interface CalendarEvent {
  date: string;
  event: string;
  location: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'vera';
  text: string;
  timestamp: number;
}

const get = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const set = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export const storage = {
  getUsers: (): User[] => get('vera_users', []),
  addUser: (user: User) => { const users = get<User[]>('vera_users', []); users.push(user); set('vera_users', users); },
  findUser: (email: string): User | undefined => get<User[]>('vera_users', []).find(u => u.email === email),

  setCurrentUser: (email: string) => set('vera_current_user', email),
  getCurrentUser: (): string | null => localStorage.getItem('vera_current_user') ? JSON.parse(localStorage.getItem('vera_current_user')!) : null,
  logout: () => localStorage.removeItem('vera_current_user'),

  getPreferences: (): UserPreferences | null => get('vera_preferences', null),
  setPreferences: (prefs: UserPreferences) => set('vera_preferences', prefs),

  markOnboarded: (email: string) => {
    const users = get<User[]>('vera_users', []);
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) { users[idx].onboarded = true; set('vera_users', users); }
  },

  getWardrobe: (): WardrobeItem[] => get('vera_wardrobe', []),
  addWardrobeItem: (item: WardrobeItem) => { const w = get<WardrobeItem[]>('vera_wardrobe', []); w.push(item); set('vera_wardrobe', w); },
  removeWardrobeItem: (id: string) => { const w = get<WardrobeItem[]>('vera_wardrobe', []).filter(i => i.id !== id); set('vera_wardrobe', w); },
  incrementWorn: (id: string) => {
    const w = get<WardrobeItem[]>('vera_wardrobe', []);
    const item = w.find(i => i.id === id);
    if (item) { item.wornCount++; set('vera_wardrobe', w); }
  },

  getCustomSections: (): string[] => get('vera_custom_sections', []),
  addCustomSection: (name: string) => { const s = get<string[]>('vera_custom_sections', []); if (!s.includes(name)) { s.push(name); set('vera_custom_sections', s); } },

  getOutfits: (): SavedOutfit[] => get('vera_outfits', []),
  saveOutfit: (outfit: SavedOutfit) => { const o = get<SavedOutfit[]>('vera_outfits', []); o.push(outfit); set('vera_outfits', o); },

  getEvents: (): CalendarEvent[] => get('vera_events', []),
  addEvent: (event: CalendarEvent) => { const e = get<CalendarEvent[]>('vera_events', []); e.push(event); set('vera_events', e); },
  getEventForDate: (date: string): CalendarEvent | undefined => get<CalendarEvent[]>('vera_events', []).find(e => e.date === date),

  getMessages: (): ChatMessage[] => get('vera_messages', []),
  addMessage: (msg: ChatMessage) => { const m = get<ChatMessage[]>('vera_messages', []); m.push(msg); set('vera_messages', m); },

  getWishlist: (): string[] => get('vera_wishlist', []),
  toggleWishlist: (id: string) => {
    const w = get<string[]>('vera_wishlist', []);
    const idx = w.indexOf(id);
    if (idx !== -1) w.splice(idx, 1); else w.push(id);
    set('vera_wishlist', w);
  },
};

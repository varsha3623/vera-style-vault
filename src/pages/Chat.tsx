import { useState, useRef, useEffect } from 'react';
import { storage, type ChatMessage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { chatRecommend } from '@/lib/recommendations';
import { Send, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = [
  'What should I wear today?',
  'Outfit for a date night',
  'Office look ideas',
  'Color matching tips',
  'Weekend brunch outfit',
];

export default function ChatPage() {
  const { user } = useAuth();
  const email = user?.email || '';
  const [messages, setMessages] = useState<ChatMessage[]>(storage.getMessages(email));
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefs = storage.getPreferences(email);
  const wardrobe = storage.getWardrobe(email);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'vera',
        text: "Hello, I'm VÉRA — your personal styling atelier.\n\nAsk me anything: outfit pairings, color harmony, occasion dressing, or wardrobe edits.",
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      storage.addMessage(email, welcome);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: trimmed, timestamp: Date.now() };
    storage.addMessage(email, userMsg);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const response = chatRecommend(trimmed, wardrobe, prefs);
      const veraMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'vera',
        text: response,
        timestamp: Date.now() + 100,
      };
      storage.addMessage(email, veraMsg);
      setMessages(prev => [...prev, veraMsg]);
      setIsTyping(false);
    }, 900 + Math.random() * 500);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-8.5rem)] max-w-lg mx-auto">
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-full bg-burgundy/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shadow-gold">
              <Sparkles size={16} className="text-primary" strokeWidth={2.2} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background animate-pulse-gold" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground tracking-tight">VÉRA Atelier</h1>
            <p className="font-body text-[11px] text-muted-foreground tracking-wider uppercase">Always available</p>
          </div>
        </div>
        <div className="mt-3 h-px gold-hairline" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 space-y-4 pb-4 scrollbar-hide">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-bubble-in`}
          >
            {msg.sender === 'vera' && (
              <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center mr-2 mt-1 shrink-0 shadow-gold">
                <span className="font-display text-[10px] font-bold text-primary">V</span>
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-card ${
                msg.sender === 'user'
                  ? 'glass-bubble-user text-primary-foreground rounded-br-md'
                  : 'glass-bubble text-foreground rounded-bl-md'
              }`}
            >
              <p className="font-body text-[14px] whitespace-pre-line leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-bubble-in">
            <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center mr-2 mt-1 shrink-0 shadow-gold">
              <span className="font-display text-[10px] font-bold text-primary">V</span>
            </div>
            <div className="glass-bubble rounded-2xl rounded-bl-md px-4 py-3.5 shadow-card">
              <div className="flex items-end gap-1 h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: '160ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-typing-dot" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick-prompt chips (only shown if conversation is short) */}
      {messages.length <= 2 && !isTyping && (
        <div className="relative px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="shrink-0 glass-bubble rounded-full px-3.5 py-1.5 font-body text-xs text-foreground hover:border-accent/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="relative px-4 py-3">
        <div className="h-px gold-hairline mb-3" />
        <div className="flex items-center gap-2 glass-bubble rounded-full pl-4 pr-1.5 py-1.5 shadow-card">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask VÉRA…"
            className="flex-1 bg-transparent text-foreground font-body text-sm placeholder:text-muted-foreground/70 focus:outline-none py-1.5"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Send message"
            className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-primary shadow-gold disabled:opacity-40 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          >
            <Send size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

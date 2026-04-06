import { useState, useRef, useEffect } from 'react';
import { storage, type ChatMessage } from '@/lib/storage';
import { chatRecommend } from '@/lib/recommendations';
import { Send } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(storage.getMessages());
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefs = storage.getPreferences();
  const wardrobe = storage.getWardrobe();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'vera',
        text: "Hello! I'm VÉRA, your personal styling assistant. ✨\n\nAsk me about outfit suggestions, color matching, or styling tips. I'm here to help you look your best!",
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      storage.addMessage(welcome);
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input.trim(), timestamp: Date.now() };
    storage.addMessage(userMsg);

    const response = chatRecommend(input, wardrobe, prefs);
    const veraMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'vera', text: response, timestamp: Date.now() + 100 };
    storage.addMessage(veraMsg);

    setMessages(prev => [...prev, userMsg, veraMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-lg mx-auto">
      <div className="px-4 py-4">
        <h1 className="font-display text-xl font-bold text-foreground">Chat with VÉRA</h1>
        <p className="font-body text-xs text-muted-foreground">Your AI styling companion</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.sender === 'user'
                ? 'gold-gradient text-primary rounded-br-sm'
                : 'bg-card border border-border rounded-bl-sm'
            }`}>
              {msg.sender === 'vera' && (
                <p className="font-display text-[10px] font-bold text-accent mb-1 tracking-wider">VÉRA</p>
              )}
              <p className="font-body text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about styling..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl gold-gradient text-primary disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

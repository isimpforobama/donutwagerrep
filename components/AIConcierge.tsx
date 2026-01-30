
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UserStats, HistoryItem } from '../types';

interface AIConciergeProps {
  stats: UserStats;
  history: HistoryItem[];
}

const AIConcierge: React.FC<AIConciergeProps> = ({ stats, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: "Welcome to DonutWager. I'm your Concierge. I specialize in strategy optimization and session management. How can I help you dominate the arena today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        You are the "Donut Concierge", a high-end AI host for DonutWager virtual casino.
        User Stats: Balance ${stats.balance}, Level ${stats.level}.
        Recent History: ${JSON.stringify(history.slice(0, 3))}.

        Tone: Sophisticated, modern, slightly edgy, elite, and very concise.
        Brand: DonutWager.
        Never talk about real money. Remind them it's purely virtual if asked.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: { systemInstruction },
      });

      const aiText = response.text || "Transmission error. The house remains silent.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Signal jammed. Retry your query." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <img 
          src="/images/logoimage.png" 
          alt="Support" 
          className="w-full h-full object-contain"
        />
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[400px] max-w-[calc(100vw-4rem)] h-[600px] glass rounded-[3rem] flex flex-col z-50 shadow-2xl border-white/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-pink-500/5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-black text-xs border border-white/20">DG</div>
              <div>
                <h4 className="font-black text-xs tracking-widest uppercase">Donut Concierge</h4>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Link Established</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-slate-500 flex items-center justify-center">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-pink-600 text-white font-medium shadow-lg' : 'bg-white/5 text-slate-200 border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex space-x-1.5 pl-3">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 border-t border-white/5 bg-black/40">
            <div className="flex space-x-3">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Signal your request..."
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:ring-1 focus:ring-pink-500 outline-none transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={sendMessage}
                className="w-14 h-14 rounded-2xl bg-pink-600 flex items-center justify-center hover:bg-pink-500 transition-colors shadow-lg shadow-pink-500/20"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIConcierge;

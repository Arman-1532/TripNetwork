import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      body: "Greetings. I am Gojo Sensei, your personal trip planner. How may I assist with your travels today?",
      createdAt: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      body: text,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Robust design: passing session history (last 10 messages)
      const history = messages.slice(-10).map(m => ({
        sender: m.sender,
        body: m.body
      }));

      const res = await api.ai.chat(text, history);

      if (res?.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          body: res.data.message,
          createdAt: new Date()
        }]);
      } else {
        throw new Error(res?.message || 'Failed to get response');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        body: "I apologize, but I'm having trouble connecting to my knowledge base. Please try again shortly.",
        createdAt: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group relative"
        >
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 group-hover:hidden"></div>
          <Sparkles className="w-8 h-8" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[400px] h-[600px] bg-surface border border-outline-variant/20 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500">
          {/* Header */}
          <div className="p-6 bg-primary text-on-primary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black tracking-tight">Gojo Sensei</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Online </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-primary'
                    }`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-3xl text-sm leading-relaxed ${msg.sender === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : msg.isError
                      ? 'bg-error-container text-on-error-container rounded-tl-none border border-error/20'
                      : 'bg-surface-container-highest text-on-surface rounded-tl-none'
                    }`}>
                    {msg.body}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-surface-container-highest p-4 rounded-3xl rounded-tl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-6 bg-surface border-t border-outline-variant/10"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your trip..."
                className="w-full bg-surface-container border-none rounded-2xl py-4 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary focus:bg-surface transition-all outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-on-primary rounded-xl disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-center mt-3 text-on-surface-variant uppercase tracking-widest font-bold opacity-50">
              TripNetwork Private trip planner Service
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChatbot;

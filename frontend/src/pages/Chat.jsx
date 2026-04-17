import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
import useChat from '../hooks/useChat';

const ChatPage = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  
  const { messages, sendMessage, connected, error } = useChat(Number(packageId));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-slate-950 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant/10 bg-surface">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              Package Support <span className="text-primary-dim text-xs">#{packageId}</span>
            </h2>
            <p className="text-xs text-white flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-slate-400'}`}></span>
              {connected ? 'Real-time Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-slate-50/50 dark:bg-slate-900/10"
      >
        {error && (
          <div className="flex items-center gap-2 p-4 bg-error-container text-on-error-container rounded-2xl text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white opacity-60 space-y-2">
            <MessageSquare size={48} />
            <p className="font-medium">No message history found.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={msg.id ?? index}
            className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[70%] p-4 rounded-3xl ${
              msg.isSelf 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-on-surface dark:text-white rounded-tl-none shadow-sm shadow-on-surface/5 border border-outline-variant/10 dark:border-white/10'
            }`}>
              <p className="text-sm leading-relaxed text-on-surface dark:text-white">{msg.body ?? msg.message}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 px-2 text-[10px] text-white font-medium">
              <span>{msg.senderName ?? msg.sender_name ?? (msg.isSelf ? 'You' : 'Curator')}</span>
              <span className="opacity-60">•</span>
              <span className="opacity-80">{new Date(msg.createdAt ?? msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSend}
        className="p-6 bg-surface border-t border-outline-variant/10"
      >
        <div className="relative flex items-center">
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!connected}
            className="w-full bg-surface-container-low border border-outline-variant/10 rounded-full py-4 pl-6 pr-16 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm disabled:opacity-50" 
            placeholder={connected ? "Type your message here..." : "Connecting to chat..."}
            type="text"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || !connected}
            className="absolute right-2 p-3 bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;

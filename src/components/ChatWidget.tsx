import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithAssistant } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatWidget({ isDarkMode }: { isDarkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Intelligence protocol initiated. I am your forensic AI assistant. I can help you interpret scan results, explain misinformation tactics, or analyze specific claims.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const responseText = await chatWithAssistant(newMessages);
      setMessages([...newMessages, { role: 'model', text: responseText }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessages([...newMessages, { role: 'model', text: `ERROR: ${errorMessage}. Please check your network connection and retry.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center z-50",
          "bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white border border-transparent dark:border-white/20"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-full max-w-[400px] h-[600px] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 glass-card"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 flex items-center gap-3 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Forensic Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse"></div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Online & Ready</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-100/50 dark:bg-slate-950/20">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 text-[13px] leading-relaxed shadow-lg",
                    msg.role === 'user' 
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium rounded-2xl rounded-br-sm"
                      : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-white/5 text-cyan-600 dark:text-cyan-400 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-mono">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/40 relative">
              <div className="flex gap-3 relative z-10">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query intelligence network..."
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-colors font-mono bg-white dark:bg-slate-950/50 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 focus:border-cyan-500/50 focus:bg-white dark:focus:bg-slate-900 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                >
                  <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

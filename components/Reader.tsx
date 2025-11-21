import React, { useState, useRef, useEffect } from 'react';
import { Book as BookType, ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import { Play, Pause, MessageSquare, X, Send, Volume2, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderProps {
  book: BookType;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // TTS Refs
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!synthesisRef.current) return;

    if (isPlaying) {
      synthesisRef.current.pause();
      setIsPlaying(false);
    } else {
      if (synthesisRef.current.paused) {
        synthesisRef.current.resume();
      } else {
        // Start new
        synthesisRef.current.cancel();
        const text = activeChapter.content || activeChapter.summary;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for reading
        utterance.pitch = 1.0;
        
        utterance.onend = () => setIsPlaying(false);
        
        utteranceRef.current = utterance;
        synthesisRef.current.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  const handleAskBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const answer = await geminiService.askBook(
        userMsg.text, 
        activeChapter.content || '', 
        book.chapters.map(c => c.summary).join('\n')
      );
      
      const modelMsg: ChatMessage = { role: 'model', text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  if (!book.chapters.length) {
     return <div className="p-12 text-center">The library is empty. Create a book first.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-stone-100 relative overflow-hidden">
      
      {/* Reader Container */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showChat ? 'mr-96' : 'mr-0'}`}>
        <div className="max-w-3xl mx-auto min-h-full bg-ivory shadow-2xl shadow-stone-300/50 my-4 md:my-8 rounded-sm flex flex-col relative">
          
          {/* Book decoration (Binders) */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-stone-300 to-transparent opacity-50" />

          {/* Page Header */}
          <div className="px-8 md:px-16 pt-12 pb-4">
             <span className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-2 block">{book.title}</span>
             <h1 className="font-serif text-4xl text-stone-900">{activeChapter.title}</h1>
          </div>

          {/* Page Content */}
          <div className="flex-1 px-8 md:px-16 py-6">
             <div className="prose prose-lg prose-stone font-serif leading-loose text-stone-800 max-w-none">
                {activeChapter.content ? (
                  activeChapter.content.split('\n').map((para, i) => (
                    <p key={i} className="mb-6 indent-8 text-lg">{para}</p>
                  ))
                ) : (
                  <div className="text-stone-400 italic text-center py-12">
                    (Content not generated yet. Go to Editor.)
                  </div>
                )}
             </div>
          </div>

          {/* Page Footer */}
          <div className="px-8 md:px-16 pb-8 pt-4 flex justify-between text-stone-400 text-xs font-mono border-t border-stone-100 mt-8">
            <span>Page {activeChapterIndex + 1}</span>
            <span>{(activeChapter.content?.length || 0) / 500 | 0} min read</span>
          </div>
        </div>

        {/* Pagination Controls (Fixed) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg z-30">
           <button 
             disabled={activeChapterIndex === 0}
             onClick={() => setActiveChapterIndex(i => i - 1)}
             className="p-1 hover:text-saffron-400 disabled:opacity-30 transition-colors"
           >
             <ChevronLeft size={20} />
           </button>
           <span className="text-sm font-medium px-2">{activeChapterIndex + 1} / {book.chapters.length}</span>
           <button 
             disabled={activeChapterIndex === book.chapters.length - 1}
             onClick={() => setActiveChapterIndex(i => i + 1)}
             className="p-1 hover:text-saffron-400 disabled:opacity-30 transition-colors"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-6 flex flex-col gap-3 z-20">
        <button 
          onClick={togglePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-saffron-500 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
        >
          {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
        </button>
        <button 
          onClick={() => setShowChat(!showChat)}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${showChat ? 'bg-stone-800 text-white' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
        >
          <MessageSquare size={20} />
        </button>
      </div>

      {/* AI Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute top-0 right-0 w-96 h-full bg-white border-l border-stone-200 shadow-2xl z-40 flex flex-col"
          >
            <div className="h-16 border-b border-stone-100 flex items-center justify-between px-6 bg-stone-50">
              <span className="font-bold text-stone-800 flex items-center gap-2">
                <MessageSquare size={16} className="text-saffron-500"/> 
                Ask the Book
              </span>
              <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-stone-900">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
              {messages.length === 0 && (
                <div className="text-center text-stone-400 mt-10 text-sm px-8">
                  <p>I am the spirit of "{book.title}".</p>
                  <p className="mt-2">Ask me about characters, plot points, or hidden meanings.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-stone-900 text-white rounded-br-none' 
                      : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleAskBook} className="p-4 border-t border-stone-100 bg-white">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full pl-4 pr-12 py-3 bg-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400/50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-900 text-white rounded-lg hover:bg-saffron-500 transition-colors disabled:opacity-50 disabled:hover:bg-stone-900"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

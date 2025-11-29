
import React, { useState, useRef, useEffect } from 'react';
import { Book as BookType, ChatMessage, Character } from '../types';
import { geminiService } from '../services/geminiService';
import { Play, Pause, MessageSquare, X, Send, Volume2, Settings, ChevronLeft, ChevronRight, User, Mic } from 'lucide-react';
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
  
  // Character Interaction State
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // TTS State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      
      // Smart selection: Prioritize "Google US English", "Microsoft Zira", or other premium-sounding voices
      const preferred = available.find(v => v.name === 'Google US English') 
                     || available.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
                     || available.find(v => v.name.includes('Zira') && v.lang.startsWith('en'))
                     || available.find(v => v.name.includes('Samantha'))
                     || available.find(v => v.lang === 'en-US')
                     || available.find(v => v.lang.startsWith('en'));
      
      if (preferred) {
        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

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
        // Start new utterance
        synthesisRef.current.cancel();
        
        // Use content if available, otherwise summary
        const textToRead = activeChapter.content && activeChapter.content.length > 50 
          ? activeChapter.content 
          : activeChapter.summary;

        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Tuning for more natural audiobook style
        utterance.rate = 0.95; // Slightly measured pace
        utterance.pitch = 1.05; // Slightly brighter tone for clarity
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsPlaying(false);
        };
        
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

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper to render text with interactive character highlights
  const renderInteractiveText = (text: string) => {
    if (!book.characters || book.characters.length === 0) return text;

    // Create a regex pattern for all names, sorted by length to match longest first
    const sortedNames = [...book.characters].sort((a, b) => b.name.length - a.name.length);
    // Simple word boundary check to avoid partial matches inside words
    const pattern = new RegExp(`\\b(${sortedNames.map(c => escapeRegExp(c.name)).join('|')})\\b`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const character = book.characters.find(c => c.name.toLowerCase() === part.toLowerCase());
      if (character) {
         return (
           <span
             key={i}
             onClick={(e) => {
               e.stopPropagation();
               setSelectedCharacter(character);
             }}
             className="text-saffron-600 dark:text-saffron-400 font-semibold cursor-pointer border-b border-dashed border-saffron-400/50 hover:bg-saffron-100 dark:hover:bg-saffron-900/30 transition-colors"
             title={`Click to view profile: ${character.role}`}
           >
             {part}
           </span>
         );
      }
      return part;
    });
  };

  if (!book.chapters.length) {
     return <div className="p-12 text-center text-stone-500 dark:text-stone-400">The library is empty. Create a book first.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-stone-100 dark:bg-stone-900 relative overflow-hidden transition-colors duration-300">
      
      {/* Chapter Progress Bar */}
      <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 shrink-0">
         <motion.div 
           className="h-full bg-saffron-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
           initial={{ width: 0 }}
           animate={{ width: `${((activeChapterIndex + 1) / book.chapters.length) * 100}%` }}
           transition={{ duration: 0.5, ease: "easeInOut" }}
         />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Character Bio Modal */}
        <AnimatePresence>
          {selectedCharacter && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setSelectedCharacter(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-stone-100 dark:border-stone-800 relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-saffron-400/20 to-stone-200/20 dark:to-stone-800/20" />
                
                <div className="relative flex flex-col items-center text-center mt-4">
                  <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400 shadow-lg border-4 border-white dark:border-stone-900 mb-4">
                      <User size={40} />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white mb-1">{selectedCharacter.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 dark:text-saffron-400 mb-4 bg-saffron-50 dark:bg-saffron-900/20 px-3 py-1 rounded-full">
                      {selectedCharacter.role}
                  </span>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-sm">
                      {selectedCharacter.description}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCharacter(null)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  <X size={20} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reader Container */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${showChat ? 'mr-0 md:mr-96 hidden md:block' : 'mr-0'}`}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeChapterIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="max-w-3xl mx-auto min-h-full bg-ivory dark:bg-stone-950 shadow-2xl shadow-stone-300/50 dark:shadow-black/50 my-2 md:my-8 rounded-sm flex flex-col relative transition-colors duration-300"
            >
              
              {/* Book decoration (Binders) */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-stone-300 to-transparent dark:from-stone-800 opacity-50" />

              {/* Page Header */}
              <div className="px-6 md:px-16 pt-12 pb-4">
                <span className="text-xs font-bold tracking-widest text-stone-400 dark:text-stone-600 uppercase mb-2 block truncate">{book.title}</span>
                <h1 className="font-serif text-3xl md:text-4xl text-stone-900 dark:text-stone-100">{activeChapter.title}</h1>
              </div>

              {/* Page Content */}
              <div className="flex-1 px-6 md:px-16 py-6">
                <div className="prose prose-lg prose-stone dark:prose-invert font-serif leading-loose text-stone-800 dark:text-stone-300 max-w-none">
                    {activeChapter.content ? (
                      activeChapter.content.split('\n').map((para, i) => (
                        <p key={i} className="mb-6 indent-6 md:indent-8 text-base md:text-lg">
                          {renderInteractiveText(para)}
                        </p>
                      ))
                    ) : (
                      <div className="text-stone-400 italic text-center py-12">
                        (Content not generated yet. Go to Editor.)
                      </div>
                    )}
                </div>
              </div>

              {/* Page Footer */}
              <div className="px-6 md:px-16 pb-8 pt-4 flex justify-between text-stone-400 dark:text-stone-600 text-xs font-mono border-t border-stone-100 dark:border-stone-800 mt-8">
                <span>Page {activeChapterIndex + 1}</span>
                <span>{(activeChapter.content?.length || 0) / 500 | 0} min read</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pagination Controls (Floating) */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg z-30">
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
        <div className="absolute top-4 right-4 md:right-6 flex flex-col gap-3 z-20">
          <button 
            onClick={togglePlay}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-saffron-500 text-white' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
            title={selectedVoice ? `Read with ${selectedVoice.name}` : 'Read Aloud'}
          >
            {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
          </button>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${showChat ? 'bg-stone-800 text-white' : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
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
              className="absolute top-0 right-0 w-full md:w-96 h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-40 flex flex-col"
            >
              <div className="h-16 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between px-6 bg-stone-50 dark:bg-stone-900">
                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <MessageSquare size={16} className="text-saffron-500"/> 
                  Ask the Book
                </span>
                <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-200">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-900/50">
                {messages.length === 0 && (
                  <div className="text-center text-stone-400 dark:text-stone-500 mt-10 text-sm px-8">
                    <p>I am the spirit of "{book.title}".</p>
                    <p className="mt-2">Ask me about characters, plot points, or hidden meanings.</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-br-none' 
                        : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3 rounded-2xl rounded-bl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAskBook} className="p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
                <div className="relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full pl-4 pr-12 py-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-saffron-400/50 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-600"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors disabled:opacity-50 disabled:hover:bg-stone-900 dark:disabled:hover:bg-stone-100"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

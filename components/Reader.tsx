import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Book as BookType } from '../types';
import { markdownService } from '../services/markdownService';
import { Play, Pause, Settings, ChevronLeft, ChevronRight, Type, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReaderProps {
  book: BookType;
}

export const Reader: React.FC<ReaderProps> = ({ book }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(18); // in px
  const [lineHeight, setLineHeight] = useState(1.8); // as a multiplier
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const readerContentRef = useRef<HTMLDivElement>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    const stopSpeech = () => { if (synthesisRef.current) synthesisRef.current.cancel(); };
    window.addEventListener('beforeunload', stopSpeech);
    return () => {
      stopSpeech();
      window.removeEventListener('beforeunload', stopSpeech);
    };
  }, []);

  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsPlaying(false);
    }
    // Scroll to top of reader on chapter change
    if(readerContentRef.current) {
      readerContentRef.current.scrollTop = 0;
    }
  }, [activeChapterIndex]);

  const togglePlay = () => {
    if (!synthesisRef.current) return;
    if (isPlaying) {
      synthesisRef.current.cancel();
      setIsPlaying(false);
    } else {
      synthesisRef.current.cancel();
      // Simple text sanitization for TTS
      const textToRead = (activeChapter.content || activeChapter.summary).replace(/(\*\*|__|\*|_|#|`|~|>)/g, '');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      const voices = synthesisRef.current.getVoices();
      // Prioritize high-quality voices
      const bestVoice = 
        voices.find(v => v.name === "Google US English") || 
        voices.find(v => v.name === "Microsoft Zira Online (Natural) - English (United States)") ||
        voices.find(v => v.name === "Samantha") || 
        voices.find(v => v.lang === 'en-US');
        
      if (bestVoice) utterance.voice = bestVoice;
      
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => { console.error("TTS Error:", e); setIsPlaying(false); };
      
      synthesisRef.current.speak(utterance);
      setIsPlaying(true);
    }
  };

  const sanitizedHtmlContent = useMemo(() => {
    return markdownService.parse(activeChapter.content);
  }, [activeChapter.content]);

  if (!activeChapter) {
     return <div className="p-12 text-center text-stone-500 dark:text-stone-400">The library is empty. Create a book first.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] relative overflow-hidden transition-colors duration-300">
      
      <div className="w-full h-1 bg-stone-200/50 dark:bg-stone-800/50 shrink-0 absolute top-0 z-20">
         <motion.div 
           className="h-full bg-saffron-500"
           animate={{ width: `${((activeChapterIndex + 1) / book.chapters.length) * 100}%` }}
           transition={{ duration: 0.5, ease: "easeInOut" }}
         />
      </div>

      <div ref={readerContentRef} className="flex-1 flex overflow-y-auto justify-center bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-md">
        <div className="w-full max-w-4xl pt-16 pb-24 px-4 md:px-8 relative">
           <div 
             className="absolute inset-0 bg-ivory dark:bg-[#1A1816] z-0"
             style={{
                backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAXRJREFUaAXtV8sNwyAMbAk26TbpJt1EN5AmI3UR3UC7iT7+F0UlpAY70dghR6JZnkTDTASEpUmSpMkpSf0A/wN4E4CprAAwEwBS/gO4M0AXgGkAiC5dAPyQOADo4xcB0AtgMgAFAK4AnI7z/ABwZIBvAGzH+Q7gLgBfhgB8AMgB8BYA8wA/gNQD3wB4F4A5AO4A3L4/AnCBcT4AeA+A3QA/ARgD8ADgK4B/K893AEgC8AqAEwA3AbgA8A+AawD+B4A5AN8AOAJwFeB8A/AjgBcA/gOAAoCMAZgD4H0ARgD8A2AGgC8B3ADgKIALs/0DwNkApgC4Y3wBcB8APq8AbgK4A3AZgPkA/g8AG3e/vjP+AnArAPsBfADgGIA/AawD2AOwN4A5AE4AXAXYDzA9wI8APgO4A+AxgA8A/gXgDICrAN4AOAJgBIA/AfwA8AqAPQA+A1gC8A2AfwDcBeA6wH+wPZ9pmsbZ21JPAAAAAElFTkSuQmCC)',
                backgroundRepeat: 'repeat',
                opacity: 0.2
             }}
           />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ivory/80 dark:to-[#1A1816]/80 z-0" />
           
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeChapterIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <header className="mb-12 text-center">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 mb-2">{activeChapter.title}</h1>
                <p className="text-stone-500 dark:text-stone-400">Chapter {activeChapterIndex + 1}</p>
              </header>
              
              <div
                className={`prose prose-lg max-w-none transition-all duration-300 ${fontFamily === 'serif' ? 'prose-stone dark:prose-invert font-serif' : 'font-sans text-stone-800 dark:text-stone-200'}`}
                style={{ fontSize: `${fontSize}px`, lineHeight }}
                dangerouslySetInnerHTML={{ __html: sanitizedHtmlContent }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md text-white px-3 py-2 rounded-full shadow-lg">
          <button disabled={activeChapterIndex === 0} onClick={() => setActiveChapterIndex(i => i - 1)} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"><ChevronLeft size={20} /></button>
          <span className="text-sm font-medium px-2 min-w-[60px] text-center">{activeChapterIndex + 1} / {book.chapters.length}</span>
          <button disabled={activeChapterIndex === book.chapters.length - 1} onClick={() => setActiveChapterIndex(i => i + 1)} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>

        <button onClick={togglePlay} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isPlaying ? 'bg-saffron-500 text-white' : 'bg-stone-900/80 backdrop-blur-md text-white'}`}>
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1"/>}
        </button>

        <div className="relative">
           <button onClick={() => setShowSettings(!showSettings)} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-stone-900/80 backdrop-blur-md text-white">
             <Settings size={20} />
           </button>
           <AnimatePresence>
           {showSettings && (
             <motion.div 
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 10, scale: 0.95 }}
               className="absolute bottom-full right-0 mb-3 w-64 bg-white dark:bg-stone-800 rounded-xl shadow-2xl p-4 border border-stone-200 dark:border-stone-700"
             >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400">FONT STYLE</label>
                    <div className="flex gap-2 mt-2">
                       <button onClick={() => setFontFamily('serif')} className={`flex-1 py-2 text-sm rounded-lg border ${fontFamily === 'serif' ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-stone-100 dark:bg-stone-700 border-stone-200 dark:border-stone-600'}`}><Type/></button>
                       <button onClick={() => setFontFamily('sans')} className={`flex-1 py-2 text-sm rounded-lg border font-sans ${fontFamily === 'sans' ? 'bg-saffron-500 text-white border-saffron-500' : 'bg-stone-100 dark:bg-stone-700 border-stone-200 dark:border-stone-600'}`}>Aa</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400">FONT SIZE</label>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setFontSize(s => Math.max(12, s-1))} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700"><Minus size={14}/></button>
                      <span className="flex-1 text-center font-mono">{fontSize}px</span>
                      <button onClick={() => setFontSize(s => Math.min(32, s+1))} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700"><Plus size={14}/></button>
                    </div>
                  </div>
                   <div>
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400">LINE HEIGHT</label>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setLineHeight(s => Math.max(1.4, s-0.1))} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700"><Minus size={14}/></button>
                      <span className="flex-1 text-center font-mono">{lineHeight.toFixed(1)}</span>
                      <button onClick={() => setLineHeight(s => Math.min(2.4, s+0.1))} className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
             </motion.div>
           )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
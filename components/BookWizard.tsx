import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Sparkles, ArrowRight, CheckCircle2, ImageIcon, Wand2, AlertTriangle, Settings } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Book as BookType, GenerationParams, Chapter } from '../types';

interface BookWizardProps {
  onBookCreated: (book: BookType) => void;
}

// Confetti Component
const ConfettiParticle: React.FC<{ delay: number }> = ({ delay }) => (
  <motion.div
    initial={{ y: "0%", x: "50%", opacity: 1, scale: 0 }}
    animate={{ 
      y: ["0%", "120vh"], 
      x: ["50%", `${Math.random() * 100}%`], 
      opacity: [1, 1, 0],
      rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
      scale: [1, 0.5]
    }}
    transition={{ duration: 3 + Math.random(), delay: delay, ease: "easeOut" }}
    className="absolute top-0 w-3 h-3 rounded-full"
    style={{
      backgroundColor: ['#FBBF24', '#F472B6', '#60A5FA', '#34D399'][Math.floor(Math.random() * 4)],
      left: `${Math.random() * 100}%`
    }}
  />
);

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <ConfettiParticle key={i} delay={Math.random() * 2} />
      ))}
    </div>
  );
};

export const BookWizard: React.FC<BookWizardProps> = ({ onBookCreated }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState('');
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [generatedBook, setGeneratedBook] = useState<BookType | null>(null);
  const [liveCover, setLiveCover] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GenerationParams>({
    title: '',
    genre: 'Dark Romance',
    tone: 'Gothic & Mysterious',
    audience: 'Adult',
    prompt: '',
  });

  const handleChange = (field: keyof GenerationParams, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setStatus('generating');
    setErrorDetails('');
    setProgressStep('Designing cover art...');
    setProgressPercent(5);

    try {
      // 1. Start Cover Generation (Parallel)
      const coverPromise = geminiService.generateBookCover(
        formData.title,
        formData.genre,
        formData.tone
      ).then(url => {
        if(url) setLiveCover(url);
        return url;
      });

      // 2. Generate Structure
      setProgressStep('Architecting story structure...');
      setProgressPercent(15);
      
      const partialBook = await geminiService.generateBookStructure(
        formData.title,
        formData.genre,
        formData.tone,
        formData.audience,
        formData.prompt
      );

      if (!partialBook.chapters) {
        throw new Error("Failed to generate chapters");
      }

      // 3. Generate Content for EACH Chapter
      const fullyWrittenChapters: Chapter[] = [];
      const totalChapters = partialBook.chapters.length;

      for (let i = 0; i < totalChapters; i++) {
        const chapter = partialBook.chapters[i];
        
        // Update Progress
        const percent = 20 + Math.floor(((i) / totalChapters) * 70);
        setProgressPercent(percent);
        setProgressStep(`Writing Chapter ${i + 1}: ${chapter.title}`);
        
        // Use previous chapter summary for continuity context
        const prevSummary = i > 0 ? partialBook.chapters[i - 1].summary : undefined;
        
        const content = await geminiService.generateChapterContent(
          partialBook.title || formData.title,
          chapter,
          prevSummary
        );

        fullyWrittenChapters.push({
          ...chapter,
          content: content,
          isGenerated: true
        });
      }

      setProgressStep('Binding pages...');
      setProgressPercent(95);
      
      const coverImage = await coverPromise;

      const newBook: BookType = {
        id: crypto.randomUUID(),
        title: partialBook.title || formData.title,
        author: partialBook.author || 'AI & You',
        genre: formData.genre,
        tone: formData.tone,
        targetAudience: formData.audience,
        chapters: fullyWrittenChapters,
        characters: partialBook.characters || [],
        createdAt: new Date(),
        coverImage: coverImage || liveCover || `https://picsum.photos/seed/${Date.now()}/600/900`
      };

      setGeneratedBook(newBook);
      setProgressPercent(100);
      setStatus('complete');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      
      const msg = e.message || e.toString();
      if (msg.includes("API_KEY_MISSING") || msg.includes("AUTH_ERROR")) {
        // FIX: Updated error message as user can no longer configure API key.
        setErrorDetails("API Key is missing or invalid. The application is not configured correctly.");
      } else if (msg.includes("QUOTA") || msg.includes("429")) {
        setErrorDetails("Google API Quota exceeded. Please try again later or use a different key.");
      } else {
        setErrorDetails("Failed to generate book. Please check your internet connection.");
      }
    }
  };

  // Error State
  if (status === 'error') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-6">
              <AlertTriangle size={32} />
           </div>
           <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">Generation Failed</h2>
           <p className="text-stone-500 mb-8 max-w-md">{errorDetails}</p>
           
           <div className="flex gap-4">
              <button onClick={() => setStatus('idle')} className="px-6 py-2 bg-stone-200 dark:bg-stone-800 rounded-lg font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
                 Try Again
              </button>
           </div>
        </div>
     );
  }

  // Generating State
  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
         {/* Glassmorphism Card */}
         <div className="relative w-full max-w-4xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
            
            {/* Animated Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-500/20 rounded-full blur-[100px] animate-pulse" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
               
               {/* Left: Cover Preview */}
               <div className="flex-shrink-0 w-64 md:w-80">
                  <div className="aspect-[3/4] rounded-lg shadow-2xl overflow-hidden relative bg-stone-800 border border-white/10">
                     <AnimatePresence mode="wait">
                       {liveCover ? (
                         <motion.img 
                           key="cover"
                           initial={{ opacity: 0, scale: 1.1 }}
                           animate={{ opacity: 1, scale: 1 }}
                           src={liveCover} 
                           alt="Generated Cover"
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full flex flex-col items-center justify-center text-stone-500 gap-4 p-6 text-center"
                         >
                            <div className="relative">
                               <div className="absolute inset-0 bg-saffron-500/20 blur-xl rounded-full animate-pulse" />
                               <ImageIcon size={48} className="relative z-10 text-stone-400" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium animate-pulse text-stone-300">Designing Cover...</span>
                                <span className="text-xs font-serif text-stone-500 line-clamp-2 px-2">"{formData.title}"</span>
                            </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                     
                     {/* Scanning Line Effect */}
                     {!liveCover && (
                       <motion.div 
                         animate={{ top: ['0%', '100%'] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                         className="absolute left-0 w-full h-1 bg-saffron-400/50 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                       />
                     )}
                  </div>
               </div>

               {/* Right: Progress Ring & Text */}
               <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 dark:text-white mb-6">
                    Forging your Story
                  </h2>

                  {/* Circular Progress */}
                  <div className="relative w-24 h-24 mb-6">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-200 dark:text-stone-800" />
                        <motion.circle 
                          cx="48" cy="48" r="42" 
                          stroke="currentColor" 
                          strokeWidth="8" 
                          fill="transparent" 
                          className="text-saffron-500"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: progressPercent / 100 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ strokeDasharray: "1 1" }} // Normalized logic handled by pathLength
                        />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-stone-700 dark:text-stone-300">
                        {progressPercent}%
                     </div>
                  </div>

                  <motion.div
                    key={progressStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg text-stone-600 dark:text-stone-300 font-medium"
                  >
                    {progressStep}
                  </motion.div>
                  
                  <div className="mt-8 flex gap-2">
                     <span className="w-2 h-2 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '0s'}} />
                     <span className="w-2 h-2 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '0.2s'}} />
                     <span className="w-2 h-2 rounded-full bg-saffron-500 animate-bounce" style={{ animationDelay: '0.4s'}} />
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // Complete State
  if (status === 'complete' && generatedBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
        <Confetti />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-5xl w-full flex flex-col md:flex-row gap-10 items-center border border-white/40 dark:border-white/10"
        >
          {/* Generated Cover */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-72 md:w-96 shrink-0 transform hover:scale-[1.02] transition-transform duration-500"
          >
             <div className="aspect-[3/4] rounded-xl shadow-2xl overflow-hidden relative bg-stone-800 ring-1 ring-white/20">
                <img 
                  src={generatedBook.coverImage} 
                  alt={generatedBook.title}
                  className="w-full h-full object-cover"
                />
             </div>
          </motion.div>

          {/* Success Details */}
          <div className="flex-1 space-y-8 text-center md:text-left w-full">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full text-sm font-bold mb-6 tracking-wide uppercase"
              >
                <CheckCircle2 size={16} />
                <span>Ready to Publish</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-serif text-5xl md:text-6xl font-bold text-stone-900 dark:text-white mb-3 leading-tight"
              >
                {generatedBook.title}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-stone-500 dark:text-stone-400 font-medium"
              >
                by {generatedBook.author}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-stone-50/50 dark:bg-black/20 rounded-2xl p-6 border border-stone-200/50 dark:border-white/5 max-h-[250px] overflow-y-auto custom-scrollbar"
            >
              <h3 className="font-bold text-stone-400 dark:text-stone-500 mb-4 text-xs uppercase tracking-widest">Chapter Outline</h3>
              <ul className="space-y-3 text-left">
                {generatedBook.chapters.map((ch, i) => (
                  <li key={ch.id} className="flex items-center gap-4 text-stone-600 dark:text-stone-300 text-sm group">
                    <span className="font-mono text-saffron-500 font-bold opacity-70 group-hover:opacity-100">{(i + 1).toString().padStart(2, '0')}</span>
                    <span className="font-medium truncate">{ch.title}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => onBookCreated(generatedBook)}
              className="w-full md:w-auto px-10 py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-lg font-bold rounded-2xl hover:bg-saffron-500 dark:hover:bg-saffron-400 hover:text-white transition-all shadow-xl hover:shadow-saffron-500/30 flex items-center justify-center gap-3 active:scale-95"
            >
              Start Reading
              <ArrowRight size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Form View
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden"
      >
        <div className="bg-stone-900 dark:bg-black/40 p-10 text-white relative overflow-hidden">
           {/* Header Art */}
           <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[100px]" />
              <div className="absolute bottom-[-50%] left-[-10%] w-[500px] h-[500px] bg-teal-600 rounded-full blur-[100px]" />
           </div>

           <div className="relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
               Create a New Book
            </h2>
            <p className="text-stone-300 text-lg max-w-lg leading-relaxed">
               Describe your vision, and our AI Master Author will forge the plot, characters, and cover art instantly.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-8">
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-3">Book Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., The Echoes of Eternity"
              className="w-full px-6 py-4 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-xl font-serif text-stone-900 dark:text-white transition-all placeholder:text-stone-300 dark:placeholder:text-stone-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Genre</label>
              <div className="relative">
                <select
                  value={formData.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  className="w-full px-6 py-4 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-stone-900 dark:text-white appearance-none cursor-pointer font-medium"
                >
                  <option>Dark Romance</option>
                  <option>Science Fiction</option>
                  <option>Cyberpunk</option>
                  <option>High Fantasy</option>
                  <option>Cozy Mystery</option>
                  <option>Psychological Thriller</option>
                  <option>Romance</option>
                  <option>Non-Fiction / Business</option>
                  <option>Horror</option>
                  <option>Historical Fiction</option>
                  <option>Young Adult</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                   <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Tone</label>
              <div className="relative">
                <select
                  value={formData.tone}
                  onChange={(e) => handleChange('tone', e.target.value)}
                  className="w-full px-6 py-4 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-stone-900 dark:text-white appearance-none cursor-pointer font-medium"
                >
                  <option>Gothic & Mysterious</option>
                  <option>Adventurous & Epic</option>
                  <option>Dark & Gritty</option>
                  <option>Whimsical & Magical</option>
                  <option>Witty & Humorous</option>
                  <option>Intellectual & Academic</option>
                  <option>Romantic & Emotional</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                   <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>

           <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">Prompt & Premise</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="Describe the plot, characters, or specific vibes you want..."
              rows={4}
              className="w-full px-6 py-4 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 text-stone-900 dark:text-white transition-all resize-none placeholder:text-stone-300 dark:placeholder:text-stone-700"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.title}
            className="w-full py-5 bg-stone-900 dark:bg-white hover:bg-saffron-500 dark:hover:bg-saffron-400 text-white dark:text-stone-900 font-bold text-lg rounded-xl shadow-xl hover:shadow-saffron-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-3"
          >
            <Sparkles size={22} className="text-saffron-400 dark:text-saffron-600" />
            <span>Generate Masterpiece</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
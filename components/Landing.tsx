
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, PenTool, Book, Share2 } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 transition-colors duration-300">
      
      {/* Content */}
      <div className="z-10 max-w-4xl mx-auto text-center mt-[-4rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-stone-900/50 border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 shadow-sm"
        >
          <Sparkles size={14} className="text-saffron-500" />
          <span>AI-Powered Publishing Studio</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-stone-900 dark:text-stone-50 mb-8 drop-shadow-sm"
        >
          Imagine. Generate. <br />
          <span className="italic font-light text-stone-500 dark:text-stone-400/80">Publish.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto mb-12 font-body leading-relaxed"
        >
          From a single idea to a complete, published book. 
          Lumina uses advanced AI to help you write, edit, and share your stories with the world.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-stone-900 dark:bg-stone-100 text-ivory dark:text-stone-900 rounded-full text-lg font-medium hover:bg-saffron-500 dark:hover:bg-saffron-400 hover:text-white dark:hover:text-stone-900 transition-all duration-300 shadow-xl hover:shadow-saffron-500/25 hover:-translate-y-1"
          >
            Start Writing Now
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Feature Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full px-4"
      >
        {[
          { icon: PenTool, title: "AI Co-Author", desc: "Generate outlines, chapters, and beat writer's block instantly." },
          { icon: Book, title: "Cloud Reader", desc: "Host your books with immersive reading modes and TTS." },
          { icon: Share2, title: "Global Reach", desc: "Export to ePub, PDF, or share a live web link." }
        ].map((feature, idx) => (
          <div key={idx} className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/40 dark:bg-stone-900/40 border border-white/50 dark:border-stone-800/50 backdrop-blur-md hover:bg-white/60 dark:hover:bg-stone-800/60 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-4 text-stone-700 dark:text-stone-300 shadow-inner">
              <feature.icon size={24} />
            </div>
            <h3 className="font-serif font-bold text-xl mb-2 text-stone-900 dark:text-stone-100">{feature.title}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

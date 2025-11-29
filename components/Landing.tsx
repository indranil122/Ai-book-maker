
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, PenTool, Book, Share2, Heart } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

const SpotlightCard: React.FC<{ icon: React.ElementType, title: string, desc: string, delay: number }> = ({ icon: Icon, title, desc, delay }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      ref={divRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-white/40 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-md overflow-hidden group transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(245,158,11,0.15), transparent 40%)`,
        }}
      />
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
           background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)` 
        }}
      />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-6 text-stone-700 dark:text-stone-300 shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:text-saffron-500 dark:group-hover:text-saffron-400">
          <Icon size={28} />
        </div>
        <h3 className="font-serif font-bold text-2xl mb-3 text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col min-h-screen w-full transition-colors duration-300">
      
      {/* Main Content Section */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-20 relative z-10">
        
        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-stone-900/50 border border-stone-200/50 dark:border-stone-800/50 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 shadow-sm hover:bg-white/80 dark:hover:bg-stone-800/80 transition-colors cursor-default"
          >
            <Sparkles size={14} className="text-saffron-500" />
            <span>AI-Powered Publishing Studio</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-stone-900 dark:text-stone-50 mb-8 drop-shadow-sm tracking-tight"
          >
            Imagine. Generate. <br />
            <span className="italic font-light text-stone-500 dark:text-stone-400/80 bg-gradient-to-r from-stone-400 to-stone-600 dark:from-stone-400 dark:to-stone-200 bg-clip-text text-transparent">Publish.</span>
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
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-stone-900 dark:bg-stone-100 text-ivory dark:text-stone-900 rounded-full text-lg font-bold hover:bg-saffron-500 dark:hover:bg-saffron-400 hover:text-white dark:hover:text-stone-900 transition-all duration-300 shadow-xl hover:shadow-saffron-500/25 hover:-translate-y-1 active:scale-95"
            >
              Start Writing Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Feature Grid with Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full px-4">
          {[
            { icon: PenTool, title: "AI Co-Author", desc: "Generate outlines, chapters, and beat writer's block instantly." },
            { icon: Book, title: "Cloud Reader", desc: "Host your books with immersive reading modes and TTS." },
            { icon: Share2, title: "Global Reach", desc: "Export to ePub, PDF, or share a live web link." }
          ].map((feature, idx) => (
            <SpotlightCard key={idx} {...feature} delay={0.5 + idx * 0.1} />
          ))}
        </div>
      </div>

      {/* Modern Footer */}
      <footer className="w-full relative mt-auto border-t border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-950/60 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 items-start">
            
            {/* Brand Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex flex-col">
                <h2 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 dark:text-stone-50 tracking-tighter mb-2">
                  Lumina AI
                </h2>
                <div className="flex items-center gap-2">
                   <div className="h-px w-8 bg-saffron-500"></div>
                   <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                     by Chatterjee House of Apps
                   </p>
                </div>
              </div>
              <p className="text-stone-600 dark:text-stone-400 max-w-sm leading-relaxed">
                Empowering the next generation of storytellers with artificial intelligence. 
                Write, publish, and inspire without boundaries.
              </p>
            </div>

            {/* Quote Section */}
            <div className="lg:col-span-4 lg:col-start-7 bg-stone-100 dark:bg-stone-900/50 p-8 rounded-3xl border border-stone-200 dark:border-stone-800">
               <Sparkles className="text-saffron-500 mb-4" size={24} />
               <blockquote className="font-serif text-2xl md:text-3xl italic text-stone-800 dark:text-stone-200 leading-tight mb-6">
                 "There is no greater agony than bearing an untold story inside you."
               </blockquote>
               <cite className="not-italic font-bold text-sm tracking-widest uppercase text-stone-500 dark:text-stone-500">
                 — Maya Angelou
               </cite>
            </div>

            {/* Links Section */}
            <div className="lg:col-span-2 flex flex-col gap-4 text-stone-600 dark:text-stone-400 font-medium text-sm">
               <span className="text-stone-900 dark:text-stone-100 font-bold mb-2">Platform</span>
               <a href="#" className="hover:text-saffron-500 transition-colors">About Us</a>
               <a href="#" className="hover:text-saffron-500 transition-colors">Features</a>
               <a href="#" className="hover:text-saffron-500 transition-colors">Pricing</a>
               <a href="#" className="hover:text-saffron-500 transition-colors">API Access</a>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-medium uppercase tracking-wider">
             <span>© {new Date().getFullYear()} Lumina Studio. All rights reserved.</span>
             <div className="flex items-center gap-1">
               Made with <Heart size={12} className="text-red-500 fill-red-500" /> by Chatterjee House of Apps
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { BookOpen, Compass, Moon, Sun, Menu, X, Edit3, Library } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ColorBends from './ColorBends';

interface AppShellProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentView, setView, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-stone-900 dark:text-stone-100 selection:bg-saffron-400/30 transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Background Shader */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-stone-950">
        <ColorBends
          className="w-full h-full opacity-60"
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={30}
          speed={0.3}
          scale={1.2}
          frequency={1.4}
          warpStrength={1.2}
          mouseInfluence={0.8}
          parallax={0.6}
          noise={0.08}
          transparent
        />
        {/* Noise Overlay for texture consistency */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-150 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 h-20 transition-all duration-300">
        {/* Glassmorphism Header Background */}
        <div className="absolute inset-0 bg-white/70 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-sm" />
        
        <div className="relative max-w-[1920px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo Section */}
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => handleNavClick(ViewState.LANDING)}
          >
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-10 h-10 bg-stone-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-stone-900 shadow-lg shadow-purple-500/20"
            >
              <BookOpen size={22} />
            </motion.div>
            <div className="flex flex-col -space-y-1">
              <span className="font-serif font-bold text-2xl tracking-tight text-stone-900 dark:text-white group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors duration-300 drop-shadow-sm">
                Lumina
              </span>
              <span className="text-[0.6rem] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest font-sans opacity-80">
                by Chatterjee House of Apps
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/40 dark:bg-black/20 p-1.5 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-md shadow-lg shadow-black/5">
            {[
              { id: ViewState.EXPLORE, label: 'Explore', icon: Compass },
              { id: ViewState.WIZARD, label: 'Create', icon: Edit3 },
              { id: ViewState.EDITOR, label: 'Editor', icon: BookOpen },
              { id: ViewState.READER, label: 'Library', icon: Library },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                  ${currentView === item.id 
                    ? 'text-stone-900 dark:text-white bg-white dark:bg-white/10 shadow-md' 
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'}
                `}
              >
                {currentView === item.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={16} className={currentView === item.id ? "text-saffron-500" : ""} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-stone-600 dark:text-stone-300 hover:text-saffron-500 dark:hover:text-saffron-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-full transition-all duration-300 active:scale-95"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-2xl pt-24 px-6 md:hidden overflow-hidden"
          >
             <nav className="flex flex-col gap-4">
                <button onClick={() => handleNavClick(ViewState.WIZARD)} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm active:scale-95 transition-transform">
                  <div className="w-12 h-12 bg-saffron-100 dark:bg-saffron-500/20 text-saffron-600 dark:text-saffron-400 rounded-xl flex items-center justify-center shadow-inner">
                    <Edit3 size={24} />
                  </div>
                  <div className="text-left">
                    <span className="block font-serif font-bold text-lg text-stone-900 dark:text-white">Create New Book</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">Start from scratch</span>
                  </div>
                </button>
                
                {[
                  { id: ViewState.EXPLORE, label: 'Explore Marketplace', icon: Compass },
                  { id: ViewState.EDITOR, label: 'Open Editor', icon: Edit3 },
                  { id: ViewState.READER, label: 'My Library', icon: Library },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => handleNavClick(item.id)} 
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 transition-colors text-stone-600 dark:text-stone-300 font-medium"
                  >
                     <item.icon size={24} /> {item.label}
                  </button>
                ))}
             </nav>
             
             <div className="absolute bottom-10 left-0 w-full px-8 text-center">
                <div className="w-12 h-1 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto mb-4" />
                <p className="text-[0.65rem] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
                  Chatterjee House of Apps
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow relative w-full max-w-[1920px] mx-auto transition-opacity duration-300">
        {children}
      </main>
    </div>
  );
};
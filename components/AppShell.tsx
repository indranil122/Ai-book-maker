
import React, { useState } from 'react';
import { BookOpen, Compass, Moon, Sun, Menu, X, Edit3, Library } from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen flex flex-col font-sans bg-ivory text-stone-900 dark:bg-stone-950 dark:text-stone-100 selection:bg-saffron-200 dark:selection:bg-saffron-900/50 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ivory/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group z-50"
            onClick={() => handleNavClick(ViewState.LANDING)}
          >
            <div className="w-9 h-9 bg-stone-900 dark:bg-stone-100 rounded-lg flex items-center justify-center text-ivory dark:text-stone-900 group-hover:bg-saffron-500 dark:group-hover:bg-saffron-500 transition-colors duration-300 shrink-0 shadow-sm">
              <BookOpen size={20} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif font-bold text-xl tracking-tight leading-none text-stone-900 dark:text-stone-100 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors">Lumina</span>
              <span className="text-[0.6rem] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-widest font-sans leading-none mt-1 hidden sm:block">by Chatterjee House of Apps</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-400">
            <button 
              onClick={() => setView(ViewState.EXPLORE)}
              className={`flex items-center gap-2 hover:text-stone-900 dark:hover:text-stone-100 transition-colors ${currentView === ViewState.EXPLORE ? 'text-saffron-600 dark:text-saffron-400' : ''}`}
            >
              <Compass size={16} />
              Explore
            </button>
            <button 
              onClick={() => setView(ViewState.WIZARD)}
              className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors ${currentView === ViewState.WIZARD ? 'text-saffron-600 dark:text-saffron-400' : ''}`}
            >
              Create
            </button>
            <button 
              onClick={() => setView(ViewState.EDITOR)}
               className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors ${currentView === ViewState.EDITOR ? 'text-saffron-600 dark:text-saffron-400' : ''}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setView(ViewState.READER)}
               className={`hover:text-stone-900 dark:hover:text-stone-100 transition-colors ${currentView === ViewState.READER ? 'text-saffron-600 dark:text-saffron-400' : ''}`}
            >
              Library
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors z-50"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-50"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-ivory dark:bg-stone-950 pt-20 px-6 md:hidden"
          >
             <nav className="flex flex-col gap-6 text-lg font-serif font-medium text-stone-800 dark:text-stone-200">
                <button onClick={() => handleNavClick(ViewState.WIZARD)} className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                  <div className="w-10 h-10 bg-saffron-100 dark:bg-saffron-900/30 text-saffron-600 dark:text-saffron-400 rounded-full flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  Create New Book
                </button>
                <button onClick={() => handleNavClick(ViewState.EXPLORE)} className="flex items-center gap-4 p-2 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                   <Compass size={24} /> Explore
                </button>
                <button onClick={() => handleNavClick(ViewState.EDITOR)} className="flex items-center gap-4 p-2 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                   <Edit3 size={24} /> Editor
                </button>
                <button onClick={() => handleNavClick(ViewState.READER)} className="flex items-center gap-4 p-2 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors">
                   <Library size={24} /> Library
                </button>
             </nav>
             
             <div className="absolute bottom-8 left-0 w-full px-6 text-center">
                <p className="text-xs text-stone-400 dark:text-stone-600 uppercase tracking-widest">Designed by Chatterjee House of Apps</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};

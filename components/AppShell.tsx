import React from 'react';
import { BookOpen, Feather, Sparkles, User, Layout } from 'lucide-react';
import { ViewState } from '../types';

interface AppShellProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentView, setView }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-ivory text-stone-900 selection:bg-saffron-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setView(ViewState.LANDING)}
          >
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-ivory group-hover:bg-saffron-500 transition-colors duration-300">
              <BookOpen size={18} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Lumina</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button 
              onClick={() => setView(ViewState.WIZARD)}
              className={`hover:text-stone-900 transition-colors ${currentView === ViewState.WIZARD ? 'text-saffron-600' : ''}`}
            >
              Create
            </button>
            <button 
              onClick={() => setView(ViewState.EDITOR)}
               className={`hover:text-stone-900 transition-colors ${currentView === ViewState.EDITOR ? 'text-saffron-600' : ''}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setView(ViewState.READER)}
               className={`hover:text-stone-900 transition-colors ${currentView === ViewState.READER ? 'text-saffron-600' : ''}`}
            >
              Library
            </button>
          </nav>

          <div className="flex items-center gap-4">
             <button className="p-2 rounded-full hover:bg-stone-100 transition-colors">
              <User size={20} className="text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};

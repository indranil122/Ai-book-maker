
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Landing } from './components/Landing';
import { BookWizard } from './components/BookWizard';
import { Editor } from './components/Editor';
import { Reader } from './components/Reader';
import { ViewState, Book } from './types';
import { AnimatePresence, motion } from 'framer-motion';

// Dummy Data for initial testing if needed
const MOCK_BOOK: Book = {
  id: '1',
  title: 'The Silent Void',
  author: 'AI Architect',
  genre: 'Sci-Fi',
  tone: 'Dark',
  targetAudience: 'Adult',
  createdAt: new Date(),
  chapters: [
    { id: 'c1', title: 'Awakening', summary: 'The protagonist wakes up in a cryo-pod.', content: "The hiss of the cryo-seal breaking was the first sound in a century. Cold vapor poured out, kissing the floor like a phantom fog. Kael gasped, his lungs burning as they reinflated with stale, recycled air. \n\n'System report,' he croaked, his voice unfamiliar to his own ears. \n\nNo answer. Just the hum of the ship's dying reactor. He pulled himself over the edge of the pod, his muscles trembling like overstressed cables. The bridge was dark, save for the emergency strobes pulsating in a rhythmic red warning. \n\nHe was alone. Or at least, he hoped he was.", isGenerated: true },
    { id: 'c2', title: 'The Signal', summary: 'A distress beacon is found.', content: '', isGenerated: false }
  ],
  characters: [
    { name: 'Kael', role: 'Protagonist', description: 'A former starship commander awakened from cryo-sleep into a dead universe. He is resourceful but haunted by the past.' },
    { name: 'System', role: 'AI', description: 'The ship’s malfunctioning artificial intelligence, prone to cryptic errors and glitches.' }
  ]
};

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.LANDING);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumina-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lumina-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lumina-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleStart = () => {
    setView(ViewState.WIZARD);
  };

  const handleBookCreated = (book: Book) => {
    setCurrentBook(book);
    setView(ViewState.EDITOR);
  };

  const handleBookUpdate = (updatedBook: Book) => {
    setCurrentBook(updatedBook);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return <Landing onStart={handleStart} />;
      case ViewState.WIZARD:
        return <BookWizard onBookCreated={handleBookCreated} />;
      case ViewState.EDITOR:
        return currentBook ? <Editor book={currentBook} onUpdateBook={handleBookUpdate} /> : <div className="p-12 text-center text-stone-500 dark:text-stone-400 font-serif italic">Please create a book first to enter the Editor.</div>;
      case ViewState.READER:
        // Library might be public or private, let's allow public view for now or mock book if no user
        return currentBook ? <Reader book={currentBook} /> : <Reader book={MOCK_BOOK} />;
      default:
        return <Landing onStart={handleStart} />;
    }
  };

  return (
    <AppShell 
      currentView={currentView} 
      setView={setView} 
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

export default App;

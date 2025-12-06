
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Landing } from './components/Landing';
import { BookWizard } from './components/BookWizard';
import { Editor } from './components/Editor';
import { Reader } from './components/Reader';
import { Library } from './components/Library';
import { ViewState, Book } from './types';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.LANDING);
  
  // State management for multiple books
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumina-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Load books from localStorage on initial render
  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem('lumina-books');
      if (savedBooks) {
        // Parse and revive dates
        const parsedBooks = JSON.parse(savedBooks).map((book: any) => ({
            ...book,
            createdAt: new Date(book.createdAt)
        }));
        setBooks(parsedBooks);
      }
    } catch (error) {
        console.error("Failed to load books from localStorage", error);
        setBooks([]);
    }
  }, []);

  // Save books to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lumina-books', JSON.stringify(books));
    } catch (error) {
      console.error("Failed to save books to localStorage", error);
    }
  }, [books]);

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
    setBooks(prev => [...prev, book]);
    setActiveBookId(book.id);
    setView(ViewState.EDITOR);
  };

  const handleBookUpdate = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };
  
  const handleSelectBook = (bookId: string, targetView: ViewState.EDITOR | ViewState.READER) => {
    setActiveBookId(bookId);
    setView(targetView);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (activeBookId === bookId) {
      setActiveBookId(null);
    }
  };

  const activeBook = books.find(b => b.id === activeBookId);

  const renderView = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return <Landing onStart={handleStart} />;
      case ViewState.WIZARD:
        return <BookWizard onBookCreated={handleBookCreated} />;
      case ViewState.LIBRARY:
        return <Library books={books} onSelectBook={handleSelectBook} onDeleteBook={handleDeleteBook} onCreateNew={handleStart} />;
      case ViewState.EDITOR:
        return activeBook 
          ? <Editor book={activeBook} onUpdateBook={handleBookUpdate} /> 
          : <div className="p-12 text-center text-stone-500 dark:text-stone-400 font-serif italic">No book selected. Please go to your library.</div>;
      case ViewState.READER:
        return activeBook 
          ? <Reader book={activeBook} /> 
          : <div className="p-12 text-center text-stone-500 dark:text-stone-400 font-serif italic">No book selected to read.</div>;
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, ViewState } from '../types';
import { Plus, BookOpen, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

interface LibraryProps {
  books: Book[];
  onSelectBook: (bookId: string, view: ViewState.EDITOR | ViewState.READER) => void;
  onDeleteBook: (bookId: string) => void;
  onCreateNew: () => void;
}

const BookCard: React.FC<{ book: Book, onSelect: (view: ViewState.EDITOR | ViewState.READER) => void, onDelete: () => void, delay: number }> = ({ book, onSelect, onDelete, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: delay * 0.05, ease: "easeOut" }}
      className="bg-white/50 dark:bg-stone-900/50 backdrop-blur-md rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all group border border-stone-200/50 dark:border-stone-800/50"
    >
      <div className="aspect-[3/4] rounded-lg overflow-hidden mb-4 relative bg-stone-200 dark:bg-stone-800">
        {book.coverImage && <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </div>
      <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-tight mb-1 truncate group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors">{book.title}</h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">by {book.author}</p>
      
      <div className="flex items-center gap-2">
        <button onClick={() => onSelect(ViewState.READER)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors"><BookOpen size={14}/> Read</button>
        <button onClick={() => onSelect(ViewState.EDITOR)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"><Edit size={14}/></button>
        <button onClick={onDelete} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
      </div>
    </motion.div>
  );
};

export const Library: React.FC<LibraryProps> = ({ books, onSelectBook, onDeleteBook, onCreateNew }) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleDelete = (bookId: string) => {
        onDeleteBook(bookId);
        setConfirmDeleteId(null);
    }
    
    return (
        <div className="min-h-screen p-6 md:p-12">
            <AnimatePresence>
                {confirmDeleteId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-stone-200 dark:border-stone-800">
                           <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                              <AlertTriangle size={24} />
                           </div>
                           <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-white mb-2">Are you sure?</h3>
                           <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">This will permanently delete "{books.find(b=>b.id === confirmDeleteId)?.title}". This action cannot be undone.</p>
                           <div className="flex gap-4">
                               <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-700">Cancel</button>
                               <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete</button>
                           </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
                    <div>
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 dark:text-white mb-2">My Library</h1>
                        <p className="text-stone-500 dark:text-stone-400">{books.length} {books.length === 1 ? 'project' : 'projects'}</p>
                    </div>
                    <button onClick={onCreateNew} className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-lg shadow-saffron-500/20 transition-all">
                        <Plus size={18}/> Create New Book
                    </button>
                </div>

                {books.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <AnimatePresence>
                        {books.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((book, index) => (
                            <BookCard 
                                key={book.id} 
                                book={book}
                                onSelect={(view) => onSelectBook(book.id, view)}
                                onDelete={() => setConfirmDeleteId(book.id)}
                                delay={index}
                            />
                        ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                        <BookOpen size={48} className="mx-auto text-stone-300 dark:text-stone-700 mb-4"/>
                        <h3 className="text-xl font-bold font-serif text-stone-700 dark:text-stone-300 mb-2">Your library is empty</h3>
                        <p className="text-stone-500 dark:text-stone-400 mb-6">Click "Create New Book" to start your first masterpiece.</p>
                        <button onClick={onCreateNew} className="px-5 py-2 bg-stone-200 dark:bg-stone-800 rounded-lg font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">
                           Get Started
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

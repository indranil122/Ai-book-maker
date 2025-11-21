import React, { useState, useEffect } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { Save, RefreshCw, ChevronLeft, ChevronRight, Wand2, Loader2 } from 'lucide-react';

interface EditorProps {
  book: BookType;
  onUpdateBook: (updatedBook: BookType) => void;
}

export const Editor: React.FC<EditorProps> = ({ book, onUpdateBook }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeChapter = book.chapters[activeChapterIndex];

  const handleContentChange = (newContent: string) => {
    const updatedChapters = [...book.chapters];
    updatedChapters[activeChapterIndex] = {
      ...updatedChapters[activeChapterIndex],
      content: newContent
    };
    onUpdateBook({ ...book, chapters: updatedChapters });
  };

  const generateContent = async () => {
    if (!activeChapter) return;
    setIsGenerating(true);
    try {
      const prevChapterSummary = activeChapterIndex > 0 ? book.chapters[activeChapterIndex - 1].summary : undefined;
      const content = await geminiService.generateChapterContent(book.title, activeChapter, prevChapterSummary);
      
      // Simulate typing effect or just set it
      handleContentChange(content);
      
      const updatedChapters = [...book.chapters];
      updatedChapters[activeChapterIndex].isGenerated = true;
      onUpdateBook({ ...book, chapters: updatedChapters });

    } catch (error) {
      console.error(error);
      alert("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!book.chapters.length) {
    return <div className="p-12 text-center">No chapters found. Please create a book first.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar - Chapter List */}
      <aside className="w-72 bg-stone-100 border-r border-stone-200 overflow-y-auto hidden md:block">
        <div className="p-5 border-b border-stone-200">
          {/* Cover Image in Sidebar */}
          {book.coverImage && (
             <div className="w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden shadow-md">
               <img 
                 src={book.coverImage} 
                 alt={book.title} 
                 className="w-full h-full object-cover"
               />
             </div>
          )}
          <h3 className="font-serif font-bold text-stone-900 text-lg leading-tight mb-1">{book.title}</h3>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">{book.chapters.length} Chapters</p>
        </div>
        <ul className="py-2 space-y-0.5">
          {book.chapters.map((chapter, idx) => (
            <li key={chapter.id}>
              <button
                onClick={() => setActiveChapterIndex(idx)}
                className={`w-full text-left px-5 py-3 text-sm transition-all border-l-4 ${
                  activeChapterIndex === idx 
                    ? 'bg-white border-saffron-500 font-semibold text-stone-900 shadow-sm' 
                    : 'border-transparent text-stone-600 hover:bg-stone-200/50 hover:text-stone-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-stone-400 font-mono mb-0.5">Chapter {idx + 1}</span>
                    <span className="truncate">{chapter.title}</span>
                  </div>
                  {chapter.isGenerated && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title="Content Generated" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-ivory relative">
        {/* Toolbar */}
        <div className="h-14 border-b border-stone-200 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm">
           <div className="flex items-center gap-2 overflow-hidden">
             <h2 className="font-medium text-stone-700 truncate">
                <span className="text-stone-400 font-normal mr-2">Editing:</span>
                {activeChapter.title}
             </h2>
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <button 
               onClick={generateContent}
               disabled={isGenerating}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-saffron-700 bg-saffron-50 hover:bg-saffron-100 rounded-md transition-colors disabled:opacity-50"
             >
               {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
               {activeChapter.content ? 'Rewrite with AI' : 'Generate Content'}
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors">
               <Save size={14} /> Save
             </button>
           </div>
        </div>

        {/* Editor Input */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative">
          <div className="max-w-3xl mx-auto">
            {isGenerating && !activeChapter.content && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-saffron-500 mb-3" size={32} />
                  <p className="text-stone-500 animate-pulse font-serif text-lg">Drafting chapter content...</p>
               </div>
            )}
            <textarea
              value={activeChapter.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing or click 'Generate Content' to let AI take the lead..."
              className="w-full h-[70vh] bg-transparent border-none focus:ring-0 text-lg md:text-xl font-serif leading-loose text-stone-800 resize-none placeholder:text-stone-300 placeholder:font-sans placeholder:italic focus:outline-none selection:bg-saffron-100"
            />
          </div>
        </div>

        {/* Footer Nav */}
        <div className="h-12 border-t border-stone-200 flex items-center justify-between px-4 bg-stone-50 text-stone-500">
           <button 
             disabled={activeChapterIndex === 0}
             onClick={() => setActiveChapterIndex(i => i - 1)}
             className="flex items-center gap-1 text-sm hover:text-stone-900 disabled:opacity-30 px-2 py-1 rounded transition-colors"
           >
             <ChevronLeft size={16} /> Previous
           </button>
           <span className="text-xs font-mono bg-stone-200/50 px-2 py-0.5 rounded text-stone-600">
             {activeChapter.content.split(/\s+/).filter(w => w.length > 0).length} words
           </span>
           <button 
             disabled={activeChapterIndex === book.chapters.length - 1}
             onClick={() => setActiveChapterIndex(i => i + 1)}
             className="flex items-center gap-1 text-sm hover:text-stone-900 disabled:opacity-30 px-2 py-1 rounded transition-colors"
           >
             Next <ChevronRight size={16} />
           </button>
        </div>
      </main>
    </div>
  );
};
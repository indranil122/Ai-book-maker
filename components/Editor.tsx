
import React, { useState, useRef } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { Save, RefreshCw, ChevronLeft, ChevronRight, Wand2, Loader2, ImageIcon, PenLine, X, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
  book: BookType;
  onUpdateBook: (updatedBook: BookType) => void;
}

export const Editor: React.FC<EditorProps> = ({ book, onUpdateBook }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Rewriting state
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChapter = book.chapters[activeChapterIndex];

  const handleContentChange = (newContent: string) => {
    const updatedChapters = [...book.chapters];
    updatedChapters[activeChapterIndex] = {
      ...updatedChapters[activeChapterIndex],
      content: newContent
    };
    onUpdateBook({ ...book, chapters: updatedChapters });
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (target.selectionStart !== target.selectionEnd) {
      setSelectionRange({ start: target.selectionStart, end: target.selectionEnd });
    } else {
      setSelectionRange(null);
    }
  };

  const generateContent = async () => {
    if (!activeChapter) return;
    setIsGenerating(true);
    try {
      const prevChapterSummary = activeChapterIndex > 0 ? book.chapters[activeChapterIndex - 1].summary : undefined;
      const content = await geminiService.generateChapterContent(book.title, activeChapter, prevChapterSummary);
      
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

  const handleRegenerateCover = async () => {
    if (isGeneratingCover) return;
    setIsGeneratingCover(true);
    try {
      const newCover = await geminiService.generateBookCover(book.title, book.genre, book.tone);
      if (newCover) {
        onUpdateBook({ ...book, coverImage: newCover });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate new cover");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectionRange || !activeChapter.content) return;
    
    const textToRewrite = activeChapter.content.substring(selectionRange.start, selectionRange.end);
    if (!textToRewrite.trim()) return;

    setIsRewriting(true);
    try {
      const rewrittenText = await geminiService.rewriteText(
        textToRewrite, 
        rewriteInstruction || "Improve readability and flow",
        `${book.title} - ${book.genre}`
      );

      // Replace text
      const before = activeChapter.content.substring(0, selectionRange.start);
      const after = activeChapter.content.substring(selectionRange.end);
      handleContentChange(before + rewrittenText + after);
      
      setShowRewriteModal(false);
      setSelectionRange(null);
      setRewriteInstruction("");

    } catch (error) {
      console.error("Rewrite failed", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleExportEpub = async () => {
    setIsExporting(true);
    try {
        await epubService.generateEpub(book);
    } catch(e) {
        console.error(e);
        alert("Export failed.");
    } finally {
        setIsExporting(false);
    }
  };

  if (!book.chapters.length) {
    return <div className="p-12 text-center">No chapters found. Please create a book first.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      
      {/* Rewrite Modal */}
      <AnimatePresence>
        {showRewriteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                    <Wand2 size={18} className="text-saffron-500" />
                    Rewrite Selection
                  </h3>
                  <button onClick={() => setShowRewriteModal(false)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-500 italic mb-4 max-h-24 overflow-y-auto border border-stone-100">
                  "{activeChapter.content.substring(selectionRange?.start || 0, selectionRange?.end || 0)}"
                </div>

                <label className="block text-xs font-bold uppercase text-stone-400 mb-2 tracking-wider">How should we change it?</label>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                   {["Make it concise", "More descriptive", "Funnier", "Darker tone"].map(tone => (
                     <button 
                       key={tone}
                       onClick={() => setRewriteInstruction(tone)}
                       className={`px-3 py-2 rounded-lg text-sm border transition-all ${rewriteInstruction === tone ? 'bg-saffron-50 border-saffron-500 text-saffron-700' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                     >
                       {tone}
                     </button>
                   ))}
                </div>

                <input
                  type="text"
                  placeholder="Or type custom instruction..."
                  value={rewriteInstruction}
                  onChange={(e) => setRewriteInstruction(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
                />

                <button
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="w-full mt-6 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-saffron-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRewriting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {isRewriting ? 'Rewriting...' : 'Apply Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Chapter List */}
      <aside className="w-72 bg-stone-100 border-r border-stone-200 overflow-y-auto hidden md:block">
        <div className="p-5 border-b border-stone-200">
          {/* Cover Image in Sidebar */}
           <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden shadow-md relative group bg-stone-200">
             {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-stone-400 flex-col gap-2">
                 <ImageIcon size={24} />
                 <span className="text-xs">No Cover</span>
               </div>
             )}
             
             {/* Overlay Button for Regeneration */}
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                <button 
                  onClick={handleRegenerateCover}
                  disabled={isGeneratingCover}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-saffron-500 hover:border-saffron-500 border border-white/50 rounded-full backdrop-blur-md transition-all transform hover:scale-105"
                >
                  {isGeneratingCover ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  <span className="text-xs font-bold tracking-wide">{isGeneratingCover ? 'Painting...' : 'New Cover'}</span>
                </button>
             </div>
           </div>

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
             {/* Rewrite Button (Only visible when selecting) */}
             <AnimatePresence>
               {selectionRange && (
                 <motion.button
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   onClick={() => setShowRewriteModal(true)}
                   className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ivory bg-stone-900 hover:bg-saffron-500 rounded-md transition-colors shadow-lg"
                 >
                   <PenLine size={14} />
                   Rewrite Selection
                 </motion.button>
               )}
             </AnimatePresence>

             <div className="w-px h-6 bg-stone-300 mx-2" />

             <button 
               onClick={handleExportEpub}
               disabled={isExporting}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-md transition-colors disabled:opacity-50"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} />}
                Export ePub
             </button>

             <button 
               onClick={generateContent}
               disabled={isGenerating}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-saffron-700 bg-saffron-50 hover:bg-saffron-100 rounded-md transition-colors disabled:opacity-50"
             >
               {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
               {activeChapter.content ? 'Rewrite Chapter' : 'Generate Content'}
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
              ref={textareaRef}
              value={activeChapter.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleSelect}
              placeholder="Start writing or click 'Generate Content' to let AI take the lead..."
              className="w-full h-[70vh] bg-transparent border-none focus:ring-0 text-lg md:text-xl font-serif leading-loose text-stone-800 resize-none placeholder:text-stone-300 placeholder:font-sans placeholder:italic focus:outline-none selection:bg-saffron-200"
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
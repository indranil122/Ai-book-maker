
import React, { useState, useRef } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { pdfService } from '../services/pdfService';
import { Save, RefreshCw, ChevronLeft, ChevronRight, Wand2, Loader2, ImageIcon, PenLine, X, Check, Download, FileText, AlertTriangle } from 'lucide-react';
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
      
      if (!content || content.length < 50) {
          throw new Error("Content generation returned empty.");
      }

      handleContentChange(content);
      
      const updatedChapters = [...book.chapters];
      updatedChapters[activeChapterIndex].isGenerated = true;
      onUpdateBook({ ...book, chapters: updatedChapters });

    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Please try again.");
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
        alert("EPUB Export failed.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
        pdfService.generatePdf(book);
    } catch(e) {
        console.error(e);
        alert("PDF Export failed.");
    } finally {
        setIsExporting(false);
    }
  };

  if (!book.chapters.length) {
    return <div className="p-12 text-center text-stone-500 dark:text-stone-400">No chapters found. Please create a book first.</div>;
  }

  // Check if chapter is effectively empty
  const isChapterEmpty = !activeChapter.content || activeChapter.content.trim().length < 50;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative bg-ivory dark:bg-stone-950 transition-colors duration-300">
      
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
              className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 dark:border-stone-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
                    <Wand2 size={18} className="text-saffron-500" />
                    Rewrite Selection
                  </h3>
                  <button onClick={() => setShowRewriteModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg text-sm text-stone-500 dark:text-stone-400 italic mb-4 max-h-24 overflow-y-auto border border-stone-100 dark:border-stone-700">
                  "{activeChapter.content.substring(selectionRange?.start || 0, selectionRange?.end || 0)}"
                </div>

                <label className="block text-xs font-bold uppercase text-stone-400 mb-2 tracking-wider">How should we change it?</label>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                   {["Make it concise", "More descriptive", "Funnier", "Darker tone"].map(tone => (
                     <button 
                       key={tone}
                       onClick={() => setRewriteInstruction(tone)}
                       className={`px-3 py-2 rounded-lg text-sm border transition-all ${rewriteInstruction === tone ? 'bg-saffron-50 dark:bg-saffron-900/30 border-saffron-500 text-saffron-700 dark:text-saffron-400' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
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
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm text-stone-900 dark:text-stone-100"
                />

                <button
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="w-full mt-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
      <aside className="w-72 bg-stone-100 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 overflow-y-auto hidden md:block transition-colors duration-300">
        <div className="p-5 border-b border-stone-200 dark:border-stone-800">
          {/* Cover Image in Sidebar */}
           <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden shadow-md relative group bg-stone-200 dark:bg-stone-800">
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

          <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight mb-1">{book.title}</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">{book.chapters.length} Chapters</p>
        </div>
        <ul className="py-2 space-y-0.5">
          {book.chapters.map((chapter, idx) => (
            <li key={chapter.id}>
              <button
                onClick={() => setActiveChapterIndex(idx)}
                className={`w-full text-left px-5 py-3 text-sm transition-all border-l-4 ${
                  activeChapterIndex === idx 
                    ? 'bg-white dark:bg-stone-800 border-saffron-500 font-semibold text-stone-900 dark:text-stone-100 shadow-sm' 
                    : 'border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-mono mb-0.5">Chapter {idx + 1}</span>
                    <span className="truncate">{chapter.title}</span>
                  </div>
                  {chapter.isGenerated && chapter.content.length > 50 && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title="Content Generated" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-ivory dark:bg-stone-950 relative transition-colors duration-300">
        {/* Toolbar */}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm">
           <div className="flex items-center gap-2 overflow-hidden">
             <h2 className="font-medium text-stone-700 dark:text-stone-300 truncate">
                <span className="text-stone-400 dark:text-stone-500 font-normal mr-2">Editing:</span>
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
                   className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ivory dark:text-stone-900 bg-stone-900 dark:bg-stone-100 hover:bg-saffron-500 dark:hover:bg-saffron-400 rounded-md transition-colors shadow-lg"
                 >
                   <PenLine size={14} />
                   Rewrite Selection
                 </motion.button>
               )}
             </AnimatePresence>

             <div className="w-px h-6 bg-stone-300 dark:bg-stone-700 mx-2" />

             <button 
               onClick={handleExportEpub}
               disabled={isExporting || isChapterEmpty}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-md transition-colors disabled:opacity-50"
               title="Download ePub"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} />}
                ePub
             </button>

             <button 
               onClick={handleExportPdf}
               disabled={isExporting || isChapterEmpty}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-md transition-colors disabled:opacity-50"
               title="Download PDF"
             >
                {isExporting ? <Loader2 size={14} className="animate-spin"/> : <FileText size={14} />}
                PDF
             </button>

             <button 
               onClick={generateContent}
               disabled={isGenerating}
               className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-saffron-900/20 hover:bg-saffron-100 dark:hover:bg-saffron-900/40 rounded-md transition-colors disabled:opacity-50"
             >
               {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
               {isChapterEmpty ? 'Generate Content' : 'Re-Generate'}
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors">
               <Save size={14} /> Save
             </button>
           </div>
        </div>

        {/* Editor Input */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative">
          <div className="max-w-3xl mx-auto min-h-full">
            {isGenerating && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-950/80 z-10 backdrop-blur-sm transition-opacity">
                  <Loader2 className="animate-spin text-saffron-500 mb-3" size={40} />
                  <p className="text-stone-500 dark:text-stone-400 animate-pulse font-serif text-lg">Crafting story segments...</p>
               </div>
            )}
            
            {isChapterEmpty && !isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                 <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 text-stone-400">
                    <AlertTriangle size={28} />
                 </div>
                 <h3 className="text-xl font-serif font-bold text-stone-700 dark:text-stone-300 mb-2">This chapter is empty</h3>
                 <p className="text-stone-500 dark:text-stone-400 max-w-md mb-6">
                   The AI hasn't written this chapter yet, or the content was lost. Click below to have the AI write it for you.
                 </p>
                 <button 
                   onClick={generateContent}
                   className="px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-lg shadow-lg shadow-saffron-500/30 transition-all flex items-center gap-2"
                 >
                   <Wand2 size={18} />
                   Write Chapter Now
                 </button>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={activeChapter.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleSelect}
                placeholder="Start writing or click 'Generate Content' to let AI take the lead..."
                className="w-full h-[70vh] bg-transparent border-none focus:ring-0 text-lg md:text-xl font-serif leading-loose text-stone-800 dark:text-stone-200 resize-none placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:font-sans placeholder:italic focus:outline-none selection:bg-saffron-200 dark:selection:bg-saffron-900/50"
              />
            )}
          </div>
        </div>

        {/* Footer Nav */}
        <div className="h-12 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400">
           <button 
             disabled={activeChapterIndex === 0}
             onClick={() => setActiveChapterIndex(i => i - 1)}
             className="flex items-center gap-1 text-sm hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 px-2 py-1 rounded transition-colors"
           >
             <ChevronLeft size={16} /> Previous
           </button>
           <span className="text-xs font-mono bg-stone-200/50 dark:bg-stone-800/50 px-2 py-0.5 rounded text-stone-600 dark:text-stone-400">
             {activeChapter.content ? activeChapter.content.split(/\s+/).filter(w => w.length > 0).length : 0} words
           </span>
           <button 
             disabled={activeChapterIndex === book.chapters.length - 1}
             onClick={() => setActiveChapterIndex(i => i + 1)}
             className="flex items-center gap-1 text-sm hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-30 px-2 py-1 rounded transition-colors"
           >
             Next <ChevronRight size={16} />
           </button>
        </div>
      </main>
    </div>
  );
};

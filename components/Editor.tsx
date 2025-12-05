import React, { useState, useRef, useMemo } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { pdfService } from '../services/pdfService';
import { markdownService } from '../services/markdownService';
import { Loader2, PenLine, Download, Eye, PanelLeft, PanelRight, Wand2, BookCopy, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorProps {
  book: BookType;
  onUpdateBook: (updatedBook: BookType) => void;
}

export const Editor: React.FC<EditorProps> = ({ book, onUpdateBook }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeChapter = book.chapters[activeChapterIndex];

  const wordCount = useMemo(() => {
    return activeChapter?.content?.split(/\s+/).filter(Boolean).length || 0;
  }, [activeChapter?.content]);

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
      alert("Failed to generate content. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
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
      const before = activeChapter.content.substring(0, selectionRange.start);
      const after = activeChapter.content.substring(selectionRange.end);
      handleContentChange(before + rewrittenText + after);
      setShowRewriteModal(false);
      setSelectionRange(null);
      setRewriteInstruction("");
    } catch (error) {
      console.error("Rewrite failed", error);
      alert("Failed to rewrite selection.");
    } finally {
      setIsRewriting(false);
    }
  };
  
  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      pdfService.generatePdf(book);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportEpub = async () => {
    setIsExporting(true);
    try {
      await epubService.generateEpub(book);
    } catch (error) {
      console.error("Failed to export EPUB:", error);
      alert("Failed to export EPUB. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!activeChapter) {
    return <div className="p-12 text-center text-stone-500 dark:text-stone-400">No chapters found. Please create a book first.</div>;
  }

  const isChapterEmpty = !activeChapter.content || activeChapter.content.trim().length < 10;

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden relative transition-colors duration-300">
      <AnimatePresence>
        {showRewriteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-100 dark:border-stone-700"
            >
              <div className="p-6">
                <h3 className="font-serif font-bold text-lg mb-4">Rewrite Selection</h3>
                <textarea 
                  value={rewriteInstruction}
                  onChange={(e) => setRewriteInstruction(e.target.value)}
                  placeholder="e.g., Make this more descriptive..."
                  className="w-full h-24 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm"
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowRewriteModal(false)} className="px-4 py-2 bg-stone-200 dark:bg-stone-700 rounded-lg">Cancel</button>
                  <button onClick={handleRewrite} disabled={isRewriting} className="px-4 py-2 bg-saffron-500 text-white rounded-lg flex-1">
                    {isRewriting ? <Loader2 className="animate-spin mx-auto" /> : "Rewrite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNavOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0, x: -50 }} 
            animate={{ width: 288, opacity: 1, x: 0 }} 
            exit={{ width: 0, opacity: 0, x: -50 }} 
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-72 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md border-r border-stone-200/50 dark:border-stone-800/50 flex flex-col flex-shrink-0"
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight mb-1 truncate">{book.title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">{book.chapters.length} Chapters</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ul className="py-2 space-y-0.5">
                {book.chapters.map((chapter, idx) => (
                  <li key={chapter.id}>
                    <button
                      onClick={() => setActiveChapterIndex(idx)}
                      className={`w-full text-left px-5 py-3 text-sm transition-all border-l-4 ${activeChapterIndex === idx ? 'bg-white/80 dark:bg-stone-800/80 border-saffron-500 font-semibold text-stone-900 dark:text-stone-100 shadow-sm' : 'border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'}`}
                    >
                      <span className="text-xs text-stone-400 dark:text-stone-500 font-mono mb-0.5 block">Chapter {idx + 1}</span>
                      <span className="truncate block font-medium">{chapter.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col bg-transparent transition-colors duration-300 w-full overflow-hidden">
        <header className="flex-shrink-0 h-16 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between px-4 gap-2 z-10">
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsNavOpen(!isNavOpen)} className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
                    <PanelLeft size={18}/>
                 </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
                <button onClick={() => setIsPreview(!isPreview)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${isPreview ? 'bg-saffron-100 dark:bg-saffron-900/50 text-saffron-700 dark:text-saffron-300' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><Eye size={14}/> Preview</button>
                <button onClick={() => setShowRewriteModal(true)} disabled={!selectionRange} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"><PenLine size={14}/> Rewrite</button>
                <div className="relative group">
                    <button disabled={isExporting} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"><Download size={14}/> Export <ChevronDown size={12} /></button>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                        <button onClick={handleExportPdf} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-700"><BookCopy size={14}/> PDF</button>
                        <button onClick={handleExportEpub} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-stone-100 dark:hover:bg-stone-700"><FileText size={14}/> ePub</button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
                    <PanelRight size={18}/>
                 </button>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto relative">
            <div className="max-w-4xl mx-auto py-12 px-4 md:px-8 h-full">
                {isChapterEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 dark:text-stone-400">
                        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800/50 rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-600 mb-6">
                            <Wand2 size={40} />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-stone-700 dark:text-stone-300 mb-2">This Chapter is a Blank Page</h3>
                        <p className="mb-6">Let the AI bring it to life.</p>
                        <button onClick={generateContent} disabled={isGenerating} className="px-6 py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                            {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Generating...</> : 'Generate Content'}
                        </button>
                    </div>
                ) : isPreview ? (
                    <div className="bg-ivory/80 dark:bg-stone-950/80 p-8 md:p-12 rounded-lg shadow-lg min-h-full backdrop-blur-sm">
                       <div 
                          className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-loose"
                          dangerouslySetInnerHTML={{ __html: markdownService.parse(activeChapter.content) }} 
                       />
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={activeChapter.content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        onSelect={handleSelect}
                        className="w-full h-full min-h-[calc(100vh-15rem)] p-0 bg-transparent resize-none focus:outline-none font-serif text-lg leading-loose text-stone-900 dark:text-stone-200 placeholder:text-stone-400"
                        placeholder="Start writing your chapter here..."
                    />
                )}
            </div>
        </div>
      </main>

       <AnimatePresence>
        {isInspectorOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0, x: 50 }} 
            animate={{ width: 288, opacity: 1, x: 0 }} 
            exit={{ width: 0, opacity: 0, x: 50 }} 
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-72 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md border-l border-stone-200/50 dark:border-stone-800/50 flex flex-col flex-shrink-0"
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-wider">Inspector</h3>
            </div>
            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Chapter Stats</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-stone-100 dark:bg-stone-800/50 p-3 rounded-lg">
                            <span className="block font-bold text-xl text-stone-900 dark:text-white">{wordCount}</span>
                            <span className="text-xs text-stone-500">Words</span>
                        </div>
                        <div className="bg-stone-100 dark:bg-stone-800/50 p-3 rounded-lg">
                            <span className="block font-bold text-xl text-stone-900 dark:text-white">{(wordCount / 250).toFixed(1)}</span>
                            <span className="text-xs text-stone-500">Min Read</span>
                        </div>
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">Characters</h4>
                    {book.characters.length > 0 ? (
                        <ul className="space-y-2">
                            {book.characters.map(char => (
                                <li key={char.name} className="p-3 bg-stone-100 dark:bg-stone-800/50 rounded-lg">
                                <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{char.name}</p>
                                <p className="text-xs text-stone-500">{char.role}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-stone-400 italic">No characters defined yet.</p>
                    )}
                </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
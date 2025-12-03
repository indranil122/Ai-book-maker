
import React, { useState, useRef } from 'react';
import { Book as BookType, Chapter } from '../types';
import { geminiService } from '../services/geminiService';
import { epubService } from '../services/epubService';
import { pdfService } from '../services/pdfService';
import { markdownService } from '../services/markdownService';
import { Save, RefreshCw, ChevronLeft, ChevronRight, Wand2, Loader2, ImageIcon, PenLine, X, Check, Download, FileText, AlertTriangle, Menu, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, BookCopy, Globe, Eye } from 'lucide-react';
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [sidebarTab, setSidebarTab] = useState<'chapters' | 'world'>('chapters');
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  
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
      alert("Failed to generate content. Please check your connection and try again.");
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
  
  const handleGenerateMap = async () => {
    if(isGeneratingMap) return;
    setIsGeneratingMap(true);
    try {
      const mapUrl = await geminiService.generateWorldMap(book);
      if(mapUrl) {
        onUpdateBook({ ...book, worldMapUrl: mapUrl });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate world map.");
    } finally {
      setIsGeneratingMap(false);
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

  const handleExportEpub = async () => {
    setIsExporting(true);
    try { await epubService.generateEpub(book); } 
    catch(e) { console.error(e); alert("EPUB Export failed."); } 
    finally { setIsExporting(false); }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try { pdfService.generatePdf(book); }
    catch(e) { console.error(e); alert("PDF Export failed."); }
    finally { setIsExporting(false); }
  };

  if (!activeChapter) {
    return <div className="p-12 text-center text-stone-500 dark:text-stone-400">No chapters found. Please create a book first.</div>;
  }

  const isChapterEmpty = !activeChapter.content || activeChapter.content.trim().length < 10;

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden relative bg-white/50 dark:bg-stone-950/50 backdrop-blur-xl transition-colors duration-300">
      
      {/* Rewrite Modal */}
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

      {/* Sidebar */}
       <AnimatePresence>
        {!isFocusMode && (showMobileSidebar || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.3 }}
            className={`absolute md:static inset-y-0 left-0 z-30 w-72 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md border-r border-stone-200/50 dark:border-stone-800/50 flex flex-col transition-colors duration-300 shadow-2xl md:shadow-none ${!showMobileSidebar ? 'hidden md:block' : 'block'}`}
          >
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 relative">
               <div className="aspect-[3/4] w-24 rounded-md shadow-lg overflow-hidden float-right ml-4 mb-2 bg-stone-200 dark:bg-stone-800">
                  {isGeneratingCover ? (
                     <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-stone-400"/></div>
                  ) : book.coverImage && <img src={book.coverImage} className="w-full h-full object-cover"/>}
               </div>
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight mb-1">{book.title}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wider">{book.chapters.length} Chapters</p>
            </div>
            
            <div className="flex p-2 border-b border-stone-200 dark:border-stone-800">
                <button onClick={() => setSidebarTab('chapters')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium ${sidebarTab === 'chapters' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}><BookCopy size={16}/> Chapters</button>
                <button onClick={() => setSidebarTab('world')} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium ${sidebarTab === 'world' ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800/50'}`}><Globe size={16}/> World</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {sidebarTab === 'chapters' ? (
                    <ul className="py-2 space-y-0.5">
                        {book.chapters.map((chapter, idx) => (
                            <li key={chapter.id}>
                                <button
                                    onClick={() => { setActiveChapterIndex(idx); setShowMobileSidebar(false); }}
                                    className={`w-full text-left px-5 py-3 text-sm transition-all border-l-4 ${activeChapterIndex === idx ? 'bg-white/80 dark:bg-stone-800/80 border-saffron-500 font-semibold text-stone-900 dark:text-stone-100 shadow-sm' : 'border-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-200'}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs text-stone-400 dark:text-stone-500 font-mono mb-0.5">Chapter {idx + 1}</span>
                                            <span className="truncate">{chapter.title}</span>
                                        </div>
                                        {chapter.content && chapter.content.length > 50 && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title="Content Generated" />}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 space-y-4">
                        <h4 className="font-bold text-stone-700 dark:text-stone-300">World Map</h4>
                        <div className="aspect-video bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden flex items-center justify-center relative">
                            {isGeneratingMap && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                    <Loader2 className="animate-spin mb-2"/>
                                    <span className="text-xs">Mapping your world...</span>
                                </div>
                            )}
                            {book.worldMapUrl ? (
                                <img src={book.worldMapUrl} alt="World Map" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="text-center text-stone-400 p-2">
                                    <Globe size={32} className="mx-auto mb-2"/>
                                    <p className="text-xs">No map has been generated for this world yet.</p>
                                </div>
                            )}
                        </div>
                        <button onClick={handleGenerateMap} disabled={isGeneratingMap} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-saffron-500 hover:bg-saffron-600 text-white rounded-lg disabled:opacity-50">
                            {isGeneratingMap ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                            {book.worldMapUrl ? 'Regenerate Map' : 'Generate Map'}
                        </button>
                    </div>
                )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col bg-transparent relative transition-colors duration-300 w-full overflow-hidden">
        <AnimatePresence>
            {!isFocusMode && (
                <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="flex-shrink-0 h-16 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between px-4 gap-2">
                    <div className="flex items-center gap-2">
                         <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="md:hidden p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white">
                            {showMobileSidebar ? <PanelLeftClose/> : <PanelLeftOpen />}
                         </button>
                         <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100 truncate">{activeChapter.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button onClick={() => setIsPreview(!isPreview)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${isPreview ? 'bg-saffron-100 dark:bg-saffron-900/50 text-saffron-700 dark:text-saffron-300' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}><Eye size={14}/> Preview</button>
                        <button onClick={() => setShowRewriteModal(true)} disabled={!selectionRange} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"><PenLine size={14}/> Rewrite</button>
                        <button onClick={handleExportPdf} disabled={isExporting} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"><Download size={14}/> PDF</button>
                        <button onClick={handleExportEpub} disabled={isExporting} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">ePub</button>
                        <button onClick={() => setIsFocusMode(true)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"><Maximize2 size={16}/></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        <div className={`flex-1 overflow-y-auto p-4 md:p-12 relative transition-all duration-500 ${isFocusMode ? 'max-w-4xl mx-auto w-full' : ''}`}>
            {isFocusMode && <button onClick={() => setIsFocusMode(false)} className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 bg-stone-800/50 hover:bg-stone-700/80 hover:text-white z-50"><Minimize2 size={16}/></button>}
           
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
                <div 
                  className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-loose"
                  dangerouslySetInnerHTML={{ __html: markdownService.parse(activeChapter.content) }} 
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={activeChapter.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onSelect={handleSelect}
                    className="w-full h-full p-0 bg-transparent resize-none focus:outline-none font-serif text-lg leading-loose text-stone-900 dark:text-stone-200 placeholder:text-stone-400"
                    placeholder="Start writing your chapter here..."
                />
            )}
        </div>
      </main>
    </div>
  );
};

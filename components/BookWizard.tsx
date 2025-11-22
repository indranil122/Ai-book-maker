import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Loader2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Book as BookType, GenerationParams, Chapter } from '../types';

interface BookWizardProps {
  onBookCreated: (book: BookType) => void;
}

export const BookWizard: React.FC<BookWizardProps> = ({ onBookCreated }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [progressStep, setProgressStep] = useState<string>('');
  const [generatedBook, setGeneratedBook] = useState<BookType | null>(null);
  const [formData, setFormData] = useState<GenerationParams>({
    title: '',
    genre: 'Dark Romance',
    tone: 'Gothic & Mysterious',
    audience: 'Adult',
    prompt: '',
  });

  const handleChange = (field: keyof GenerationParams, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setStatus('generating');
    setProgressStep('Drafting book structure and outline...');

    try {
      // 1. Start Cover Generation (Background)
      const coverPromise = geminiService.generateBookCover(
        formData.title,
        formData.genre,
        formData.tone
      );

      // 2. Generate Structure
      const partialBook = await geminiService.generateBookStructure(
        formData.title,
        formData.genre,
        formData.tone,
        formData.audience,
        formData.prompt
      );

      if (!partialBook.chapters) {
        throw new Error("Failed to generate chapters");
      }

      // 3. Generate Content for EACH Chapter
      const fullyWrittenChapters: Chapter[] = [];
      const totalChapters = partialBook.chapters.length;

      for (let i = 0; i < totalChapters; i++) {
        const chapter = partialBook.chapters[i];
        setProgressStep(`Writing Chapter ${i + 1} of ${totalChapters}: "${chapter.title}"...`);
        
        // Use previous chapter summary for continuity context
        const prevSummary = i > 0 ? partialBook.chapters[i - 1].summary : undefined;
        
        const content = await geminiService.generateChapterContent(
          partialBook.title || formData.title,
          chapter,
          prevSummary
        );

        fullyWrittenChapters.push({
          ...chapter,
          content: content,
          isGenerated: true
        });
      }

      setProgressStep('Finalizing cover art...');
      const coverImage = await coverPromise;

      const newBook: BookType = {
        id: crypto.randomUUID(),
        title: partialBook.title || formData.title,
        author: partialBook.author || 'AI & You',
        genre: formData.genre,
        tone: formData.tone,
        targetAudience: formData.audience,
        chapters: fullyWrittenChapters,
        createdAt: new Date(),
        coverImage: coverImage || `https://picsum.photos/seed/${Date.now()}/600/900`
      };

      setGeneratedBook(newBook);
      setStatus('complete');
    } catch (e) {
      console.error(e);
      alert("Failed to generate book. Please ensure you have a valid API Key configured and try again.");
      setStatus('idle');
    }
  };

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4 bg-ivory dark:bg-stone-950 transition-colors duration-300">
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-stone-100 dark:border-stone-800 rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-saffron-500 relative z-10"
          >
            <Loader2 size={64} />
          </motion.div>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl font-medium text-stone-800 dark:text-stone-100 text-center"
        >
          Creating your masterpiece
        </motion.h2>
        <motion.div
           key={progressStep}
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-300 font-mono text-sm shadow-sm max-w-md text-center"
        >
          {progressStep}
        </motion.div>
      </div>
    );
  }

  if (status === 'complete' && generatedBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 bg-ivory dark:bg-stone-950 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center md:items-start border border-stone-100 dark:border-stone-800"
        >
          {/* Generated Cover */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-64 md:w-80 shrink-0"
          >
             <div className="aspect-[3/4] rounded-lg shadow-lg overflow-hidden relative bg-stone-200 dark:bg-stone-800 group border border-stone-100 dark:border-stone-700">
                <img 
                  src={generatedBook.coverImage} 
                  alt={generatedBook.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             </div>
          </motion.div>

          {/* Success Details */}
          <div className="flex-1 space-y-6 text-center md:text-left w-full">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
                <CheckCircle2 size={16} />
                <span>Full Book Generated</span>
              </div>
              <h2 className="font-serif text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">{generatedBook.title}</h2>
              <p className="text-lg text-stone-500 dark:text-stone-400 font-medium">by {generatedBook.author}</p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">{generatedBook.chapters.reduce((acc, ch) => acc + (ch.content.split(' ').length || 0), 0)} words written</p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-6 border border-stone-100 dark:border-stone-700 max-h-[300px] overflow-y-auto">
              <h3 className="font-bold text-stone-700 dark:text-stone-300 mb-3 text-sm uppercase tracking-wide">Table of Contents</h3>
              <ul className="space-y-3 text-left">
                {generatedBook.chapters.map((ch, i) => (
                  <li key={ch.id} className="flex items-start gap-3 text-stone-600 dark:text-stone-300 text-sm">
                    <span className="font-mono text-saffron-500 font-bold pt-0.5 shrink-0">{i + 1}.</span>
                    <span>
                      <strong className="text-stone-800 dark:text-stone-200 block">{ch.title}</strong>
                      <span className="text-stone-400 dark:text-stone-500 block line-clamp-1">{ch.summary}</span>
                    </span>
                    {ch.isGenerated && <span className="ml-auto text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Ready</span>}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onBookCreated(generatedBook)}
              className="w-full md:w-auto px-8 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-lg font-bold rounded-xl hover:bg-saffron-500 dark:hover:bg-saffron-400 transition-colors shadow-lg hover:shadow-saffron-500/30 flex items-center justify-center gap-2 group"
            >
              Open Book
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 bg-ivory dark:bg-stone-950 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden"
      >
        <div className="bg-stone-900 dark:bg-stone-800 p-8 text-ivory relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif text-3xl font-bold mb-2 text-ivory">Create a New Book</h2>
            <p className="text-stone-400">Tell us a bit about your idea, and we'll build the entire book.</p>
          </div>
          <Sparkles className="absolute top-4 right-4 text-stone-700 dark:text-stone-600 opacity-20 w-32 h-32" />
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Working Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., The Rose & The Dagger"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Genre</label>
              <select
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-stone-900 dark:text-stone-100 transition-all"
              >
                <option>Dark Romance</option>
                <option>Science Fiction</option>
                <option>Cyberpunk</option>
                <option>High Fantasy</option>
                <option>Cozy Mystery</option>
                <option>Psychological Thriller</option>
                <option>Romance</option>
                <option>Non-Fiction / Business</option>
                <option>Children's Book</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Tone</label>
              <select
                value={formData.tone}
                onChange={(e) => handleChange('tone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-stone-900 dark:text-stone-100 transition-all"
              >
                <option>Gothic & Mysterious</option>
                <option>Adventurous</option>
                <option>Dark & Gritty</option>
                <option>Whimsical & Cute</option>
                <option>Humorous</option>
                <option>Academic</option>
                <option>Romantic & Emotional</option>
              </select>
            </div>
          </div>

           <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Target Audience</label>
             <select
                value={formData.audience}
                onChange={(e) => handleChange('audience', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-stone-900 dark:text-stone-100 transition-all"
              >
                <option>Adult</option>
                <option>Young Adult</option>
                <option>Middle Grade</option>
                <option>Children</option>
              </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Additional Details (Premise, Characters)</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="A forbidden romance between rival noble houses in a gothic city..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-saffron-400 text-stone-900 dark:text-stone-100 transition-all resize-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.title}
            className="w-full py-4 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-lg shadow-saffron-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Generate Full Book
          </button>
        </div>
      </motion.div>
    </div>
  );
};
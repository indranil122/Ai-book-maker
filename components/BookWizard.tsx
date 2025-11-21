import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Loader2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Book as BookType, GenerationParams } from '../types';

interface BookWizardProps {
  onBookCreated: (book: BookType) => void;
}

export const BookWizard: React.FC<BookWizardProps> = ({ onBookCreated }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [generatedBook, setGeneratedBook] = useState<BookType | null>(null);
  const [formData, setFormData] = useState<GenerationParams>({
    title: '',
    genre: 'Science Fiction',
    tone: 'Adventurous',
    audience: 'Young Adult',
    prompt: '',
  });

  const handleChange = (field: keyof GenerationParams, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setStatus('generating');
    try {
      // Generate Structure and Cover in parallel
      const structurePromise = geminiService.generateBookStructure(
        formData.title,
        formData.genre,
        formData.tone,
        formData.audience,
        formData.prompt
      );

      const coverPromise = geminiService.generateBookCover(
        formData.title,
        formData.genre,
        formData.tone
      );

      const [partialBook, coverImage] = await Promise.all([structurePromise, coverPromise]);

      const newBook: BookType = {
        id: crypto.randomUUID(),
        title: partialBook.title || formData.title,
        author: partialBook.author || 'AI & You',
        genre: formData.genre,
        tone: formData.tone,
        targetAudience: formData.audience,
        chapters: partialBook.chapters || [],
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
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-stone-100 rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-saffron-500"
          >
            <Loader2 size={64} />
          </motion.div>
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
          className="mt-8 font-serif text-3xl font-medium text-stone-800"
        >
          Crafting your story...
        </motion.h2>
        <div className="mt-4 space-y-2 text-center text-stone-500">
          <p>Designing a unique cover art...</p>
          <p>Outlining chapters and plot twists...</p>
        </div>
      </div>
    );
  }

  if (status === 'complete' && generatedBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center md:items-start"
        >
          {/* Generated Cover */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-64 md:w-80 shrink-0"
          >
             <div className="aspect-[3/4] rounded-lg shadow-lg overflow-hidden relative bg-stone-200 group border border-stone-100">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                <CheckCircle2 size={16} />
                <span>Book Generated Successfully</span>
              </div>
              <h2 className="font-serif text-4xl font-bold text-stone-900 mb-2">{generatedBook.title}</h2>
              <p className="text-lg text-stone-500 font-medium">by {generatedBook.author}</p>
            </div>

            <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 max-h-[300px] overflow-y-auto">
              <h3 className="font-bold text-stone-700 mb-3 text-sm uppercase tracking-wide">Chapter Outline</h3>
              <ul className="space-y-3 text-left">
                {generatedBook.chapters.map((ch, i) => (
                  <li key={ch.id} className="flex items-start gap-3 text-stone-600 text-sm">
                    <span className="font-mono text-saffron-500 font-bold pt-0.5 shrink-0">{i + 1}.</span>
                    <span>
                      <strong className="text-stone-800 block">{ch.title}</strong>
                      <span className="text-stone-400 block">{ch.summary}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onBookCreated(generatedBook)}
              className="w-full md:w-auto px-8 py-4 bg-stone-900 text-white text-lg font-bold rounded-xl hover:bg-saffron-500 transition-colors shadow-lg hover:shadow-saffron-500/30 flex items-center justify-center gap-2 group"
            >
              Open in Editor
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden"
      >
        <div className="bg-stone-900 p-8 text-ivory relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif text-3xl font-bold mb-2">Create a New Book</h2>
            <p className="text-stone-400">Tell us a bit about your idea, and we'll build the skeleton.</p>
          </div>
          <Sparkles className="absolute top-4 right-4 text-stone-700 opacity-20 w-32 h-32" />
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Working Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., The Last Starship"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Genre</label>
              <select
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
              >
                <option>Science Fiction</option>
                <option>Fantasy</option>
                <option>Mystery</option>
                <option>Romance</option>
                <option>Non-Fiction / Business</option>
                <option>Children's Book</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Tone</label>
              <select
                value={formData.tone}
                onChange={(e) => handleChange('tone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
              >
                <option>Adventurous</option>
                <option>Dark & Gritty</option>
                <option>Humorous</option>
                <option>Academic</option>
                <option>Whimsical</option>
              </select>
            </div>
          </div>

           <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Target Audience</label>
             <select
                value={formData.audience}
                onChange={(e) => handleChange('audience', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all"
              >
                <option>Young Adult</option>
                <option>Adult</option>
                <option>Middle Grade</option>
                <option>Children</option>
              </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Additional Details (Premise, Characters)</label>
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="A boy discovers he can talk to machines..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-saffron-400 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.title}
            className="w-full py-4 bg-saffron-500 hover:bg-saffron-600 text-white font-bold rounded-xl shadow-lg shadow-saffron-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Generate Book & Cover
          </button>
        </div>
      </motion.div>
    </div>
  );
};
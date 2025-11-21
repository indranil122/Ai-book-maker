import React from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, BookOpen } from 'lucide-react';

export const Explore: React.FC = () => {
  const niches = [
    { name: "Dark Romance", color: "bg-red-900", img: "https://images.unsplash.com/photo-1595627309991-61fa99d134f3?q=80&w=600&auto=format&fit=crop" },
    { name: "Cyberpunk", color: "bg-purple-900", img: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=600&auto=format&fit=crop" },
    { name: "High Fantasy", color: "bg-amber-800", img: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=600&auto=format&fit=crop" },
    { name: "Cozy Mystery", color: "bg-teal-800", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=600&auto=format&fit=crop" }
  ];

  const trendingBooks = [
    { title: "Thorns of Velvet", author: "Elara Vane", genre: "Dark Romance", cover: "https://images.unsplash.com/photo-1542662565-7754d630330d?q=80&w=400&auto=format&fit=crop" },
    { title: "Neon Rain", author: "K. Z. Stryker", genre: "Cyberpunk", cover: "https://images.unsplash.com/photo-1614726365723-498aa67c5f7b?q=80&w=400&auto=format&fit=crop" },
    { title: "The Lost Crown", author: "J. R. R. Martin", genre: "Fantasy", cover: "https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=400&auto=format&fit=crop" },
    { title: "Whispers in the Fog", author: "Agatha B.", genre: "Mystery", cover: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=400&auto=format&fit=crop" },
  ];

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="bg-stone-900 text-ivory py-16 px-6 relative overflow-hidden">
         <div className="max-w-7xl mx-auto relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-5xl font-bold mb-4"
            >
              Explore Niches
            </motion.h1>
            <p className="text-stone-400 text-lg max-w-2xl">Discover beautifully generated stories in your favorite genres. From the dark and romantic to the futuristic and bold.</p>
         </div>
         <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-saffron-600/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        {/* Niches Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {niches.map((niche, idx) => (
            <motion.div
              key={niche.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative h-40 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
            >
              <img src={niche.img} alt={niche.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className={`absolute inset-0 ${niche.color} opacity-60 group-hover:opacity-40 transition-opacity`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-serif font-bold text-xl tracking-wide">{niche.name}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trending Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl text-stone-800">Trending Now</h2>
            <button className="text-saffron-600 font-medium hover:text-saffron-700">View All</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingBooks.map((book, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-shadow group cursor-pointer border border-stone-100"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden mb-4 relative bg-stone-200">
                   <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                   <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
                     <Star size={10} className="text-saffron-500 fill-saffron-500" />
                     4.{8 - i}
                   </div>
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight mb-1 group-hover:text-saffron-600 transition-colors">{book.title}</h3>
                <p className="text-sm text-stone-500 mb-3">by {book.author}</p>
                <div className="flex items-center justify-between text-xs text-stone-400 border-t border-stone-100 pt-3">
                   <span className="bg-stone-100 px-2 py-1 rounded text-stone-600">{book.genre}</span>
                   <div className="flex gap-3">
                     <button className="hover:text-red-500"><Heart size={14} /></button>
                     <button className="hover:text-stone-900"><BookOpen size={14} /></button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
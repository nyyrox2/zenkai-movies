import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieShelf({ title, subtitle, movies = [], onSelectMovie, badge }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative group">
      
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-[#E50914]/20 border border-[#E50914]/30 text-[#FF4552] text-xs font-semibold">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scroll Arrows */}
        <div className="hidden sm:flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-[#1A1B26]/80 hover:bg-[#E50914] border border-white/10 text-white transition-all shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-[#1A1B26]/80 hover:bg-[#E50914] border border-white/10 text-white transition-all shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal List */}
      <div 
        ref={scrollRef}
        className="flex space-x-4 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 scroll-smooth"
      >
        {movies.map(movie => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onSelect={onSelectMovie} 
          />
        ))}
      </div>

    </div>
  );
}

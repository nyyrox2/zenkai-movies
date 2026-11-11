import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Calendar, Volume2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const TMDB_IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";
const TMDB_IMAGE_W500 = "https://image.tmdb.org/t/p/w500";

export default function HeroSlider({ movies = [], onSelectMovie }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const featured = movies.slice(0, 5);
  const current = featured[currentIndex] || featured[0];

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (!current) return null;

  const title = current.title || current.name;
  const year = (current.release_date || current.first_air_date || '').slice(0, 4);
  const rating = (current.vote_average || 0).toFixed(1);
  const backdropUrl = current.backdrop_path 
    ? `${TMDB_IMAGE_ORIGINAL}${current.backdrop_path}` 
    : (current.poster_path ? `${TMDB_IMAGE_ORIGINAL}${current.poster_path}` : '');

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] max-h-[720px] overflow-hidden">
      {/* Backdrop Image with Multi-Layer Gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10] via-[#0B0C10]/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          
          {/* Badges */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <span className="px-2.5 py-1 rounded-md bg-[#E50914] text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-[#E50914]/40">
              FEATURED STREAM
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
              4K ULTRA HD
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1">
              <Volume2 className="w-3 h-3" />
              <span>Multi-Audio Dubs</span>
            </span>
            {rating > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center space-x-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
              </span>
            )}
            {year && (
              <span className="text-gray-400 text-xs flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{year}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight line-clamp-2 drop-shadow-md">
            {title}
          </h1>

          {/* Synopsis */}
          <p className="text-gray-300 text-sm sm:text-base line-clamp-3 leading-relaxed drop-shadow">
            {current.overview || "Stream in crystal clear 4K with native dubs on MovieBox Direct and ultra-fast failover servers."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={() => onSelectMovie(current)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-sm sm:text-base shadow-xl shadow-[#E50914]/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch in 4K</span>
            </button>

            <button
              onClick={() => onSelectMovie(current)}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold text-sm sm:text-base transition-all hover:scale-105"
            >
              <Info className="w-5 h-5 text-gray-300" />
              <span>Details & Dubs</span>
            </button>
          </div>

        </div>

        {/* Carousel Indicators */}
        <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-6">
          <div className="flex items-center space-x-2">
            {featured.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex 
                    ? 'w-8 h-2 bg-[#E50914]' 
                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                }`}
                title={item.title || item.name}
              />
            ))}
          </div>

          {/* Previous / Next Arrows */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentIndex(prev => (prev - 1 + featured.length) % featured.length)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-all hover:scale-110"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(prev => (prev + 1) % featured.length)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-all hover:scale-110"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

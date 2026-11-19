import React from 'react';
import { Play, Star, Volume2 } from 'lucide-react';

const TMDB_IMAGE_W500 = "https://image.tmdb.org/t/p/w500";

export default function MovieCard({ movie, onSelect }) {
  if (!movie) return null;

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_W500}${movie.poster_path}` 
    : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80';

  return (
    <div 
      onClick={() => onSelect(movie)}
      className="group relative flex-shrink-0 w-36 sm:w-44 md:w-52 cursor-pointer transition-all duration-300 hover:scale-[1.04] z-10 hover:z-20"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#14151D] border border-white/10 shadow-lg group-hover:shadow-2xl group-hover:shadow-[#E50914]/20 group-hover:border-[#E50914]/40 transition-all">
        <img 
          src={posterUrl} 
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Quality Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
          <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-extrabold text-white">
            4K
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#E50914]/80 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center space-x-0.5">
            <Volume2 className="w-2.5 h-2.5" />
            <span>DUB</span>
          </span>
        </div>

        {/* Rating */}
        {rating && (
          <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-amber-400 flex items-center space-x-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        {/* Hover Quick Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-[#E50914]/50 scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Info inside Poster */}
        <div className="absolute bottom-0 inset-x-0 p-3 space-y-1">
          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#FF4552] transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{year || '2026'}</span>
            <span className="text-gray-400 uppercase">{movie.media_type === 'tv' ? 'Series' : 'Movie'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

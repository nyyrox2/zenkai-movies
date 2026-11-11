import React, { useState, useEffect } from 'react';
import { Search, X, Star, Calendar, Film } from 'lucide-react';
import { searchMovies } from '../services/api';

const TMDB_IMAGE_W500 = "https://image.tmdb.org/t/p/w500";

export default function SearchModal({ isOpen, onClose, onSelectMovie }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        const res = await searchMovies(query);
        setResults(res);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#14151D] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-white/10 bg-[#0B0C10]">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV series, anime films..."
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base sm:text-lg"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-gray-300 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400 flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
              <span>Searching catalogue…</span>
            </div>
          ) : results.length > 0 ? (
            results.map(movie => {
              const title = movie.title || movie.name;
              const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
              const poster = movie.poster_path ? `${TMDB_IMAGE_W500}${movie.poster_path}` : null;
              const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

              return (
                <div
                  key={movie.id}
                  onClick={() => { onSelectMovie(movie); onClose(); }}
                  className="flex items-center space-x-4 p-2.5 rounded-2xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all group"
                >
                  <div className="w-12 h-16 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0">
                    {poster ? (
                      <img src={poster} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Film className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#FF4552] truncate transition-colors">
                      {title}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                      <span>{year || '2026'}</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-bold">
                        {movie.media_type || 'movie'}
                      </span>
                      {rating && (
                        <span className="flex items-center space-x-1 text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{rating}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : query.trim().length >= 2 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No results found for "{query}".
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-500">
              Type at least 2 characters to search across TMDB & MovieBox.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

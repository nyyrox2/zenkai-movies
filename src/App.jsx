import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSlider from './components/HeroSlider';
import MovieShelf from './components/MovieShelf';
import MoviePlayerModal from './components/MoviePlayerModal';
import SearchModal from './components/SearchModal';
import { fetchTrending, fetchPopular, fetchTopRated } from './services/api';
import { Film, ShieldCheck, Heart, Sparkles, Server } from 'lucide-react';

export default function App() {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    async function loadCatalogue() {
      const [tr, popM, popTv, top] = await Promise.all([
        fetchTrending('movie', 'week'),
        fetchPopular('movie'),
        fetchPopular('tv'),
        fetchTopRated('movie')
      ]);
      setTrending(tr);
      setPopularMovies(popM);
      setPopularTv(popTv);
      setTopRated(top);
    }
    loadCatalogue();
  }, []);

  // Filtered lists based on active tab
  const getDisplayContent = () => {
    if (activeTab === 'movies') {
      return (
        <div className="space-y-4 pt-20">
          <MovieShelf title="Trending Movies" badge="THIS WEEK" movies={trending} onSelectMovie={setSelectedMovie} />
          <MovieShelf title="Popular Movies" badge="4K ULTRA HD" movies={popularMovies} onSelectMovie={setSelectedMovie} />
          <MovieShelf title="Top Rated Classics" badge="CRITICS CHOICE" movies={topRated} onSelectMovie={setSelectedMovie} />
        </div>
      );
    }

    if (activeTab === 'tv') {
      return (
        <div className="space-y-4 pt-20">
          <MovieShelf title="Popular Series" badge="TOP RATED" movies={popularTv} onSelectMovie={setSelectedMovie} />
          <MovieShelf title="Trending Shows" badge="BINGE WORTHY" movies={trending.filter(m => m.media_type === 'tv')} onSelectMovie={setSelectedMovie} />
        </div>
      );
    }

    if (activeTab === 'dubbed') {
      return (
        <div className="space-y-4 pt-20">
          <MovieShelf title="Multi-Audio Dubbed Movies" badge="HINDI • TAMIL • TELUGU • SPANISH" movies={[...popularMovies].reverse()} onSelectMovie={setSelectedMovie} />
          <MovieShelf title="Dubbed Series" badge="MULTI AUDIO" movies={popularTv} onSelectMovie={setSelectedMovie} />
        </div>
      );
    }

    // Default Home
    return (
      <>
        <HeroSlider movies={trending} onSelectMovie={setSelectedMovie} />
        <div className="space-y-4 relative -mt-6 z-20">
          <MovieShelf 
            title="Trending Now" 
            subtitle="The most-streamed releases worldwide this week"
            badge="4K • ZERO ADS" 
            movies={trending} 
            onSelectMovie={setSelectedMovie} 
          />

          <MovieShelf 
            title="Popular Blockbusters" 
            subtitle="Box office sensations streaming in native high bitrate"
            badge="POPULAR" 
            movies={popularMovies} 
            onSelectMovie={setSelectedMovie} 
          />

          <MovieShelf 
            title="Multi-Audio Dubbed Hits" 
            subtitle="Complete audio streams available in Hindi, Tamil, Telugu, Spanish & more"
            badge="MULTI AUDIO" 
            movies={[...popularMovies].reverse()} 
            onSelectMovie={setSelectedMovie} 
          />

          <MovieShelf 
            title="Top Rated TV Series" 
            subtitle="Full seasons streaming episode by episode"
            badge="SERIES" 
            movies={popularTv} 
            onSelectMovie={setSelectedMovie} 
          />

          <MovieShelf 
            title="Critics' Favorites" 
            subtitle="Masterpieces with the highest audience & critics scores"
            badge="TOP RATED" 
            movies={topRated} 
            onSelectMovie={setSelectedMovie} 
          />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] flex flex-col justify-between selection:bg-[#E50914] selection:text-white">
      
      {/* Navigation */}
      <Navbar 
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {getDisplayContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07080C] py-10 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-[#E50914] flex items-center justify-center">
              <Film className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-300">Zenkai Movies</span>
            <span>• Powered by MovieBox 4K Native Proxy Engine</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-emerald-400">
              <Server className="w-3.5 h-3.5" />
              <span>Proxy Active (206 Stream & Anti-428 Engine)</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MoviePlayerModal 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
      />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectMovie={setSelectedMovie} 
      />

    </div>
  );
}

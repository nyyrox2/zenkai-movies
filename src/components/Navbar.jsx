import React, { useState, useEffect } from 'react';
import { Film, Search, Tv, Compass, Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar({ onOpenSearch, activeTab, setActiveTab }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0B0C10]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl py-3' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <div 
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF4552] flex items-center justify-center shadow-lg shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                ZENKAI<span className="text-[#E50914]">.</span>MOVIES
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'movies', label: 'Movies' },
              { id: 'tv', label: 'TV Shows' },
              { id: 'dubbed', label: 'Multi-Audio Dubs' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'text-white bg-white/10 shadow-inner' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center space-x-3.5">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MovieBox 4K Active</span>
          </div>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all text-sm group"
          >
            <Search className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Search movies, series...</span>
            <kbd className="hidden lg:inline text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 text-gray-400">Ctrl K</kbd>
          </button>
        </div>

      </div>
    </nav>
  );
}

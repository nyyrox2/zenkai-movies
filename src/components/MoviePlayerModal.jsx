import React, { useState, useEffect } from 'react';
import { X, Play, Download, Volume2, ShieldCheck, Film, Star, Calendar, Clock, AlertTriangle, Layers } from 'lucide-react';
import { fetchMovieStream } from '../services/api';

export default function MoviePlayerModal({ movie, onClose }) {
  if (!movie) return null;

  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDub, setSelectedDub] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedServer, setSelectedServer] = useState('moviebox');
  const [activeTab, setActiveTab] = useState('SERVERS'); // 'SERVERS' | 'OVERVIEW'

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const type = movie.media_type === 'tv' ? 'tv' : 'movie';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  // Load stream
  useEffect(() => {
    let isCancelled = false;
    async function loadStream() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchMovieStream({
          id: movie.id,
          type,
          season: 1,
          episode: 1,
          title,
          year,
          dubId: selectedDub
        });

        if (isCancelled) return;
        if (res && res.success) {
          setStreamData(res);
          setSelectedQuality(res.quality || (res.streams?.[0]?.quality));
        } else {
          setError(res?.error || 'Stream not found on MovieBox');
          if (res?.embedServers?.length > 0) {
            setStreamData(res);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Error loading stream');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadStream();
    return () => { isCancelled = true; };
  }, [movie.id, selectedDub]);

  // Active stream item
  const activeStream = streamData?.streams?.find(s => s.quality === selectedQuality) || streamData?.streams?.[0];
  const streamUrl = activeStream?.streamUrl || streamData?.streamUrl;
  const downloadUrl = activeStream?.downloadUrl || streamData?.downloadUrl || streamUrl;
  const downloadFileName = activeStream?.downloadFileName || `${title} [${selectedQuality || 'HD'}].mp4`;

  // Embed servers list
  const embedServers = streamData?.embedServers || [
    { id: 'moviebox', label: 'MovieBox (Direct)', tags: '4K • Multi-Audio', isDirect: true },
    { id: 'vidzee', label: 'Captain America', tags: 'Multi-Audio', isDirect: false, embedUrl: `https://vidzee.org/embed/${type}/${movie.id}` },
    { id: 'videasy', label: 'Iron Man (4K)', tags: '4K • Multi-Sub', isDirect: false, embedUrl: `https://player.videasy.net/${type}/${movie.id}` },
    { id: 'vidup', label: 'Thor', tags: 'HD', isDirect: false, embedUrl: `https://vidup.me/embed/${type}/${movie.id}` },
    { id: 'vidcore', label: 'Hulk', tags: 'Fast Load', isDirect: false, embedUrl: `https://vidcore.me/embed/${type}/${movie.id}` },
  ];

  const currentServerObj = embedServers.find(s => s.id === selectedServer) || embedServers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#14151D] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0B0C10]/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                {title}
              </h2>
              <p className="text-xs text-gray-400">
                {year} • {type.toUpperCase()} • Server: <span className="text-[#FF4552] font-semibold">{currentServerObj?.label}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container (16:9 Aspect Ratio) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {selectedServer === 'moviebox' && currentServerObj?.isDirect ? (
            loading ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Resolving 4K Direct Stream & Multi-Audio Dubs…</p>
              </div>
            ) : error || !streamUrl ? (
              <div className="flex flex-col items-center text-center p-6 space-y-3 max-w-md">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <h4 className="text-white font-semibold">MovieBox Direct Stream Unavailable</h4>
                <p className="text-xs text-gray-400">{error || 'Try switching to another server below.'}</p>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setSelectedServer('videasy')}
                    className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold hover:bg-[#F40612]"
                  >
                    Switch to Iron Man (4K)
                  </button>
                </div>
              </div>
            ) : (
              <video 
                key={streamUrl}
                src={streamUrl} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full object-contain"
              />
            )
          ) : (
            /* Embed Server Iframe */
            <iframe 
              src={currentServerObj?.embedUrl} 
              title={title}
              allowFullScreen 
              allow="autoplay; encrypted-media; picture-in-picture"
              className="w-full h-full border-0"
            />
          )}
        </div>

        {/* Player Controls & Dubs (Only for MovieBox) */}
        {selectedServer === 'moviebox' && streamData && !loading && (
          <div className="p-4 bg-[#1A1B26]/60 border-b border-white/5 space-y-3">
            
            {/* Audio Dub Selector */}
            {streamData.dubs?.length > 1 && (
              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <span className="text-xs font-bold text-gray-400 flex items-center space-x-1 uppercase tracking-wider">
                  <Volume2 className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>AUDIO:</span>
                </span>
                {streamData.dubs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDub(d.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      (selectedDub === d.id || (!selectedDub && d.selected))
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quality Switcher & Download */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {streamData.streams?.length > 0 && (
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">QUALITY:</span>
                  {streamData.streams.map(s => (
                    <button
                      key={s.quality}
                      onClick={() => setSelectedQuality(s.quality)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        selectedQuality === s.quality
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {s.quality} {s.sizeLabel ? `(${s.sizeLabel})` : ''}
                    </button>
                  ))}
                </div>
              )}

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFileName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#E50914] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4 {activeStream?.sizeLabel ? `(${activeStream.sizeLabel})` : ''}</span>
                </a>
              )}
            </div>

          </div>
        )}

        {/* Bottom Tabs: SERVERS / OVERVIEW */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('SERVERS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'SERVERS'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              SERVERS
            </button>
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              OVERVIEW
            </button>
          </div>

          {activeTab === 'SERVERS' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {embedServers.map(server => (
                <button
                  key={server.id}
                  onClick={() => setSelectedServer(server.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedServer === server.id
                      ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-lg shadow-[#E50914]/20'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${server.isDirect ? 'bg-[#E50914]' : 'bg-emerald-400'}`} />
                    <span className="text-xs font-bold line-clamp-1">{server.label}</span>
                  </div>
                  {server.tags && (
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{server.tags}</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-300">
              <p className="leading-relaxed">
                {movie.overview || "No synopsis available."}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400 pt-2">
                {rating && <span>Rating: <strong className="text-amber-400">{rating} / 10</strong></span>}
                {year && <span>Release: <strong className="text-white">{year}</strong></span>}
                <span>Type: <strong className="text-white uppercase">{type}</strong></span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Search, Play, X, Film } from 'lucide-react';
import { Track } from '../types';

interface VideoStreamFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAndPlay: (track: Track) => void;
}

export const VideoStreamFinderModal: React.FC<VideoStreamFinderModalProps> = ({
  isOpen,
  onClose,
  onImportAndPlay
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([
    {
      id: 'yt-1',
      title: 'Humnava (Hamari Adhuri Kahani) - Full Audio',
      artist: 'Mithoon, Papon',
      album: 'YouTube Music Stream',
      duration: 275,
      genre: 'Bollywood',
      year: 2015,
      source: 'IMPORTED',
      trackNumber: 1,
      bitrate: '320 kbps Stream',
      sampleRate: '48000 Hz',
      format: 'MP3',
      fileSizeBytes: 11010048,
      dateAdded: Date.now(),
      skipCount: 0,
      folderPath: '/StreamCache/YouTube',
      isFavorite: false,
      playCount: 154,
      coverGradient: ['#e11d48', '#831843'],
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
      lyricsLrc: ''
    },
    {
      id: 'yt-2',
      title: 'Duniyaa (Luka Chuppi) Official Music Video',
      artist: 'Akhil, Dhvani Bhanushali',
      album: 'T-Series Channel',
      duration: 225,
      genre: 'Romantic',
      year: 2019,
      source: 'IMPORTED',
      trackNumber: 2,
      bitrate: '320 kbps Stream',
      sampleRate: '48000 Hz',
      format: 'MP3',
      fileSizeBytes: 9000000,
      dateAdded: Date.now(),
      skipCount: 0,
      folderPath: '/StreamCache/YouTube',
      isFavorite: false,
      playCount: 220,
      coverGradient: ['#b91c1c', '#450a0a'],
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      lyricsLrc: ''
    },
    {
      id: 'yt-3',
      title: 'Basanta Ese Geche - Lagnajita Acoustic Live',
      artist: 'Lagnajita Chakraborty',
      album: 'Live Acoustic Session',
      duration: 230,
      genre: 'Bengali Acoustic',
      year: 2021,
      source: 'IMPORTED',
      trackNumber: 3,
      bitrate: '320 kbps Stream',
      sampleRate: '48000 Hz',
      format: 'MP3',
      fileSizeBytes: 9200000,
      dateAdded: Date.now(),
      skipCount: 0,
      folderPath: '/StreamCache/YouTube',
      isFavorite: false,
      playCount: 180,
      coverGradient: ['#047857', '#064e3b'],
      coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
      lyricsLrc: ''
    }
  ]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const newTrack: Track = {
      id: `yt-stream-${Date.now()}`,
      title: query.trim(),
      artist: 'Online Stream / YouTube',
      album: 'Web Audio Stream',
      duration: 240,
      genre: 'Stream Audio',
      year: new Date().getFullYear(),
      source: 'IMPORTED',
      trackNumber: 1,
      bitrate: '320 kbps HD',
      sampleRate: '48000 Hz',
      format: 'MP3',
      fileSizeBytes: 9500000,
      dateAdded: Date.now(),
      skipCount: 0,
      folderPath: '/StreamCache/Online',
      isFavorite: false,
      playCount: 1,
      coverGradient: ['#dc2626', '#7f1d1d'],
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      lyricsLrc: ''
    };
    setSearchResults(prev => [newTrack, ...prev]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="p-5 bg-gradient-to-r from-red-900/60 via-zinc-900 to-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Video & Online Stream
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-mono">Audio Mode</span>
              </h3>
              <p className="text-xs text-zinc-400">Search music videos or stream audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search song title or paste video URL..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/20"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Results list */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-red-500/30 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 overflow-hidden relative shadow"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-5 h-5 text-white/80" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist} • {track.album}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onImportAndPlay(track);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-1 text-xs font-semibold shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, ChevronUp, Maximize2, ListMusic, Music2 } from 'lucide-react';
import { Track } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenNowPlaying: () => void;
  onOpenQueue: () => void;
  currentTime: number;
  duration: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleFavorite,
  onOpenNowPlaying,
  onOpenQueue,
  currentTime,
  duration
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-auto select-none">
      <div className="max-w-4xl mx-auto relative">
        
        {/* Floating Chevron Up Button Centered on Top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={onOpenNowPlaying}
            className="w-7 h-7 rounded-full bg-[#1e293b] border border-white/20 text-zinc-300 hover:text-white hover:bg-[#0284c7] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Expand Now Playing"
          >
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        <div 
          className="backdrop-blur-2xl bg-[#0b1726]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden cursor-pointer group hover:border-[#0284c7]/40 transition-all duration-300"
          onClick={onOpenNowPlaying}
        >
          {/* Top Slim Progress Indicator */}
          <div className="w-full bg-white/5 h-1">
            <div 
              className="h-full bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-cyan-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between p-2.5 sm:p-3 gap-3">
            {/* Track Cover & Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md flex items-center justify-center relative overflow-hidden bg-zinc-900 border border-white/10"
                style={{
                  background: currentTrack.coverGradient
                    ? `linear-gradient(135deg, ${currentTrack.coverGradient[0]}, ${currentTrack.coverGradient[1]})`
                    : 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}
              >
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-5 h-5 text-white/70" />
                )}

                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-end justify-center pb-2 gap-0.5">
                    <div className="w-1 bg-[#38bdf8] rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 bg-[#38bdf8] rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 bg-[#38bdf8] rounded-full animate-bounce h-3" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#38bdf8] transition">
                    {currentTrack.title}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/30 flex-shrink-0">
                    {currentTrack.format || 'FLAC'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Quick Playback Controls */}
            <div 
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                id="mini-favorite-btn"
                onClick={() => onToggleFavorite(currentTrack.id)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  currentTrack.isFavorite ? 'text-pink-500 bg-pink-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                id="mini-play-pause-btn"
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] flex items-center justify-center text-white shadow-lg shadow-[#0284c7]/30 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                id="mini-next-btn"
                onClick={onNext}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Maximize2, ListMusic } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-auto">
      <div 
        className="max-w-4xl mx-auto backdrop-blur-2xl bg-zinc-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden cursor-pointer group hover:border-indigo-500/40 transition-all duration-300"
        onClick={onOpenNowPlaying}
      >
        {/* Top Slim Progress Indicator */}
        <div className="w-full bg-white/10 h-1">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 sm:p-3 gap-3">
          {/* Track Cover & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${currentTrack.coverGradient[0]}, ${currentTrack.coverGradient[1]})`
              }}
            >
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-4">
                  <div className="w-1 bg-white/90 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 bg-white/90 rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 bg-white/90 rounded-full animate-bounce h-3" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                  {currentTrack.title}
                </p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
                  {currentTrack.format}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                {currentTrack.artist} • {currentTrack.album}
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
              className={`p-2 rounded-xl transition ${
                currentTrack.isFavorite ? 'text-pink-500 bg-pink-500/15' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              id="mini-prev-btn"
              onClick={onPrevious}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              id="mini-play-pause-btn"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              id="mini-next-btn"
              onClick={onNext}
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              id="mini-queue-btn"
              onClick={onOpenQueue}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition hidden sm:flex"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <button
              id="mini-expand-btn"
              onClick={onOpenNowPlaying}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

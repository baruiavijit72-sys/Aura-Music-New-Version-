import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  Shuffle, 
  Heart, 
  Sparkles, 
  ChevronRight, 
  ChevronUp,
  SlidersHorizontal,
  FolderSync,
  MessageSquare,
  Clock,
  Music2,
  Headphones,
  LayoutGrid,
  Radio,
  Disc3,
  Flame,
  Volume2
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { RealAdBanner } from '../components/RealAdBanner';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack?: Track | null;
  isPlaying?: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay?: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onNavigateTab: (tab: 'home' | 'library' | 'playlists' | 'analytics' | 'settings') => void;
  onOpenScan: () => void;
  onOpenFeedback: () => void;
  onOpenWidgets: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying = false,
  onPlayTrack,
  onTogglePlay,
  onSelectPlaylist,
  onNavigateTab,
  onOpenScan,
  onOpenFeedback,
  onOpenWidgets,
}) => {
  const [activeFilter, setActiveFilter] = useState<'for_you' | 'songs' | 'playlists' | 'folders' | 'albums' | 'artists'>('for_you');

  // Compute realistic buckets from tracks
  const favoriteTracks = tracks.filter(t => t.isFavorite);
  const recentlyPlayedTracks = [...tracks].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, 8);
  const mostPlayedTracks = [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 8);
  const lastAddedTracks = [...tracks].slice(0, 8);
  const featuredTracks = [...tracks].slice(0, 6);

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * tracks.length);
    onPlayTrack(tracks[randomIndex]);
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    if (currentTrack) {
      if (onTogglePlay) onTogglePlay();
      else onPlayTrack(currentTrack);
    } else {
      onPlayTrack(tracks[0]);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-white select-none">
      
      {/* 1. TOP FILTER PILLS BAR: [ For you ] [ Songs ] [ Playlists ] [ Folders ] [ Albums ] [ Artists ] */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveFilter('for_you')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'for_you'
              ? 'bg-white text-zinc-950 shadow-md scale-102'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          For you
        </button>

        <button
          onClick={() => {
            setActiveFilter('songs');
            onNavigateTab('library');
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'songs'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Songs
        </button>

        <button
          onClick={() => {
            setActiveFilter('playlists');
            onNavigateTab('playlists');
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'playlists'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Playlists
        </button>

        <button
          onClick={() => {
            setActiveFilter('folders');
            onOpenScan();
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'folders'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Folders
        </button>

        <button
          onClick={() => {
            setActiveFilter('albums');
            onNavigateTab('library');
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'albums'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Albums
        </button>

        <button
          onClick={() => {
            setActiveFilter('artists');
            onNavigateTab('library');
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeFilter === 'artists'
              ? 'bg-white text-zinc-950 shadow-md'
              : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
        >
          Artists
        </button>
      </div>

      {/* 2. ADD WIDGETS BANNER */}
      <div 
        onClick={onOpenWidgets}
        className="w-full p-3.5 sm:p-4 rounded-2xl bg-[#0f2438]/80 border border-[#0284c7]/40 hover:border-[#0284c7] cursor-pointer flex items-center justify-between transition-all duration-200 hover:bg-[#0f2438] active:scale-[0.99] shadow-lg shadow-black/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0284c7]/20 flex items-center justify-center text-[#38bdf8]">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-[#38bdf8] tracking-wide">
            Add widgets to your home screen
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#38bdf8]" />
      </div>

      {/* 3. 2x2 QUICK ACTION GRID */}
      <div className="grid grid-cols-2 gap-3">
        {/* Shuffle Button */}
        <button
          onClick={handleShuffleAll}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#142334]/90 border border-white/5 hover:border-[#0284c7]/40 flex items-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-md text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 flex items-center justify-center text-[#38bdf8]">
            <Shuffle className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Shuffle
          </span>
        </button>

        {/* Play Button */}
        <button
          onClick={handlePlayAll}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#142334]/90 border border-white/5 hover:border-[#0284c7]/40 flex items-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-md text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 flex items-center justify-center text-[#38bdf8]">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Play
          </span>
        </button>

        {/* Scan music */}
        <button
          onClick={onOpenScan}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#142334]/90 border border-white/5 hover:border-[#0284c7]/40 flex items-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-md text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 flex items-center justify-center text-[#38bdf8]">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Scan music
          </span>
        </button>

        {/* Feedback */}
        <button
          onClick={onOpenFeedback}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#142334]/90 border border-white/5 hover:border-[#0284c7]/40 flex items-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-md text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0284c7]/15 flex items-center justify-center text-[#38bdf8]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Feedback
          </span>
        </button>
      </div>

      {/* 4. SECTION: LAST ADDED > */}
      <section className="space-y-3">
        <div 
          onClick={() => onNavigateTab('library')}
          className="flex items-center gap-1.5 cursor-pointer group w-fit"
        >
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition">
            Last added
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#38bdf8] transition" />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {lastAddedTracks.map((track) => (
            <div
              key={`last-added-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className="w-28 sm:w-32 shrink-0 group cursor-pointer"
            >
              {/* Square thumbnail with bottom-right mini play button */}
              <div 
                className="w-28 sm:w-32 h-28 sm:h-32 rounded-2xl relative overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#38bdf8]/50 transition shadow-md"
                style={{
                  background: track.coverGradient
                    ? `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    : 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}
              >
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 group-hover:text-white/80 transition">
                    <Music2 className="w-10 h-10" />
                  </div>
                )}

                {/* Bottom Right Play Circle Overlay */}
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-[#0284c7] group-hover:border-[#38bdf8] transition shadow-lg">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </div>
              </div>

              {/* Title & Artist */}
              <p className="text-xs font-bold text-white truncate mt-2 group-hover:text-[#38bdf8] transition">
                {track.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {track.artist || '<unknown>'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SECTION: MY FAVOURITE > */}
      <section className="space-y-3">
        <div 
          onClick={() => {
            const favPl = playlists.find(p => p.id === 'pl-fav') || playlists[0];
            if (favPl) onSelectPlaylist(favPl);
            else onNavigateTab('playlists');
          }}
          className="flex items-center gap-1.5 cursor-pointer group w-fit"
        >
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition">
            My favourite
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#38bdf8] transition" />
        </div>

        {/* 2-row horizontal grid */}
        <div className="grid grid-rows-2 grid-flow-col gap-2.5 overflow-x-auto no-scrollbar pb-2">
          {favoriteTracks.slice(0, 8).map((track) => (
            <div
              key={`fav-grid-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className="w-56 sm:w-64 p-2 rounded-2xl bg-[#142334]/80 border border-white/5 hover:border-[#0284c7]/40 flex items-center justify-between gap-2.5 cursor-pointer transition hover:bg-[#142334] group shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-zinc-900 relative shadow"
                  style={{
                    background: track.coverGradient
                      ? `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                      : 'linear-gradient(135deg, #1e293b, #0f172a)'
                  }}
                >
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      <Music2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#38bdf8] transition">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-zinc-300 group-hover:text-[#38bdf8] group-hover:bg-black/80 transition shrink-0">
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SECTION: RECENTLY PLAYED > */}
      <section className="space-y-3">
        <div 
          onClick={() => onNavigateTab('library')}
          className="flex items-center gap-1.5 cursor-pointer group w-fit"
        >
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition">
            Recently played
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#38bdf8] transition" />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {recentlyPlayedTracks.map((track) => (
            <div
              key={`recent-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className="w-28 sm:w-32 shrink-0 group cursor-pointer"
            >
              <div 
                className="w-28 sm:w-32 h-28 sm:h-32 rounded-2xl relative overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-[#38bdf8]/50 transition shadow-md"
                style={{
                  background: track.coverGradient
                    ? `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    : 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}
              >
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <Music2 className="w-10 h-10" />
                  </div>
                )}

                {/* Bottom Right Play Circle Overlay */}
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-[#0284c7] group-hover:border-[#38bdf8] transition shadow-lg">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </div>
              </div>

              <p className="text-xs font-bold text-white truncate mt-2 group-hover:text-[#38bdf8] transition">
                {track.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {track.artist}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SECTION: MOST PLAYED > (Circular Portraits with Listen Count) */}
      <section className="space-y-3">
        <div 
          onClick={() => onNavigateTab('analytics')}
          className="flex items-center gap-1.5 cursor-pointer group w-fit"
        >
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#38bdf8] transition">
            Most played
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-[#38bdf8] transition" />
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 items-center">
          {mostPlayedTracks.map((track) => (
            <div
              key={`most-played-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className="w-20 sm:w-24 shrink-0 flex flex-col items-center text-center group cursor-pointer"
            >
              {/* Circular portrait with centered play overlay */}
              <div 
                className="w-18 sm:w-20 h-18 sm:h-20 rounded-full relative overflow-hidden bg-zinc-900 border-2 border-white/10 group-hover:border-[#38bdf8] transition shadow-md"
                style={{
                  background: track.coverGradient
                    ? `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    : 'linear-gradient(135deg, #1e293b, #0f172a)'
                }}
              >
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <Music2 className="w-7 h-7" />
                  </div>
                )}

                {/* Centered Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                  <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-[#0284c7] transition">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <p className="text-xs font-bold text-white truncate w-full mt-2 group-hover:text-[#38bdf8] transition">
                {track.title}
              </p>

              {/* Listen Count */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                <Headphones className="w-3 h-3 text-zinc-400" />
                <span className="font-semibold">{track.playCount || 40}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. SECTION: FEATURED (With Shuffle Button on Right) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Featured
          </h3>

          <button
            onClick={handleShuffleAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#142334] border border-white/10 hover:border-[#0284c7]/50 text-xs font-bold text-white hover:text-[#38bdf8] transition cursor-pointer shadow-sm"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* 2-row / 2-column list of featured songs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {featuredTracks.map((track) => (
            <div
              key={`featured-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className="p-2.5 rounded-2xl bg-[#142334]/80 border border-white/5 hover:border-[#0284c7]/40 flex items-center justify-between gap-3 cursor-pointer transition hover:bg-[#142334] group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-900 relative shadow"
                  style={{
                    background: track.coverGradient
                      ? `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                      : 'linear-gradient(135deg, #1e293b, #0f172a)'
                  }}
                >
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      <Music2 className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#38bdf8] transition">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-zinc-300 group-hover:text-[#38bdf8] group-hover:bg-black/80 transition shrink-0">
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real Interactive Ad Network Banner */}
      <RealAdBanner slotIndex={0} />
    </div>
  );
};

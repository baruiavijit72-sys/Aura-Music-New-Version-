import React from 'react';
import { 
  Play, 
  Heart, 
  Sparkles, 
  Share2, 
  Clock, 
  Flame, 
  TrendingUp, 
  Zap, 
  Music, 
  Disc, 
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { RealAdBanner } from '../components/RealAdBanner';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenP2P: () => void;
  onOpenEQ: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  onPlayTrack,
  onSelectPlaylist,
  onOpenP2P,
  onOpenEQ,
}) => {
  const { t } = useTranslation();
  const favoriteTracks = tracks.filter(t => t.isFavorite);
  const recentTracks = [...tracks].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0)).slice(0, 4);

  return (
    <div className="space-y-6 pb-28">
      {/* Hero P2P Mesh & Hi-Res Banner */}
      <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900/80 via-purple-950/80 to-zinc-950 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t.home.welcome}
            </h2>
            <p className="text-xs text-zinc-300">
              {t.home.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => tracks.length > 0 && onPlayTrack(tracks[0])}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold transition hover:bg-zinc-200 active:scale-95 shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-black" />
              <span>{t.player.play} ({tracks.length})</span>
            </button>

            <button
              onClick={onOpenP2P}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition active:scale-95 shadow cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.home.shareP2P}</span>
            </button>

            <button
              onClick={onOpenEQ}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/15 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-bold transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.player.equalizer}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Interactive Ad Slot */}
      <RealAdBanner slotIndex={0} />

      {/* Quick Playlists Cards (if any exist) */}
      {playlists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">{t.home.playlists}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {playlists.slice(0, 4).map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-4 rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <div 
                  className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-white shadow-md relative overflow-hidden group-hover:scale-105 transition"
                  style={{
                    background: pl.coverGradient
                      ? `linear-gradient(135deg, ${pl.coverGradient[0]}, ${pl.coverGradient[1]})`
                      : 'linear-gradient(135deg, #6366f1, #a855f7)'
                  }}
                >
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                  {pl.name}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played High-Res Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">{t.home.recentlyPlayed}</h3>
          </div>
          <span className="text-xs text-zinc-500">{recentTracks.length} items</span>
        </div>

        {recentTracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="group p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-3 transition hover:bg-zinc-900 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition shadow"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    <Play className="w-5 h-5 fill-current opacity-80 group-hover:opacity-100" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist} • {track.album}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {track.format}
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">{track.sampleRate}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center space-y-2">
            <Music className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">{t.home.emptyLibraryTitle}</p>
            <p className="text-[11px] text-zinc-500">{t.home.emptyLibrarySubtitle}</p>
          </div>
        )}
      </section>

      {/* Favorited Tracks Quick Shelf */}
      {favoriteTracks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-current" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">{t.library.favorites}</h3>
          </div>

          <div className="space-y-2">
            {favoriteTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-pink-500/30 flex items-center justify-between cursor-pointer transition hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    <Heart className="w-4 h-4 fill-current text-white/90" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{track.artist} • {track.genre}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-zinc-500">
                  {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

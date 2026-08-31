import React, { useState } from 'react';
import { 
  Plus, 
  ListMusic, 
  Heart, 
  Flame, 
  Clock, 
  Pin, 
  Play, 
  Shuffle, 
  Trash2, 
  Copy, 
  Sparkles, 
  ChevronRight,
  Music,
  Zap
} from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onOpenCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  onTogglePinPlaylist: (id: string) => void;
  onDuplicatePlaylist: (playlist: Playlist) => void;
  activePlaylist: Playlist | null;
  setActivePlaylist: (playlist: Playlist | null) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  onPlayTrack,
  onOpenCreatePlaylist,
  onDeletePlaylist,
  onTogglePinPlaylist,
  onDuplicatePlaylist,
  activePlaylist,
  setActivePlaylist,
}) => {
  // If viewing a single playlist's contents
  if (activePlaylist) {
    const playlistTracks = activePlaylist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);

    const handlePlayAll = (shuffle: boolean) => {
      if (playlistTracks.length === 0) return;
      const targetTracks = shuffle ? [...playlistTracks].sort(() => Math.random() - 0.5) : playlistTracks;
      onPlayTrack(targetTracks[0]);
    };

    return (
      <div className="space-y-5 pb-28">
        {/* Back and Playlist Header */}
        <button
          onClick={() => setActivePlaylist(null)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          ← Back to All Playlists
        </button>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-white/10 flex flex-col sm:flex-row items-center gap-5">
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl flex-shrink-0"
            style={{
              background: activePlaylist.coverGradient
                ? `linear-gradient(135deg, ${activePlaylist.coverGradient[0]}, ${activePlaylist.coverGradient[1]})`
                : 'linear-gradient(135deg, #6366f1, #a855f7)'
            }}
          >
            <Music className="w-12 h-12 text-white" />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {activePlaylist.isSmart ? 'AUTO SMART PLAYLIST' : 'USER PLAYLIST'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{activePlaylist.name}</h2>
            <p className="text-xs text-zinc-400">{activePlaylist.description}</p>
            <p className="text-xs text-zinc-500 font-medium">
              {playlistTracks.length} tracks • {Math.round(playlistTracks.reduce((acc, t) => acc + t.duration, 0) / 60)} mins
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayAll(false)}
              disabled={playlistTracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => handlePlayAll(true)}
              disabled={playlistTracks.length === 0}
              className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition disabled:opacity-40"
              title="Shuffle Playlist"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tracks List inside playlist */}
        <div className="space-y-2">
          {playlistTracks.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              No tracks in this playlist yet. Add songs from Library!
            </div>
          ) : (
            playlistTracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between cursor-pointer transition hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-zinc-500 w-4 text-center">{idx + 1}</span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{track.artist} • {track.format}</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-500">
                  {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // All Playlists Grid & List
  const smartPlaylists = playlists.filter(p => p.isSmart);
  const customPlaylists = playlists.filter(p => !p.isSmart);

  return (
    <div className="space-y-6 pb-28">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Smart & Custom Playlists</h2>
          <p className="text-xs text-zinc-400">Dynamic rule-based collections & curated mixes</p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Smart Playlists Section (if any exist) */}
      {smartPlaylists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Auto Smart Playlists</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {smartPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className="p-4 rounded-3xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition hover:-translate-y-1 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow"
                    style={{
                      background: pl.coverGradient
                        ? `linear-gradient(135deg, ${pl.coverGradient[0]}, ${pl.coverGradient[1]})`
                        : 'linear-gradient(135deg, #6366f1, #a855f7)'
                    }}
                  >
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    SMART
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{pl.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{pl.description}</p>
                  <p className="text-[11px] text-zinc-500 mt-2">{pl.trackIds.length} tracks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Playlists Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">User Playlists ({customPlaylists.length})</h3>
          </div>
        </div>

        {customPlaylists.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
            <p className="text-xs text-zinc-500">You haven't created any custom playlists yet.</p>
            <button
              onClick={onOpenCreatePlaylist}
              className="px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-600/50"
            >
              Create First Playlist
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist(pl)}
                className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-purple-500/40 flex items-center justify-between gap-3 cursor-pointer transition hover:bg-zinc-850"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow"
                    style={{
                      background: pl.coverGradient
                        ? `linear-gradient(135deg, ${pl.coverGradient[0]}, ${pl.coverGradient[1]})`
                        : 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                    }}
                  >
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                    <p className="text-xs text-zinc-400 truncate">{pl.description}</p>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block">{pl.trackIds.length} tracks</span>
                  </div>
                </div>

                <div 
                  className="flex items-center gap-1.5 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onDuplicatePlaylist(pl)}
                    title="Duplicate Playlist"
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeletePlaylist(pl.id)}
                    title="Delete Playlist"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-zinc-500 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

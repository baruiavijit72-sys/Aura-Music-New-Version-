import React, { useState, useMemo } from 'react';
import {
  Disc,
  Play,
  Shuffle,
  MoreVertical,
  ArrowLeft,
  Search,
  ListPlus,
  Plus,
  Tags,
  Trash2,
  Scissors,
  Share2,
  Sparkles,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Check,
  ListMusic,
  Clock,
  Music2,
  FolderOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { Track, Playlist } from '../types';

interface AlbumsBrowserProps {
  tracks: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (trackId: string, playlistId: string) => void;
  onOpenTagEditor: (track: Track) => void;
  onOpenAudioTrimmer: (track: Track) => void;
  onOpenP2PWithTrack: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
}

type AlbumSortMode = 'name-asc' | 'name-desc' | 'count-desc' | 'artist-asc' | 'year-desc';
type TrackSortMode = 'trackNumber' | 'title' | 'artist' | 'duration' | 'bitrate';

export const AlbumsBrowser: React.FC<AlbumsBrowserProps> = ({
  tracks,
  playlists,
  onPlayTrack,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onOpenTagEditor,
  onOpenAudioTrimmer,
  onOpenP2PWithTrack,
  onDeleteTrack
}) => {
  // Navigation
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<AlbumSortMode>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // In-Album states
  const [inAlbumSearch, setInAlbumSearch] = useState('');
  const [inAlbumSort, setInAlbumSort] = useState<TrackSortMode>('trackNumber');

  // Context Menus
  const [activeAlbumMenu, setActiveAlbumMenu] = useState<string | null>(null);
  const [activeTrackMenuId, setActiveTrackMenuId] = useState<string | null>(null);

  // Modals & Pickers
  const [playlistPickerTracks, setPlaylistPickerTracks] = useState<Track[] | null>(null);
  const [playlistPickerSingleTrack, setPlaylistPickerSingleTrack] = useState<Track | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTotalTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Group tracks by album name
  const albumsMap = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach(track => {
      const alb = (track.album && track.album.trim()) ? track.album.trim() : 'Unknown Album';
      if (!map.has(alb)) {
        map.set(alb, []);
      }
      map.get(alb)!.push(track);
    });
    return map;
  }, [tracks]);

  // Recently played albums
  const recentlyPlayedAlbums = useMemo(() => {
    const list: { albumName: string; tracks: Track[]; lastPlayed: number; topTrack: Track }[] = [];
    albumsMap.forEach((albumTracks, albumName) => {
      const maxLastPlayed = Math.max(...albumTracks.map(t => t.lastPlayed || 0), 0);
      const topTrack = [...albumTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0] || albumTracks[0];
      list.push({
        albumName,
        tracks: albumTracks,
        lastPlayed: maxLastPlayed || topTrack.playCount * 1000,
        topTrack
      });
    });

    return list
      .sort((a, b) => b.lastPlayed - a.lastPlayed)
      .slice(0, 10);
  }, [albumsMap]);

  // Filtered and Sorted album names
  const albumNames = useMemo(() => {
    const list = Array.from(albumsMap.keys());

    const filtered = list.filter(name => {
      const q = searchTerm.toLowerCase();
      const albumTracks = albumsMap.get(name) || [];
      const artist = albumTracks[0]?.artist || '';
      return name.toLowerCase().includes(q) || artist.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      const tracksA = albumsMap.get(a) || [];
      const tracksB = albumsMap.get(b) || [];
      const artistA = (tracksA[0]?.artist || '').toLowerCase();
      const artistB = (tracksB[0]?.artist || '').toLowerCase();
      const yearA = Math.max(...tracksA.map(t => t.year || 0), 0);
      const yearB = Math.max(...tracksB.map(t => t.year || 0), 0);

      switch (sortMode) {
        case 'name-asc': return a.localeCompare(b);
        case 'name-desc': return b.localeCompare(a);
        case 'count-desc': return tracksB.length - tracksA.length;
        case 'artist-asc': return artistA.localeCompare(artistB);
        case 'year-desc': return yearB - yearA;
        default: return a.localeCompare(b);
      }
    });
  }, [albumsMap, searchTerm, sortMode]);

  // Album actions
  const handlePlayAlbum = (albumName: string, shuffle = false) => {
    const albumTracks = albumsMap.get(albumName) || [];
    if (albumTracks.length === 0) return;

    if (shuffle) {
      const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0]);
      shuffled.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Shuffling album "${albumName}" (${albumTracks.length} songs)`);
    } else {
      onPlayTrack(albumTracks[0]);
      albumTracks.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Playing album "${albumName}"`);
    }
    setActiveAlbumMenu(null);
  };

  const handleQueueAlbum = (albumName: string, next = false) => {
    const albumTracks = albumsMap.get(albumName) || [];
    if (albumTracks.length === 0) return;

    if (next) {
      [...albumTracks].reverse().forEach(t => onPlayNext(t));
      showToast(`Playing next: ${albumTracks.length} songs from "${albumName}"`);
    } else {
      albumTracks.forEach(t => onAddToQueue(t));
      showToast(`Added ${albumTracks.length} songs from "${albumName}" to queue`);
    }
    setActiveAlbumMenu(null);
  };

  // Selected Album Tracks
  const currentAlbumTracks = useMemo(() => {
    if (!selectedAlbum) return [];
    const list = albumsMap.get(selectedAlbum) || [];

    const filtered = list.filter(t => {
      const q = inAlbumSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.format.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      switch (inAlbumSort) {
        case 'trackNumber': return (a.trackNumber || 1) - (b.trackNumber || 1);
        case 'title': return a.title.localeCompare(b.title);
        case 'artist': return a.artist.localeCompare(b.artist);
        case 'duration': return b.duration - a.duration;
        case 'bitrate': return (b.format === 'FLAC' ? 1 : 0) - (a.format === 'FLAC' ? 1 : 0);
        default: return (a.trackNumber || 1) - (b.trackNumber || 1);
      }
    });
  }, [selectedAlbum, albumsMap, inAlbumSearch, inAlbumSort]);

  return (
    <div className="space-y-4 pb-20 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: INSIDE AN ALBUM ("Album er vitor ta" - Rich Interactive Explorer) */}
      {/* ========================================================================= */}
      {selectedAlbum ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top navigation & breadcrumb */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedAlbum(null);
                setInAlbumSearch('');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Albums</span>
            </button>

            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-white/5 truncate max-w-[200px] sm:max-w-xs inline-block">
                Album: {selectedAlbum}
              </span>
            </div>
          </div>

          {/* Album Hero Header Banner */}
          {(() => {
            const albumTracks = albumsMap.get(selectedAlbum) || [];
            const first = albumTracks[0] || tracks[0];
            const primaryArtist = first?.artist || 'Various Artists';
            const year = Math.max(...albumTracks.map(t => t.year || 0), 0);
            const totalBytes = albumTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
            const totalDurationSecs = albumTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
            const flacCount = albumTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;
            const genres = Array.from(new Set(albumTracks.map(t => t.genre).filter(Boolean)));

            return (
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-950 border border-indigo-500/30 shadow-2xl space-y-4">
                {/* Ambient glow backdrop */}
                <div
                  className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#6366f1'}, ${first?.coverGradient?.[1] || '#a855f7'})`
                  }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Album Artwork with Vinyl record effect */}
                    <div className="relative group/art flex-shrink-0">
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-0.5 shadow-2xl overflow-hidden relative flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                        }}
                      >
                        {first?.coverUrl ? (
                          <img
                            src={first.coverUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-[14px]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Disc className="w-10 h-10 text-white/90 drop-shadow-md" />
                        )}
                        <div className="absolute inset-0 bg-black/20 rounded-[14px]" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                          {selectedAlbum}
                        </h2>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {albumTracks.length} Songs
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-zinc-300 truncate">
                        Artist: <span className="text-indigo-400">{primaryArtist}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400 font-medium">
                        {year > 0 && (
                          <>
                            <span>{year}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatTotalTime(totalDurationSecs)}</span>
                        <span>•</span>
                        <span>{formatBytes(totalBytes)}</span>
                        {flacCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">
                              {flacCount} Hi-Res Lossless
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Genres Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {genres.map(g => (
                      <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-800/90 text-indigo-300 border border-indigo-500/20 shadow-sm">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handlePlayAlbum(selectedAlbum, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg hover:shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play All ({albumTracks.length})</span>
                  </button>

                  <button
                    onClick={() => handlePlayAlbum(selectedAlbum, true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer shadow"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={() => setPlaylistPickerTracks(albumTracks)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add album to playlist"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Add to Playlist</span>
                  </button>

                  <button
                    onClick={() => handleQueueAlbum(selectedAlbum, false)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all songs to queue"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Add to Queue</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* In-Album Search & Sorter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-2xl bg-zinc-900/90 border border-white/10">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inAlbumSearch}
                onChange={(e) => setInAlbumSearch(e.target.value)}
                placeholder="Search tracks in this album..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
              {inAlbumSearch && (
                <button
                  onClick={() => setInAlbumSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Sort:</span>
              {(['trackNumber', 'title', 'artist', 'duration', 'bitrate'] as TrackSortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInAlbumSort(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    inAlbumSort === mode
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800'
                  }`}
                >
                  {mode === 'trackNumber' ? '#' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* In-Album Tracks List */}
          <div className="space-y-1.5">
            {currentAlbumTracks.length === 0 ? (
              <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                <Disc className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No tracks found in this album</p>
                {inAlbumSearch && (
                  <button
                    onClick={() => setInAlbumSearch('')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              currentAlbumTracks.map((track, idx) => {
                const isLossless = track.format === 'FLAC' || track.format === 'WAV';
                return (
                  <div
                    key={track.id}
                    className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/5 hover:border-indigo-500/30 transition shadow-sm"
                  >
                    {/* Click track to play */}
                    <div
                      onClick={() => onPlayTrack(track)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Track index */}
                      <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-indigo-400 transition">
                        {track.trackNumber || idx + 1}
                      </span>

                      {/* Cover Thumbnail */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow relative overflow-hidden flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                        }}
                      >
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white drop-shadow opacity-90 group-hover:scale-110 transition" />
                        </div>
                      </div>

                      {/* Track Meta */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                            {track.title}
                          </p>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex-shrink-0 ${
                              isLossless
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/5 text-zinc-400 border-white/10'
                            }`}
                          >
                            {track.format}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                          <span className="truncate">{track.artist}</span>
                          <span>•</span>
                          <span className="text-zinc-500 font-mono">{track.bitrate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side Duration and 3-dots */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                        {formatDuration(track.duration)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTrackMenuId(activeTrackMenuId === track.id ? null : track.id);
                        }}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Track Context Dropdown */}
                    {activeTrackMenuId === track.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-12 z-30 w-56 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                      >
                        <button
                          onClick={() => {
                            onPlayNext(track);
                            setActiveTrackMenuId(null);
                            showToast(`Playing next: ${track.title}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => {
                            onAddToQueue(track);
                            setActiveTrackMenuId(null);
                            showToast(`Added to queue: ${track.title}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            setPlaylistPickerSingleTrack(track);
                            setActiveTrackMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add to Playlist</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenTagEditor(track);
                            setActiveTrackMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Tags className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Edit ID3 Tags</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenAudioTrimmer(track);
                            setActiveTrackMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ringtone Cutter</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenP2PWithTrack(track);
                            setActiveTrackMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Send to Phone (P2P)</span>
                        </button>

                        <div className="my-1 border-t border-white/10" />

                        <button
                          onClick={() => {
                            onDeleteTrack(track.id);
                            setActiveTrackMenuId(null);
                            showToast(`Deleted track: ${track.title}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 text-left transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Track</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: MAIN ALBUMS DIRECTORY (MATCHING USER'S DDMUSIC SCREENSHOT 1)      */
        /* ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* SECTION 1: RECENTLY PLAYED HORIZONTAL CAROUSEL (EXACTLY AS IN SCREENSHOT 1) */}
          {recentlyPlayedAlbums.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-base sm:text-lg font-black text-white px-1">
                Recently played
              </h3>

              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                {recentlyPlayedAlbums.map(({ albumName, tracks: aTracks, topTrack }) => (
                  <div
                    key={`rec-${albumName}`}
                    onClick={() => setSelectedAlbum(albumName)}
                    className="w-32 sm:w-36 flex-shrink-0 group cursor-pointer space-y-2"
                  >
                    {/* Album Art Card */}
                    <div
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl shadow-lg relative overflow-hidden p-0.5 group-hover:scale-103 transition duration-200"
                      style={{
                        background: `linear-gradient(135deg, ${topTrack?.coverGradient?.[0] || '#4338ca'}, ${topTrack?.coverGradient?.[1] || '#6d28d9'})`
                      }}
                    >
                      {topTrack?.coverUrl ? (
                        <img
                          src={topTrack.coverUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-[14px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[14px] flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs">
                          <Disc className="w-12 h-12 text-zinc-400 group-hover:text-white transition" />
                        </div>
                      )}

                      {/* Quick Play overlay button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAlbum(albumName, false);
                        }}
                        className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition transform translate-y-1 group-hover:translate-y-0"
                        title="Play Album"
                      >
                        <Play className="w-4 h-4 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Album Titles */}
                    <div className="min-w-0 px-0.5">
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition truncate">
                        {albumName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {topTrack?.artist || '<unknown>'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: COUNT HEADER & CONTROLS (e.g. "906 albums" + List/Grid toggle + Sort) */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-sm sm:text-base font-black text-white">
              {albumNames.length} albums
            </span>

            <div className="flex items-center gap-1.5">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
                title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
              >
                {viewMode === 'list' ? (
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                ) : (
                  <List className="w-4 h-4 text-indigo-400" />
                )}
              </button>

              {/* Sort Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Sort albums"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-48 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Sort Albums By
                    </div>
                    {[
                      { key: 'name-asc', label: 'Name (A to Z)' },
                      { key: 'name-desc', label: 'Name (Z to A)' },
                      { key: 'count-desc', label: 'Song Count (High to Low)' },
                      { key: 'artist-asc', label: 'Artist Name' },
                      { key: 'year-desc', label: 'Year (Newest)' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setSortMode(item.key as AlbumSortMode);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                          sortMode === item.key
                            ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        {sortMode === item.key && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search in Albums */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search albums or artists..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* SECTION 3: ALBUMS LIST / GRID */}
          {albumNames.length === 0 ? (
            <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Disc className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">No albums found</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW (EXACTLY AS IN SCREENSHOT 1) */
            <div className="space-y-2">
              {albumNames.map((albumName) => {
                const albumTracks = albumsMap.get(albumName) || [];
                const topTrack = albumTracks[0];

                return (
                  <div
                    key={albumName}
                    className="group relative flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-white/5 hover:border-indigo-500/30 transition shadow-sm"
                  >
                    {/* Click to open Album */}
                    <div
                      onClick={() => setSelectedAlbum(albumName)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Album Cover Thumbnail */}
                      <div
                        className="w-13 h-13 rounded-2xl p-0.5 shadow-md flex-shrink-0 group-hover:scale-105 transition overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${topTrack?.coverGradient?.[0] || '#4f46e5'}, ${topTrack?.coverGradient?.[1] || '#7c3aed'})`
                        }}
                      >
                        {topTrack?.coverUrl ? (
                          <img
                            src={topTrack.coverUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-[14px]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full rounded-[14px] bg-zinc-950/40 flex items-center justify-center">
                            <Disc className="w-6 h-6 text-indigo-300" />
                          </div>
                        )}
                      </div>

                      {/* Album Title & Subtitle: "_LOFI_SONGS · 1 song" */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                          {albumName}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                          <span className="text-zinc-300">{topTrack?.artist || albumName}</span>
                          <span className="mx-1.5 text-zinc-600">·</span>
                          <span className="text-zinc-400">{albumTracks.length} {albumTracks.length === 1 ? 'song' : 'songs'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right side 3-dots Menu Button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAlbumMenu(activeAlbumMenu === albumName ? null : albumName);
                        }}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Album options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Album Context Menu Dropdown */}
                    {activeAlbumMenu === albumName && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-14 z-30 w-56 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                      >
                        <button
                          onClick={() => handlePlayAlbum(albumName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          <span>Play Album</span>
                        </button>

                        <button
                          onClick={() => handlePlayAlbum(albumName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Shuffle Album</span>
                        </button>

                        <button
                          onClick={() => handleQueueAlbum(albumName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => handleQueueAlbum(albumName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            setPlaylistPickerTracks(albumTracks);
                            setActiveAlbumMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Album to Playlist</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {albumNames.map((albumName) => {
                const albumTracks = albumsMap.get(albumName) || [];
                const topTrack = albumTracks[0];

                return (
                  <div
                    key={albumName}
                    onClick={() => setSelectedAlbum(albumName)}
                    className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-indigo-500/30 transition shadow-md group cursor-pointer space-y-2.5"
                  >
                    <div
                      className="w-full aspect-square rounded-xl overflow-hidden shadow relative flex items-center justify-center p-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${topTrack?.coverGradient?.[0] || '#4f46e5'}, ${topTrack?.coverGradient?.[1] || '#7c3aed'})`
                      }}
                    >
                      {topTrack?.coverUrl ? (
                        <img
                          src={topTrack.coverUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-[10px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Disc className="w-10 h-10 text-white/80" />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                        {albumName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {topTrack?.artist} • {albumTracks.length} tracks
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlist Selector Modal for Folder/Album tracks */}
      {(playlistPickerTracks || playlistPickerSingleTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-zinc-950 border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {playlistPickerSingleTrack
                ? `Add "${playlistPickerSingleTrack.title}" to Playlist`
                : `Add ${playlistPickerTracks?.length || 0} tracks to Playlist`}
            </h3>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    if (playlistPickerSingleTrack) {
                      onAddToPlaylist(playlistPickerSingleTrack.id, pl.id);
                      showToast(`Added to playlist "${pl.name}"`);
                    } else if (playlistPickerTracks) {
                      playlistPickerTracks.forEach(t => onAddToPlaylist(t.id, pl.id));
                      showToast(`Added ${playlistPickerTracks.length} tracks to "${pl.name}"`);
                    }
                    setPlaylistPickerTracks(null);
                    setPlaylistPickerSingleTrack(null);
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left text-xs font-bold text-white transition flex items-center justify-between cursor-pointer"
                >
                  <span>{pl.name}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">{pl.trackIds.length} tracks</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setPlaylistPickerTracks(null);
                setPlaylistPickerSingleTrack(null);
              }}
              className="w-full py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

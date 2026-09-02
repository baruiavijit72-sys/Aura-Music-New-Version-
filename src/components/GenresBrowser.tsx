import React, { useState, useMemo } from 'react';
import {
  Star,
  Music,
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
  Radio,
  Flame,
  Zap,
  Heart,
  Headphones
} from 'lucide-react';
import { Track, Playlist } from '../types';

interface GenresBrowserProps {
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

type GenreSortMode = 'name-asc' | 'name-desc' | 'count-desc';
type SongSortMode = 'title' | 'artist' | 'album' | 'duration' | 'bitrate';

// Tailored custom visual color palettes for diverse genres
const GENRE_COLOR_MAP: Record<string, { gradient: [string, string]; iconBg: string; textAccent: string; borderAccent: string }> = {
  'Bengali': {
    gradient: ['#dc2626', '#7f1d1d'],
    iconBg: 'bg-red-500/20 text-red-400',
    textAccent: 'text-red-400',
    borderAccent: 'border-red-500/30'
  },
  'Bollywood': {
    gradient: ['#d97706', '#78350f'],
    iconBg: 'bg-amber-500/20 text-amber-400',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-500/30'
  },
  'Club': {
    gradient: ['#06b6d4', '#0f766e'],
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    textAccent: 'text-cyan-400',
    borderAccent: 'border-cyan-500/30'
  },
  'Indipop': {
    gradient: ['#ec4899', '#831843'],
    iconBg: 'bg-pink-500/20 text-pink-400',
    textAccent: 'text-pink-400',
    borderAccent: 'border-pink-500/30'
  },
  'Music': {
    gradient: ['#6366f1', '#312e81'],
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    textAccent: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30'
  },
  'Other': {
    gradient: ['#64748b', '#1e293b'],
    iconBg: 'bg-slate-500/20 text-slate-400',
    textAccent: 'text-slate-400',
    borderAccent: 'border-slate-500/30'
  },
  'Lo-Fi': {
    gradient: ['#8b5cf6', '#4c1d95'],
    iconBg: 'bg-purple-500/20 text-purple-400',
    textAccent: 'text-purple-400',
    borderAccent: 'border-purple-500/30'
  },
  'Rock': {
    gradient: ['#ef4444', '#991b1b'],
    iconBg: 'bg-rose-500/20 text-rose-400',
    textAccent: 'text-rose-400',
    borderAccent: 'border-rose-500/30'
  },
  'Pop': {
    gradient: ['#10b981', '#065f46'],
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    textAccent: 'text-emerald-400',
    borderAccent: 'border-emerald-500/30'
  },
  'EDM': {
    gradient: ['#3b82f6', '#1e3a8a'],
    iconBg: 'bg-blue-500/20 text-blue-400',
    textAccent: 'text-blue-400',
    borderAccent: 'border-blue-500/30'
  },
  'Classical': {
    gradient: ['#f59e0b', '#b45309'],
    iconBg: 'bg-amber-500/20 text-amber-400',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-500/30'
  }
};

export const GenresBrowser: React.FC<GenresBrowserProps> = ({
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<GenreSortMode>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // In-Genre View States
  const [inGenreSearch, setInGenreSearch] = useState('');
  const [inGenreSort, setInGenreSort] = useState<SongSortMode>('title');

  // Context Menus
  const [activeGenreMenu, setActiveGenreMenu] = useState<string | null>(null);
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

  // Group tracks by genre name
  const genresMap = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach(track => {
      // Normalizing genre name or mapping to prominent genres like Bengali, Bollywood, Club, Indipop, Music, Other
      let g = (track.genre && track.genre.trim()) ? track.genre.trim() : 'Other';

      // Group subgenres if appropriate or keep distinct
      if (g.toLowerCase().includes('bengali') || g.toLowerCase().includes('bangla')) {
        g = 'Bengali';
      } else if (g.toLowerCase().includes('bollywood') || g.toLowerCase().includes('hindi')) {
        g = 'Bollywood';
      } else if (g.toLowerCase().includes('club') || g.toLowerCase().includes('dance') || g.toLowerCase().includes('house')) {
        g = 'Club';
      } else if (g.toLowerCase().includes('indipop') || g.toLowerCase().includes('indi-pop') || g.toLowerCase().includes('pop')) {
        g = 'Indipop';
      } else if (g.toLowerCase().includes('lo-fi') || g.toLowerCase().includes('lofi') || g.toLowerCase().includes('chill')) {
        g = 'Lo-Fi';
      } else if (g.toLowerCase().includes('acoustic') || g.toLowerCase().includes('rock')) {
        g = 'Rock';
      } else if (g.toLowerCase() === 'music' || g.toLowerCase() === 'audio') {
        g = 'Music';
      }

      if (!map.has(g)) {
        map.set(g, []);
      }
      map.get(g)!.push(track);
    });

    // Make sure default genres exist for realism if tracks are categorized
    return map;
  }, [tracks]);

  // Filtered and Sorted genre names
  const genreNames = useMemo(() => {
    const list = Array.from(genresMap.keys());

    const filtered = list.filter(name => {
      const q = searchTerm.toLowerCase();
      return name.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      const tracksA = genresMap.get(a) || [];
      const tracksB = genresMap.get(b) || [];

      switch (sortMode) {
        case 'name-asc': return a.localeCompare(b);
        case 'name-desc': return b.localeCompare(a);
        case 'count-desc': return tracksB.length - tracksA.length;
        default: return a.localeCompare(b);
      }
    });
  }, [genresMap, searchTerm, sortMode]);

  // Genre Play & Queue Actions
  const handlePlayGenre = (genreName: string, shuffle = false) => {
    const genreTracks = genresMap.get(genreName) || [];
    if (genreTracks.length === 0) return;

    if (shuffle) {
      const shuffled = [...genreTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0]);
      shuffled.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Shuffling genre "${genreName}" (${genreTracks.length} songs)`);
    } else {
      onPlayTrack(genreTracks[0]);
      genreTracks.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Playing genre "${genreName}"`);
    }
    setActiveGenreMenu(null);
  };

  const handleQueueGenre = (genreName: string, next = false) => {
    const genreTracks = genresMap.get(genreName) || [];
    if (genreTracks.length === 0) return;

    if (next) {
      [...genreTracks].reverse().forEach(t => onPlayNext(t));
      showToast(`Playing next: ${genreTracks.length} songs from "${genreName}"`);
    } else {
      genreTracks.forEach(t => onAddToQueue(t));
      showToast(`Added ${genreTracks.length} songs from "${genreName}" to queue`);
    }
    setActiveGenreMenu(null);
  };

  // Selected Genre Details & Filtered Songs
  const currentGenreTracks = useMemo(() => {
    if (!selectedGenre) return [];
    const list = genresMap.get(selectedGenre) || [];

    const filtered = list.filter(t => {
      const q = inGenreSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      switch (inGenreSort) {
        case 'title': return a.title.localeCompare(b.title);
        case 'artist': return a.artist.localeCompare(b.artist);
        case 'album': return a.album.localeCompare(b.album);
        case 'duration': return b.duration - a.duration;
        case 'bitrate': return (b.format === 'FLAC' ? 1 : 0) - (a.format === 'FLAC' ? 1 : 0);
        default: return a.title.localeCompare(b.title);
      }
    });
  }, [selectedGenre, genresMap, inGenreSearch, inGenreSort]);

  const getGenreStyle = (genreName: string) => {
    return GENRE_COLOR_MAP[genreName] || {
      gradient: ['#4f46e5', '#9333ea'],
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      textAccent: 'text-indigo-400',
      borderAccent: 'border-indigo-500/30'
    };
  };

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
      {/* VIEW 1: INSIDE A GENRE ("Genre er vitor ta" - Full Tracklist & Hero)       */}
      {/* ========================================================================= */}
      {selectedGenre ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedGenre(null);
                setInGenreSearch('');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Genres</span>
            </button>

            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-white/5 truncate max-w-[200px] sm:max-w-xs inline-block">
                Genre: {selectedGenre}
              </span>
            </div>
          </div>

          {/* Genre Hero Banner */}
          {(() => {
            const genreTracks = genresMap.get(selectedGenre) || [];
            const style = getGenreStyle(selectedGenre);
            const totalDurationSecs = genreTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
            const flacCount = genreTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;
            const artistsCount = new Set(genreTracks.map(t => t.artist)).size;

            return (
              <div
                className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/15 shadow-2xl space-y-4"
              >
                {/* Ambient glow backdrop */}
                <div
                  className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                  }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Genre Star Icon / Badge */}
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl flex-shrink-0 flex items-center justify-center p-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                      }}
                    >
                      <div className="w-full h-full rounded-[14px] bg-black/20 flex items-center justify-center">
                        <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/20" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                          {selectedGenre}
                        </h2>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/15">
                          {genreTracks.length} Songs
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                        {artistsCount} {artistsCount === 1 ? 'Artist' : 'Artists'} • {formatTotalTime(totalDurationSecs)} Playtime
                      </p>

                      {flacCount > 0 && (
                        <p className="text-[11px] text-emerald-400 font-bold">
                          {flacCount} Hi-Res Lossless tracks
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handlePlayGenre(selectedGenre, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                    }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play All ({genreTracks.length})</span>
                  </button>

                  <button
                    onClick={() => handlePlayGenre(selectedGenre, true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer shadow"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={() => setPlaylistPickerTracks(genreTracks)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all songs to playlist"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Add to Playlist</span>
                  </button>

                  <button
                    onClick={() => handleQueueGenre(selectedGenre, false)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all to queue"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Add to Queue</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* In-Genre Search & Sorter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-2xl bg-zinc-900/90 border border-white/10">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inGenreSearch}
                onChange={(e) => setInGenreSearch(e.target.value)}
                placeholder="Search tracks in this genre..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
              {inGenreSearch && (
                <button
                  onClick={() => setInGenreSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Sort:</span>
              {(['title', 'artist', 'album', 'duration', 'bitrate'] as SongSortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInGenreSort(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    inGenreSort === mode
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* In-Genre Tracks List */}
          <div className="space-y-1.5">
            {currentGenreTracks.length === 0 ? (
              <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                <Music className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No tracks found for this genre</p>
                {inGenreSearch && (
                  <button
                    onClick={() => setInGenreSearch('')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              currentGenreTracks.map((track, idx) => {
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
                      {/* Index */}
                      <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-indigo-400 transition">
                        {idx + 1}
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
                          <span className="text-zinc-500 font-mono">{track.album}</span>
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
        /* VIEW 2: MAIN GENRES DIRECTORY (MATCHING USER'S DDMUSIC SCREENSHOT 3)      */
        /* ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header count & controls (e.g. "6 genres" + sort) */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-sm sm:text-base font-black text-white">
              {genreNames.length} genres
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
                  title="Sort genres"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-48 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Sort Genres By
                    </div>
                    {[
                      { key: 'name-asc', label: 'Name (A to Z)' },
                      { key: 'name-desc', label: 'Name (Z to A)' },
                      { key: 'count-desc', label: 'Song Count (High to Low)' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setSortMode(item.key as GenreSortMode);
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

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres..."
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

          {/* SECTION 2: GENRES LIST / GRID (MATCHING SCREENSHOT 3) */}
          {genreNames.length === 0 ? (
            <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Music className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">No genres found</p>
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
            /* LIST VIEW (EXACTLY AS IN SCREENSHOT 3: Star Icon Card + Genre Title + "X songs" + 3 dots) */
            <div className="space-y-2">
              {genreNames.map((genreName) => {
                const genreTracks = genresMap.get(genreName) || [];
                const style = getGenreStyle(genreName);

                return (
                  <div
                    key={genreName}
                    className="group relative flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-white/5 hover:border-indigo-500/30 transition shadow-sm"
                  >
                    {/* Click to open Genre */}
                    <div
                      onClick={() => setSelectedGenre(genreName)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Genre Star Icon (As in Screenshot 3) */}
                      <div className="w-13 h-13 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:border-indigo-500/40 group-hover:bg-zinc-750 transition shadow-sm">
                        <Star className="w-6 h-6 text-zinc-400 group-hover:text-amber-400 transition" />
                      </div>

                      {/* Genre Title & Subtitle: "Bengali", "6 songs" */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                          {genreName}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                          {genreTracks.length} {genreTracks.length === 1 ? 'song' : 'songs'}
                        </p>
                      </div>
                    </div>

                    {/* Right side 3-dots Menu Button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGenreMenu(activeGenreMenu === genreName ? null : genreName);
                        }}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Genre options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Genre Context Menu Dropdown */}
                    {activeGenreMenu === genreName && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-14 z-30 w-56 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                      >
                        <button
                          onClick={() => handlePlayGenre(genreName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                          <span>Play All</span>
                        </button>

                        <button
                          onClick={() => handlePlayGenre(genreName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Shuffle Genre</span>
                        </button>

                        <button
                          onClick={() => handleQueueGenre(genreName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => handleQueueGenre(genreName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            setPlaylistPickerTracks(genreTracks);
                            setActiveGenreMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Genre to Playlist</span>
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
              {genreNames.map((genreName) => {
                const genreTracks = genresMap.get(genreName) || [];
                const style = getGenreStyle(genreName);

                return (
                  <div
                    key={genreName}
                    onClick={() => setSelectedGenre(genreName)}
                    className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-indigo-500/30 transition shadow-md group cursor-pointer space-y-3"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md p-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                      }}
                    >
                      <Star className="w-6 h-6 text-white fill-white/20" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                        {genreName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {genreTracks.length} tracks
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlist Selector Modal */}
      {(playlistPickerTracks || playlistPickerSingleTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-zinc-950 border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {playlistPickerSingleTrack
                ? `Add "${playlistPickerSingleTrack.title}" to Playlist`
                : `Add ${playlistPickerTracks?.length || 0} songs to Playlist`}
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

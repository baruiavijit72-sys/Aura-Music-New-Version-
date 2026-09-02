import React, { useState, useMemo } from 'react';
import {
  Mic2,
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
  Disc,
  User,
  Music,
  Layers
} from 'lucide-react';
import { Track, Playlist } from '../types';

interface ArtistsBrowserProps {
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
  onSelectAlbum?: (albumName: string) => void;
}

type ArtistSortMode = 'name-asc' | 'name-desc' | 'count-desc' | 'albums-desc';
type SongSortMode = 'popular' | 'title' | 'album' | 'duration' | 'bitrate';

export const ArtistsBrowser: React.FC<ArtistsBrowserProps> = ({
  tracks,
  playlists,
  onPlayTrack,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onOpenTagEditor,
  onOpenAudioTrimmer,
  onOpenP2PWithTrack,
  onDeleteTrack,
  onSelectAlbum
}) => {
  // Navigation
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<ArtistSortMode>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // In-Artist View States
  const [inArtistSearch, setInArtistSearch] = useState('');
  const [inArtistSort, setInArtistSort] = useState<SongSortMode>('popular');

  // Context Menus
  const [activeArtistMenu, setActiveArtistMenu] = useState<string | null>(null);
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
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Group tracks by artist name
  const artistsMap = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach(track => {
      const art = (track.artist && track.artist.trim()) ? track.artist.trim() : '<unknown>';
      if (!map.has(art)) {
        map.set(art, []);
      }
      map.get(art)!.push(track);
    });
    return map;
  }, [tracks]);

  // Recently played artists
  const recentlyPlayedArtists = useMemo(() => {
    const list: { artistName: string; tracks: Track[]; lastPlayed: number; topTrack: Track }[] = [];
    artistsMap.forEach((artistTracks, artistName) => {
      const maxLastPlayed = Math.max(...artistTracks.map(t => t.lastPlayed || 0), 0);
      const topTrack = [...artistTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0] || artistTracks[0];
      list.push({
        artistName,
        tracks: artistTracks,
        lastPlayed: maxLastPlayed || topTrack.playCount * 1000,
        topTrack
      });
    });

    return list
      .sort((a, b) => b.lastPlayed - a.lastPlayed)
      .slice(0, 10);
  }, [artistsMap]);

  // Filtered and Sorted artist list
  const artistNames = useMemo(() => {
    const list = Array.from(artistsMap.keys());

    const filtered = list.filter(name => {
      const q = searchTerm.toLowerCase();
      return name.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      const tracksA = artistsMap.get(a) || [];
      const tracksB = artistsMap.get(b) || [];
      const albumsCountA = new Set(tracksA.map(t => t.album)).size;
      const albumsCountB = new Set(tracksB.map(t => t.album)).size;

      switch (sortMode) {
        case 'name-asc': return a.localeCompare(b);
        case 'name-desc': return b.localeCompare(a);
        case 'count-desc': return tracksB.length - tracksA.length;
        case 'albums-desc': return albumsCountB - albumsCountA;
        default: return a.localeCompare(b);
      }
    });
  }, [artistsMap, searchTerm, sortMode]);

  // Artist Play & Queue Actions
  const handlePlayArtist = (artistName: string, shuffle = false) => {
    const artistTracks = artistsMap.get(artistName) || [];
    if (artistTracks.length === 0) return;

    if (shuffle) {
      const shuffled = [...artistTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0]);
      shuffled.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Shuffling artist "${artistName}" (${artistTracks.length} songs)`);
    } else {
      onPlayTrack(artistTracks[0]);
      artistTracks.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Playing artist "${artistName}"`);
    }
    setActiveArtistMenu(null);
  };

  const handleQueueArtist = (artistName: string, next = false) => {
    const artistTracks = artistsMap.get(artistName) || [];
    if (artistTracks.length === 0) return;

    if (next) {
      [...artistTracks].reverse().forEach(t => onPlayNext(t));
      showToast(`Playing next: ${artistTracks.length} songs by "${artistName}"`);
    } else {
      artistTracks.forEach(t => onAddToQueue(t));
      showToast(`Added ${artistTracks.length} songs by "${artistName}" to queue`);
    }
    setActiveArtistMenu(null);
  };

  // Selected Artist Details & Filtered Songs
  const currentArtistTracks = useMemo(() => {
    if (!selectedArtist) return [];
    const list = artistsMap.get(selectedArtist) || [];

    const filtered = list.filter(t => {
      const q = inArtistSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      switch (inArtistSort) {
        case 'popular': return (b.playCount || 0) - (a.playCount || 0);
        case 'title': return a.title.localeCompare(b.title);
        case 'album': return a.album.localeCompare(b.album);
        case 'duration': return b.duration - a.duration;
        case 'bitrate': return (b.format === 'FLAC' ? 1 : 0) - (a.format === 'FLAC' ? 1 : 0);
        default: return (b.playCount || 0) - (a.playCount || 0);
      }
    });
  }, [selectedArtist, artistsMap, inArtistSearch, inArtistSort]);

  // Selected Artist Albums
  const currentArtistAlbums = useMemo(() => {
    if (!selectedArtist) return [];
    const list = artistsMap.get(selectedArtist) || [];
    const map = new Map<string, Track[]>();

    list.forEach(t => {
      const alb = t.album || 'Single / Unknown Album';
      if (!map.has(alb)) map.set(alb, []);
      map.get(alb)!.push(t);
    });

    return Array.from(map.entries()).map(([albumName, albTracks]) => ({
      albumName,
      tracks: albTracks,
      firstTrack: albTracks[0],
      year: Math.max(...albTracks.map(t => t.year || 0), 0)
    }));
  }, [selectedArtist, artistsMap]);

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
      {/* VIEW 1: INSIDE AN ARTIST ("Artist er vitor ta" - Full Discography & Tracks) */}
      {/* ========================================================================= */}
      {selectedArtist ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedArtist(null);
                setInArtistSearch('');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Artists</span>
            </button>

            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-white/5 truncate max-w-[200px] sm:max-w-xs inline-block">
                Artist: {selectedArtist}
              </span>
            </div>
          </div>

          {/* Artist Hero Header Banner */}
          {(() => {
            const artistTracks = artistsMap.get(selectedArtist) || [];
            const first = artistTracks[0] || tracks[0];
            const totalDurationSecs = artistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
            const totalBytes = artistTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
            const albumsCount = new Set(artistTracks.map(t => t.album)).size;
            const genres = Array.from(new Set(artistTracks.map(t => t.genre).filter(Boolean)));
            const flacCount = artistTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;

            return (
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-950/60 via-zinc-900 to-zinc-950 border border-purple-500/30 shadow-2xl space-y-4">
                {/* Ambient backdrop glow */}
                <div
                  className="absolute -right-12 -top-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#9333ea'}, ${first?.coverGradient?.[1] || '#4f46e5'})`
                  }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Artist Circular Avatar */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 shadow-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#9333ea'}, ${first?.coverGradient?.[1] || '#3b82f6'})`
                      }}
                    >
                      {first?.coverUrl ? (
                        <img
                          src={first.coverUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                          <Mic2 className="w-10 h-10 text-purple-300 drop-shadow" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                          {selectedArtist}
                        </h2>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {artistTracks.length} Songs
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                        {albumsCount} {albumsCount === 1 ? 'Album' : 'Albums'} in library
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400 font-medium">
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

                  {/* Top Genres */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {genres.map(g => (
                      <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-800/90 text-purple-300 border border-purple-500/20 shadow-sm">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handlePlayArtist(selectedArtist, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg hover:shadow-purple-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play All ({artistTracks.length})</span>
                  </button>

                  <button
                    onClick={() => handlePlayArtist(selectedArtist, true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer shadow"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={() => setPlaylistPickerTracks(artistTracks)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all artist tracks to playlist"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Add to Playlist</span>
                  </button>

                  <button
                    onClick={() => handleQueueArtist(selectedArtist, false)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all to queue"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Add to Queue</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Section: Artist's Discography / Albums */}
          {currentArtistAlbums.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <h3 className="text-sm font-extrabold text-white px-1 flex items-center gap-2">
                <Disc className="w-4 h-4 text-purple-400" />
                <span>Albums ({currentArtistAlbums.length})</span>
              </h3>

              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {currentArtistAlbums.map(({ albumName, tracks: aTracks, firstTrack, year }) => (
                  <div
                    key={albumName}
                    onClick={() => {
                      if (onSelectAlbum) {
                        onSelectAlbum(albumName);
                      } else {
                        onPlayTrack(firstTrack);
                      }
                    }}
                    className="w-32 sm:w-36 flex-shrink-0 group cursor-pointer space-y-1.5 p-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-purple-500/30 transition shadow-sm"
                  >
                    <div
                      className="w-full aspect-square rounded-xl overflow-hidden shadow relative flex items-center justify-center p-0.5"
                      style={{
                        background: `linear-gradient(135deg, ${firstTrack?.coverGradient?.[0] || '#9333ea'}, ${firstTrack?.coverGradient?.[1] || '#4f46e5'})`
                      }}
                    >
                      {firstTrack?.coverUrl ? (
                        <img
                          src={firstTrack.coverUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-[10px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Disc className="w-10 h-10 text-white/80" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {albumName}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {aTracks.length} {aTracks.length === 1 ? 'track' : 'tracks'} {year > 0 ? `• ${year}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Songs by this Artist (Search & Sorter) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-2xl bg-zinc-900/90 border border-white/10">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inArtistSearch}
                  onChange={(e) => setInArtistSearch(e.target.value)}
                  placeholder="Search artist songs..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
                />
                {inArtistSearch && (
                  <button
                    onClick={() => setInArtistSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Sort:</span>
                {(['popular', 'title', 'album', 'duration', 'bitrate'] as SongSortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInArtistSort(mode)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      inArtistSort === mode
                        ? 'bg-purple-600 text-white font-extrabold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Artist Tracks List */}
            <div className="space-y-1.5">
              {currentArtistTracks.length === 0 ? (
                <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                  <Mic2 className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No songs found for this artist</p>
                  {inArtistSearch && (
                    <button
                      onClick={() => setInArtistSearch('')}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                currentArtistTracks.map((track, idx) => {
                  const isLossless = track.format === 'FLAC' || track.format === 'WAV';
                  return (
                    <div
                      key={track.id}
                      className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/5 hover:border-purple-500/30 transition shadow-sm"
                    >
                      {/* Click track to play */}
                      <div
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                      >
                        {/* Index */}
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-purple-400 transition">
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
                            <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
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
                            <span className="truncate">{track.album}</span>
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
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: MAIN ARTISTS DIRECTORY (MATCHING USER'S DDMUSIC SCREENSHOT 2)     */
        /* ========================================================================= */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* SECTION 1: RECENTLY PLAYED HORIZONTAL CAROUSEL (AS IN SCREENSHOT 2) */}
          {recentlyPlayedArtists.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-base sm:text-lg font-black text-white px-1">
                Recently played
              </h3>

              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                {recentlyPlayedArtists.map(({ artistName, tracks: aTracks, topTrack }) => (
                  <div
                    key={`rec-art-${artistName}`}
                    onClick={() => setSelectedArtist(artistName)}
                    className="w-28 sm:w-32 flex-shrink-0 group cursor-pointer space-y-2 flex flex-col items-center text-center"
                  >
                    {/* Artist Avatar / Rounded Icon Card */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-800/90 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-lg group-hover:scale-105 group-hover:border-purple-500/40 transition">
                      {topTrack?.coverUrl ? (
                        <img
                          src={topTrack.coverUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-[22px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-zinc-700/60 flex items-center justify-center">
                          <Mic2 className="w-7 h-7 text-zinc-300 group-hover:text-purple-300 transition" />
                        </div>
                      )}

                      {/* Quick Play Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayArtist(artistName, false);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition transform translate-y-1 group-hover:translate-y-0"
                        title="Play Artist"
                      >
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>
                    </div>

                    {/* Artist Title */}
                    <div className="w-full px-1">
                      <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition truncate">
                        {artistName}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: COUNT HEADER & CONTROLS (e.g. "807 artists" + View Toggle + Sort) */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-sm sm:text-base font-black text-white">
              {artistNames.length} artists
            </span>

            <div className="flex items-center gap-1.5">
              {/* View Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
                title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
              >
                {viewMode === 'list' ? (
                  <LayoutGrid className="w-4 h-4 text-purple-400" />
                ) : (
                  <List className="w-4 h-4 text-purple-400" />
                )}
              </button>

              {/* Sort Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Sort artists"
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                </button>

                {showSortDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-48 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Sort Artists By
                    </div>
                    {[
                      { key: 'name-asc', label: 'Name (A to Z)' },
                      { key: 'name-desc', label: 'Name (Z to A)' },
                      { key: 'count-desc', label: 'Song Count (High to Low)' },
                      { key: 'albums-desc', label: 'Album Count' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setSortMode(item.key as ArtistSortMode);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                          sortMode === item.key
                            ? 'bg-purple-500/20 text-purple-300 font-bold'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        {sortMode === item.key && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artists..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 shadow-inner"
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

          {/* SECTION 3: ARTISTS LIST / GRID (MATCHING SCREENSHOT 2) */}
          {artistNames.length === 0 ? (
            <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Mic2 className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">No artists found</p>
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
            /* LIST VIEW (EXACTLY AS IN SCREENSHOT 2: Rounded Microphone Icon + Title + "X album · Y song" + 3 dots) */
            <div className="space-y-2">
              {artistNames.map((artistName) => {
                const artistTracks = artistsMap.get(artistName) || [];
                const albumsCount = new Set(artistTracks.map(t => t.album)).size;
                const songsCount = artistTracks.length;

                return (
                  <div
                    key={artistName}
                    className="group relative flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-white/5 hover:border-purple-500/30 transition shadow-sm"
                  >
                    {/* Click to open Artist Profile */}
                    <div
                      onClick={() => setSelectedArtist(artistName)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Artist Microphone Glyph Container (As in Screenshot 2) */}
                      <div className="w-13 h-13 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:border-purple-500/40 group-hover:bg-zinc-750 transition shadow-sm">
                        <Mic2 className="w-6 h-6 text-zinc-400 group-hover:text-purple-300 transition" />
                      </div>

                      {/* Artist Title & Subtitle: "1 album · 1 song" */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition truncate">
                          {artistName}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                          <span>{albumsCount} {albumsCount === 1 ? 'album' : 'albums'}</span>
                          <span className="mx-1.5 text-zinc-600">·</span>
                          <span>{songsCount} {songsCount === 1 ? 'song' : 'songs'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right side 3-dots Menu Button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveArtistMenu(activeArtistMenu === artistName ? null : artistName);
                        }}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Artist options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Artist Context Menu Dropdown */}
                    {activeArtistMenu === artistName && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-14 z-30 w-56 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                      >
                        <button
                          onClick={() => handlePlayArtist(artistName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                          <span>Play All Songs</span>
                        </button>

                        <button
                          onClick={() => handlePlayArtist(artistName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Shuffle Artist</span>
                        </button>

                        <button
                          onClick={() => handleQueueArtist(artistName, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => handleQueueArtist(artistName, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            setPlaylistPickerTracks(artistTracks);
                            setActiveArtistMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add All to Playlist</span>
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
              {artistNames.map((artistName) => {
                const artistTracks = artistsMap.get(artistName) || [];
                const albumsCount = new Set(artistTracks.map(t => t.album)).size;

                return (
                  <div
                    key={artistName}
                    onClick={() => setSelectedArtist(artistName)}
                    className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-purple-500/30 transition shadow-md group cursor-pointer flex flex-col items-center text-center space-y-2.5"
                  >
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-zinc-750 transition">
                      <Mic2 className="w-8 h-8 text-zinc-400 group-hover:text-purple-300 transition" />
                    </div>

                    <div className="w-full min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {artistName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {albumsCount} albums • {artistTracks.length} songs
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlist Selector Modal for Artist Tracks */}
      {(playlistPickerTracks || playlistPickerSingleTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-zinc-950 border border-purple-500/30 shadow-2xl space-y-4">
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

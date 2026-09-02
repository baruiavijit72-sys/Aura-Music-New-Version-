import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  ListMusic, 
  Heart, 
  Flame, 
  Clock, 
  History,
  Play, 
  Shuffle, 
  Trash2, 
  Copy, 
  MoreVertical,
  ChevronRight,
  Music,
  ArrowLeft,
  Search,
  Download,
  Share2,
  Edit3,
  ListPlus,
  Sparkles,
  Check,
  X,
  FileText,
  Upload,
  Tags,
  Scissors,
  Smartphone
} from 'lucide-react';
import { Playlist, Track } from '../types';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onOpenCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  onTogglePinPlaylist?: (id: string) => void;
  onDuplicatePlaylist: (playlist: Playlist) => void;
  activePlaylist: Playlist | null;
  setActivePlaylist: (playlist: Playlist | null) => void;
  onUpdatePlaylist?: (updatedPlaylist: Playlist) => void;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
  onOpenTagEditor?: (track: Track) => void;
  onOpenAudioTrimmer?: (track: Track) => void;
  onOpenP2PWithTrack?: (track: Track) => void;
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
  onUpdatePlaylist,
  onAddToQueue,
  onPlayNext,
  onOpenTagEditor,
  onOpenAudioTrimmer,
  onOpenP2PWithTrack
}) => {
  // State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeTrackMenuId, setActiveTrackMenuId] = useState<string | null>(null);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [isAddSongsModalOpen, setIsAddSongsModalOpen] = useState(false);
  const [addSongsSearchQuery, setAddSongsSearchQuery] = useState('');
  const [selectedTrackIdsToAdd, setSelectedTrackIdsToAdd] = useState<string[]>([]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [playlistSortBy, setPlaylistSortBy] = useState<'custom' | 'name' | 'count'>('custom');

  const m3uFileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic calculation for the 4 Smart System Playlists from tracks library
  const favoriteTracks = useMemo(() => {
    return tracks.filter(t => t.isFavorite);
  }, [tracks]);

  const lastAddedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
  }, [tracks]);

  const recentlyPlayedTracks = useMemo(() => {
    return tracks
      .filter(t => (t.lastPlayed || 0) > 0 || (t.playCount || 0) > 0)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
  }, [tracks]);

  const mostPlayedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  }, [tracks]);

  // System Smart Playlists representations
  const systemPlaylists = useMemo(() => {
    return [
      {
        id: 'smart-fav',
        name: 'My favourite',
        description: 'Most loved & starred lossless songs',
        trackCount: favoriteTracks.length,
        tracks: favoriteTracks,
        gradient: 'from-[#e11d48] via-[#db2777] to-[#9d174d]',
        solidGradient: ['#e11d48', '#831843'] as [string, string],
        icon: Heart,
        topCoverUrl: favoriteTracks[0]?.coverUrl,
        topCoverGradient: favoriteTracks[0]?.coverGradient || ['#e11d48', '#831843']
      },
      {
        id: 'smart-last-added',
        name: 'Last added',
        description: 'Recently imported and scanned audio tracks',
        trackCount: lastAddedTracks.length,
        tracks: lastAddedTracks,
        gradient: 'from-[#0d9488] via-[#0f766e] to-[#047857]',
        solidGradient: ['#0d9488', '#047857'] as [string, string],
        icon: Clock,
        topCoverUrl: lastAddedTracks[0]?.coverUrl,
        topCoverGradient: lastAddedTracks[0]?.coverGradient || ['#0d9488', '#047857']
      },
      {
        id: 'smart-recently-played',
        name: 'Recently played',
        description: 'Audio tracks played in your listening sessions',
        trackCount: recentlyPlayedTracks.length,
        tracks: recentlyPlayedTracks,
        gradient: 'from-[#4338ca] via-[#3730a3] to-[#312e81]',
        solidGradient: ['#4338ca', '#312e81'] as [string, string],
        icon: History,
        topCoverUrl: recentlyPlayedTracks[0]?.coverUrl,
        topCoverGradient: recentlyPlayedTracks[0]?.coverGradient || ['#4338ca', '#312e81']
      },
      {
        id: 'smart-most-played',
        name: 'Most played',
        description: 'Your top heavy-rotation & repeat tracks',
        trackCount: mostPlayedTracks.length,
        tracks: mostPlayedTracks,
        gradient: 'from-[#ea580c] via-[#c2410c] to-[#9a3412]',
        solidGradient: ['#ea580c', '#7c2d12'] as [string, string],
        icon: Flame,
        topCoverUrl: mostPlayedTracks[0]?.coverUrl,
        topCoverGradient: mostPlayedTracks[0]?.coverGradient || ['#ea580c', '#7c2d12']
      }
    ];
  }, [favoriteTracks, lastAddedTracks, recentlyPlayedTracks, mostPlayedTracks]);

  // Filter user/custom playlists
  const customPlaylists = useMemo(() => {
    // Exclude redundant dummy smart items from custom section
    const list = playlists.filter(p => !p.id.startsWith('smart-') && p.id !== 'pl-fav');
    
    if (playlistSortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (playlistSortBy === 'count') {
      return [...list].sort((a, b) => b.trackIds.length - a.trackIds.length);
    }
    return list;
  }, [playlists, playlistSortBy]);

  const totalPlaylistsCount = 4 + customPlaylists.length;

  // Handle Play All in playlist
  const handlePlayPlaylistAll = (targetTracks: Track[], shuffle: boolean) => {
    if (targetTracks.length === 0) return;
    const finalTracks = shuffle ? [...targetTracks].sort(() => Math.random() - 0.5) : targetTracks;
    onPlayTrack(finalTracks[0]);
    if (onAddToQueue) {
      for (let i = 1; i < finalTracks.length; i++) {
        onAddToQueue(finalTracks[i]);
      }
    }
  };

  // Open a smart playlist into full detail view
  const handleOpenSmartPlaylist = (smartItem: typeof systemPlaylists[0]) => {
    const plObj: Playlist = {
      id: smartItem.id,
      name: smartItem.name,
      description: smartItem.description,
      isSmart: true,
      trackIds: smartItem.tracks.map(t => t.id),
      createdAt: Date.now(),
      coverGradient: smartItem.solidGradient
    };
    setActivePlaylist(plObj);
  };

  // Export Playlist to M3U File
  const handleExportM3U = (playlist: Playlist, playlistTracks: Track[]) => {
    let m3uContent = '#EXTM3U\n';
    m3uContent += `#PLAYLIST:${playlist.name}\n\n`;
    playlistTracks.forEach(t => {
      m3uContent += `#EXTINF:${t.duration},${t.artist} - ${t.title}\n`;
      m3uContent += `${t.folderPath || '/Music'}/${t.title}.${t.format.toLowerCase()}\n\n`;
    });

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import M3U File
  const handleImportM3UFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      let playlistName = file.name.replace(/\.m3u8?$/i, '');
      const matchedTrackIds: string[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#PLAYLIST:')) {
          playlistName = trimmed.replace('#PLAYLIST:', '').trim();
        } else if (trimmed && !trimmed.startsWith('#')) {
          // match track by title
          const songName = trimmed.split('/').pop()?.replace(/\.[^/.]+$/, '').toLowerCase();
          if (songName) {
            const found = tracks.find(t => t.title.toLowerCase().includes(songName) || songName.includes(t.title.toLowerCase()));
            if (found && !matchedTrackIds.includes(found.id)) {
              matchedTrackIds.push(found.id);
            }
          }
        }
      });

      // If matches found or create playlist
      const newPl: Playlist = {
        id: `pl-imported-${Date.now()}`,
        name: playlistName,
        description: `Imported from ${file.name}`,
        isSmart: false,
        trackIds: matchedTrackIds.length > 0 ? matchedTrackIds : (tracks[0] ? [tracks[0].id] : []),
        createdAt: Date.now(),
        coverGradient: ['#3b82f6', '#1d4ed8']
      };

      if (onUpdatePlaylist) {
        onUpdatePlaylist(newPl);
      }
    };
    reader.readAsText(file);
  };

  // Remove track from active custom playlist
  const handleRemoveTrackFromPlaylist = (trackId: string) => {
    if (!activePlaylist || activePlaylist.isSmart || !onUpdatePlaylist) return;
    const updated: Playlist = {
      ...activePlaylist,
      trackIds: activePlaylist.trackIds.filter(id => id !== trackId)
    };
    onUpdatePlaylist(updated);
    setActivePlaylist(updated);
  };

  // Add tracks to active custom playlist
  const handleConfirmAddTracks = () => {
    if (!activePlaylist || activePlaylist.isSmart || !onUpdatePlaylist) return;
    const existingSet = new Set(activePlaylist.trackIds);
    selectedTrackIdsToAdd.forEach(id => existingSet.add(id));

    const updated: Playlist = {
      ...activePlaylist,
      trackIds: Array.from(existingSet)
    };
    onUpdatePlaylist(updated);
    setActivePlaylist(updated);
    setIsAddSongsModalOpen(false);
    setSelectedTrackIdsToAdd([]);
  };

  // Rename active playlist
  const handleConfirmRename = () => {
    if (!activePlaylist || !renameValue.trim() || !onUpdatePlaylist) return;
    const updated: Playlist = {
      ...activePlaylist,
      name: renameValue.trim()
    };
    onUpdatePlaylist(updated);
    setActivePlaylist(updated);
    setIsRenameModalOpen(false);
  };

  // =========================================================================
  // VIEW: PLAYLIST DETAIL PAGE (WHEN A PLAYLIST IS SELECTED)
  // =========================================================================
  if (activePlaylist) {
    // Resolve tracks in this playlist
    let playlistTracks: Track[] = [];
    if (activePlaylist.id === 'smart-fav') {
      playlistTracks = favoriteTracks;
    } else if (activePlaylist.id === 'smart-last-added') {
      playlistTracks = lastAddedTracks;
    } else if (activePlaylist.id === 'smart-recently-played') {
      playlistTracks = recentlyPlayedTracks;
    } else if (activePlaylist.id === 'smart-most-played') {
      playlistTracks = mostPlayedTracks;
    } else {
      playlistTracks = activePlaylist.trackIds
        .map(id => tracks.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
    }

    // Filter by search inside playlist
    const filteredTracks = playlistTracks.filter(t => {
      if (!playlistSearchQuery.trim()) return true;
      const q = playlistSearchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    });

    const totalSeconds = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);

    const primaryCoverUrl = playlistTracks[0]?.coverUrl;
    const gradientColors = activePlaylist.coverGradient || ['#6366f1', '#a855f7'];

    return (
      <div className="space-y-4 pb-28 animate-in fade-in duration-200 select-none">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActivePlaylist(null);
              setPlaylistSearchQuery('');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Back to Playlists</span>
          </button>

          <span className="text-[11px] font-mono text-zinc-400">
            {playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}
          </span>
        </div>

        {/* Hero Header Card with Rich Gradient Artwork & Actions */}
        <div 
          className="relative overflow-hidden p-5 sm:p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4"
          style={{
            background: `linear-gradient(135deg, ${gradientColors[0]}44, #121824 70%)`
          }}
        >
          {/* Ambient Glow */}
          <div 
            className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: gradientColors[0] }}
          />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Big Artwork with Play Overlay */}
            <div 
              onClick={() => handlePlayPlaylistAll(playlistTracks, false)}
              className="group relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center text-white shadow-2xl flex-shrink-0 overflow-hidden cursor-pointer border border-white/20"
              style={{
                background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`
              }}
            >
              {primaryCoverUrl ? (
                <img
                  src={primaryCoverUrl}
                  alt={activePlaylist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Music className="w-14 h-14 text-white/90 group-hover:scale-110 transition-transform" />
              )}
              {/* Hover Play Button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                <div className="w-12 h-12 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Playlist Meta */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  activePlaylist.isSmart 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  {activePlaylist.isSmart ? '⚡ AUTO SMART PLAYLIST' : '🎵 CUSTOM PLAYLIST'}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {totalMinutes} mins total
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Syne',sans-serif] truncate">
                  {activePlaylist.name}
                </h2>
                {!activePlaylist.isSmart && (
                  <button
                    onClick={() => {
                      setRenameValue(activePlaylist.name);
                      setIsRenameModalOpen(true);
                    }}
                    title="Rename Playlist"
                    className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-300 line-clamp-2 max-w-xl">
                {activePlaylist.description || 'Curated music playlist on AURA MUSIC'}
              </p>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <button
                  onClick={() => handlePlayPlaylistAll(playlistTracks, false)}
                  disabled={playlistTracks.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs shadow-lg shadow-cyan-400/25 transition disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play All</span>
                </button>

                <button
                  onClick={() => handlePlayPlaylistAll(playlistTracks, true)}
                  disabled={playlistTracks.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs border border-white/15 transition disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Shuffle</span>
                </button>

                {!activePlaylist.isSmart && (
                  <button
                    onClick={() => setIsAddSongsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-bold text-xs transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Songs</span>
                  </button>
                )}

                <button
                  onClick={() => handleExportM3U(activePlaylist, playlistTracks)}
                  disabled={playlistTracks.length === 0}
                  title="Export to .M3U Playlist File"
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* In-Playlist Search and Filters */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={playlistSearchQuery}
            onChange={(e) => setPlaylistSearchQuery(e.target.value)}
            placeholder={`Search within ${activePlaylist.name}...`}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-900/70 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
          {playlistSearchQuery && (
            <button
              onClick={() => setPlaylistSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tracks List inside the Playlist */}
        <div className="space-y-1.5">
          {filteredTracks.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Music className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">
                {playlistSearchQuery 
                  ? 'No matching songs found in this playlist' 
                  : 'This playlist has no songs yet.'}
              </p>
              {!activePlaylist.isSmart && !playlistSearchQuery && (
                <button
                  onClick={() => setIsAddSongsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition cursor-pointer shadow-md"
                >
                  + Add Songs from Library
                </button>
              )}
            </div>
          ) : (
            filteredTracks.map((track, idx) => (
              <div
                key={track.id}
                className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-white/5 hover:border-cyan-500/30 transition duration-200 shadow-sm backdrop-blur-sm"
              >
                {/* Track Left Info */}
                <div
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                >
                  <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-cyan-400 font-bold">
                    {idx + 1}
                  </span>

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200 border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-white/80" />
                    )}
                    {/* Hover Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                      <Play className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors font-['Syne',sans-serif]">
                        {track.title}
                      </p>
                      {track.bitrate?.includes('Lossless') || track.bitrate?.includes('32-Bit') ? (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                          HI-RES
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                      {track.artist} <span className="text-zinc-600">•</span> {track.album}
                    </p>
                  </div>
                </div>

                {/* Right Metadata & Track Menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5">
                    {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                  </span>

                  <button
                    onClick={() => setActiveTrackMenuId(activeTrackMenuId === track.id ? null : track.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Track Context Menu Dropdown */}
                {activeTrackMenuId === track.id && (
                  <div className="absolute right-4 top-12 z-20 w-52 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                    <button
                      onClick={() => {
                        if (onPlayNext) onPlayNext(track);
                        setActiveTrackMenuId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Play Next</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onAddToQueue) onAddToQueue(track);
                        setActiveTrackMenuId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" />
                      <span>Add to Queue</span>
                    </button>

                    {onOpenTagEditor && (
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
                    )}

                    {onOpenAudioTrimmer && (
                      <button
                        onClick={() => {
                          onOpenAudioTrimmer(track);
                          setActiveTrackMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ringtone Cutter</span>
                      </button>
                    )}

                    {onOpenP2PWithTrack && (
                      <button
                        onClick={() => {
                          onOpenP2PWithTrack(track);
                          setActiveTrackMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send to Phone (PIN / QR)</span>
                      </button>
                    )}

                    {!activePlaylist.isSmart && (
                      <>
                        <div className="h-px bg-white/10 my-1" />
                        <button
                          onClick={() => {
                            handleRemoveTrackFromPlaylist(track.id);
                            setActiveTrackMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 text-left transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove from Playlist</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal: Add Songs from Library to this Playlist */}
        {isAddSongsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md bg-black/80">
            <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white">Add Songs to "{activePlaylist.name}"</h3>
                  <p className="text-[11px] text-zinc-400">Select tracks from your library</p>
                </div>
                <button
                  onClick={() => setIsAddSongsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search input in modal */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={addSongsSearchQuery}
                    onChange={(e) => setAddSongsSearchQuery(e.target.value)}
                    placeholder="Search library songs..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Selectable Song List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {tracks
                  .filter(t => {
                    if (!addSongsSearchQuery.trim()) return true;
                    const q = addSongsSearchQuery.toLowerCase();
                    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
                  })
                  .map(t => {
                    const isAlreadyIn = activePlaylist.trackIds.includes(t.id);
                    const isSelected = selectedTrackIdsToAdd.includes(t.id);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isAlreadyIn) return;
                          if (isSelected) {
                            setSelectedTrackIdsToAdd(prev => prev.filter(id => id !== t.id));
                          } else {
                            setSelectedTrackIdsToAdd(prev => [...prev, t.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer ${
                          isAlreadyIn
                            ? 'opacity-50 bg-zinc-900/30'
                            : isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-white'
                            : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
                            isAlreadyIn
                              ? 'bg-zinc-700 border-zinc-600 text-zinc-400'
                              : isSelected
                              ? 'bg-cyan-400 border-cyan-300 text-black font-bold'
                              : 'border-white/20 bg-zinc-800'
                          }`}>
                            {(isAlreadyIn || isSelected) && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{t.title}</p>
                            <p className="text-[10px] text-zinc-400 truncate">{t.artist} • {t.album}</p>
                          </div>
                        </div>

                        {isAlreadyIn && (
                          <span className="text-[10px] font-medium text-zinc-500">In playlist</span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-white/10 flex items-center justify-between bg-zinc-900/60">
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedTrackIdsToAdd.length} songs selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddSongsModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAddTracks}
                    disabled={selectedTrackIdsToAdd.length === 0}
                    className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    Add to Playlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rename Playlist */}
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <div className="w-full max-w-sm p-5 rounded-3xl bg-zinc-950 border border-white/15 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Rename Playlist</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRename}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: ALL PLAYLISTS MAIN DASHBOARD (MATCHING THE SCREENSHOT EXACTLY)
  // =========================================================================
  return (
    <div className="space-y-6 pb-28 select-none animate-in fade-in duration-200">
      
      {/* Hidden M3U file input for import */}
      <input
        ref={m3uFileInputRef}
        type="file"
        accept=".m3u,.m3u8,audio/x-mpegurl"
        onChange={handleImportM3UFile}
        className="hidden"
      />

      {/* TOP HEADER: "7 playlists" + [ + ] [ ... ] */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Syne',sans-serif]">
            {totalPlaylistsCount} playlists
          </h2>
        </div>

        <div className="relative flex items-center gap-2">
          {/* [ + ] Create New Playlist Button */}
          <button
            id="btn-create-playlist-top"
            onClick={onOpenCreatePlaylist}
            title="Create New Playlist"
            className="w-9 h-9 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-cyan-500/40 text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 group"
          >
            <Plus className="w-5 h-5 text-zinc-300 group-hover:text-cyan-300 transition-colors" />
          </button>

          {/* [ ... ] Options Menu */}
          <button
            onClick={() => setIsHeaderMenuOpen(prev => !prev)}
            title="Playlist Options"
            className="w-9 h-9 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-cyan-500/40 text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95"
          >
            <MoreVertical className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Header Options Dropdown */}
          {isHeaderMenuOpen && (
            <div className="absolute right-0 top-11 z-30 w-52 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
              <button
                onClick={() => {
                  setPlaylistSortBy('custom');
                  setIsHeaderMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                  playlistSortBy === 'custom' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Sort: Default Order</span>
                {playlistSortBy === 'custom' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setPlaylistSortBy('name');
                  setIsHeaderMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                  playlistSortBy === 'name' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Sort: Alphabetical (A-Z)</span>
                {playlistSortBy === 'name' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setPlaylistSortBy('count');
                  setIsHeaderMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition ${
                  playlistSortBy === 'count' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Sort: Most Songs</span>
                {playlistSortBy === 'count' && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  m3uFileInputRef.current?.click();
                  setIsHeaderMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-300 hover:bg-indigo-500/20 text-left transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import .M3U Playlist File</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2x2 GRID OF 4 SMART SYSTEM PLAYLISTS (EXACTLY LIKE SCREENSHOT) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {systemPlaylists.map((smartPl) => {
          const Icon = smartPl.icon;

          return (
            <div
              key={smartPl.id}
              onClick={() => handleOpenSmartPlaylist(smartPl)}
              className={`group relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br ${smartPl.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer border border-white/15 hover:scale-[1.02] flex flex-col justify-between min-h-[110px] sm:min-h-[125px]`}
            >
              {/* Card Header Row: Title on Left, Context 3-Dots on Right */}
              <div className="flex items-start justify-between gap-1 z-10">
                <div className="min-w-0 pr-1">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight font-['Syne',sans-serif] drop-shadow-sm truncate">
                    {smartPl.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-semibold text-white/80 mt-0.5">
                    {smartPl.trackCount} {smartPl.trackCount === 1 ? 'song' : 'songs'}
                  </p>
                </div>

                {/* 3 dots context menu on the card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === smartPl.id ? null : smartPl.id);
                  }}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-black/20 transition cursor-pointer flex-shrink-0"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Context Dropdown on Smart Card */}
              {activeMenuId === smartPl.id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-3 top-10 z-30 w-44 p-1.5 rounded-2xl bg-zinc-950 border border-white/20 shadow-2xl space-y-0.5 animate-in fade-in"
                >
                  <button
                    onClick={() => {
                      handlePlayPlaylistAll(smartPl.tracks, false);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-zinc-800 text-left transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                    <span>Play All</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePlayPlaylistAll(smartPl.tracks, true);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-zinc-800 text-left transition"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Shuffle All</span>
                  </button>
                </div>
              )}

              {/* Tilted Cover Thumbnail at Bottom Right (Exact DDMusic Aesthetic) */}
              <div className="absolute -bottom-2 -right-2 pointer-events-none transform rotate-[8deg] group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  style={{
                    background: smartPl.topCoverUrl 
                      ? undefined 
                      : `linear-gradient(135deg, ${smartPl.topCoverGradient[0]}, ${smartPl.topCoverGradient[1]})`
                  }}
                >
                  {smartPl.topCoverUrl ? (
                    <img
                      src={smartPl.topCoverUrl}
                      alt={smartPl.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Icon className="w-7 h-7 text-white/80" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: "My playlists (X)" LIST */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white tracking-tight font-['Syne',sans-serif]">
            My playlists <span className="text-zinc-500 font-mono font-medium">({customPlaylists.length})</span>
          </h3>

          <button
            onClick={onOpenCreatePlaylist}
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {customPlaylists.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
            <ListMusic className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">No custom playlists yet</p>
            <button
              onClick={onOpenCreatePlaylist}
              className="px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition cursor-pointer shadow-md"
            >
              + Create Your First Playlist
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customPlaylists.map((pl) => {
              const plTracks = pl.trackIds
                .map(id => tracks.find(t => t.id === id))
                .filter((t): t is Track => t !== undefined);
              const firstCover = plTracks[0]?.coverUrl;
              const gradient = pl.coverGradient || ['#3b82f6', '#1d4ed8'];

              return (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl)}
                  className="group relative flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-white/5 hover:border-cyan-500/30 transition duration-200 shadow-sm cursor-pointer backdrop-blur-sm"
                >
                  {/* Left Info & Cover Icon */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200 border border-white/10"
                      style={{
                        background: firstCover ? undefined : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
                      }}
                    >
                      {firstCover ? (
                        <img
                          src={firstCover}
                          alt={pl.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Music className="w-5 h-5 text-white/80" />
                      )}
                      
                      {/* Hover Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                        <Play className="w-4 h-4 fill-cyan-300 text-cyan-300" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors font-['Syne',sans-serif]">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                        {pl.trackIds.length} {pl.trackIds.length === 1 ? 'song' : 'songs'}
                      </p>
                    </div>
                  </div>

                  {/* Right Context Button */}
                  <div 
                    className="flex items-center gap-1.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === pl.id ? null : pl.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Custom Playlist Context Dropdown */}
                  {activeMenuId === pl.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-4 top-12 z-20 w-52 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                    >
                      <button
                        onClick={() => {
                          handlePlayPlaylistAll(plTracks, false);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                        <span>Play All</span>
                      </button>

                      <button
                        onClick={() => {
                          handlePlayPlaylistAll(plTracks, true);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Shuffle All</span>
                      </button>

                      <button
                        onClick={() => {
                          setActivePlaylist(pl);
                          setIsAddSongsModalOpen(true);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Add Songs from Library</span>
                      </button>

                      <button
                        onClick={() => {
                          setActivePlaylist(pl);
                          setRenameValue(pl.name);
                          setIsRenameModalOpen(true);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rename Playlist</span>
                      </button>

                      <button
                        onClick={() => {
                          onDuplicatePlaylist(pl);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Duplicate Playlist</span>
                      </button>

                      <button
                        onClick={() => {
                          handleExportM3U(pl, plTracks);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Export as .M3U File</span>
                      </button>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={() => {
                          onDeletePlaylist(pl.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 text-left transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Playlist</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

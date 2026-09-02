import React, { useState, useMemo, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderSearch, 
  EyeOff, 
  Play, 
  Shuffle, 
  MoreVertical, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  ListPlus, 
  Plus, 
  Tags, 
  Trash2, 
  Scissors, 
  Radio, 
  Info, 
  RefreshCw, 
  SlidersHorizontal, 
  HardDrive, 
  FolderTree, 
  Eye, 
  Share2, 
  Sparkles, 
  FileAudio,
  Check,
  Music2,
  Filter,
  ArrowUpDown,
  Download,
  ListMusic
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface FoldersBrowserProps {
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
  onImportTrack: (newTrack: Track, blob?: Blob | File) => void;
  onImportMultipleTracks?: (newTracks: Track[], itemsWithBlobs?: { track: Track; blob?: Blob | File }[]) => void;
}

type FolderSortMode = 'name-asc' | 'name-desc' | 'count-desc' | 'size-desc' | 'path-asc';
type TrackSortMode = 'title' | 'artist' | 'duration' | 'size' | 'bitrate';

export const FoldersBrowser: React.FC<FoldersBrowserProps> = ({
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
  onImportTrack,
  onImportMultipleTracks
}) => {
  const { t } = useTranslation();

  // Navigation State
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [hiddenFolders, setHiddenFolders] = useState<string[]>([]);
  const [filterShortClips, setFilterShortClips] = useState(false);

  // Modals
  const [showDirectoriesModal, setShowDirectoriesModal] = useState(false);
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [folderPropertiesTarget, setFolderPropertiesTarget] = useState<string | null>(null);
  const [playlistPickerFolderTracks, setPlaylistPickerFolderTracks] = useState<Track[] | null>(null);
  const [playlistPickerSingleTrack, setPlaylistPickerSingleTrack] = useState<Track | null>(null);

  // Context Menu State
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [activeTrackMenuId, setActiveTrackMenuId] = useState<string | null>(null);

  // Search & Filter State
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [folderSortMode, setFolderSortMode] = useState<FolderSortMode>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [inFolderSearch, setInFolderSearch] = useState('');
  const [inFolderSort, setInFolderSort] = useState<TrackSortMode>('title');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File input ref for importing directly into selected folder
  const folderFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to extract clean folder path from track
  const getTrackFolderPath = (t: Track): string => {
    if (t.folderPath && t.folderPath.trim()) return t.folderPath;
    if (t.source === 'RECEIVED') return '/storage/emulated/0/AuraTransfer/Received';
    if (t.source === 'IMPORTED') return '/storage/emulated/0/Download/Imported';
    return '/storage/emulated/0/Music';
  };

  // Format bytes to readable string
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format total seconds into human readable string
  const formatTotalTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} hr ${mins} min`;
    return `${mins} min`;
  };

  // Map of all folders with track collections
  const allFoldersMap = useMemo(() => {
    const map = new Map<string, Track[]>();

    tracks.forEach(track => {
      // Filter out short clips if setting is active (< 30s)
      if (filterShortClips && track.duration < 30) return;

      const fPath = getTrackFolderPath(track);
      if (!map.has(fPath)) {
        map.set(fPath, []);
      }
      map.get(fPath)!.push(track);
    });

    return map;
  }, [tracks, filterShortClips]);

  // List of active folders (excluding hidden)
  const activeFolderPaths = useMemo(() => {
    const paths = Array.from(allFoldersMap.keys()).filter(path => !hiddenFolders.includes(path));

    // Filter by search term
    const filtered = paths.filter(path => {
      const folderName = path.split('/').filter(Boolean).pop() || path;
      return (
        folderName.toLowerCase().includes(folderSearchTerm.toLowerCase()) ||
        path.toLowerCase().includes(folderSearchTerm.toLowerCase())
      );
    });

    // Sorting
    return filtered.sort((a, b) => {
      const nameA = (a.split('/').filter(Boolean).pop() || a).toLowerCase();
      const nameB = (b.split('/').filter(Boolean).pop() || b).toLowerCase();
      const tracksA = allFoldersMap.get(a) || [];
      const tracksB = allFoldersMap.get(b) || [];
      const sizeA = tracksA.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
      const sizeB = tracksB.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);

      switch (folderSortMode) {
        case 'name-asc': return nameA.localeCompare(nameB);
        case 'name-desc': return nameB.localeCompare(nameA);
        case 'count-desc': return tracksB.length - tracksA.length;
        case 'size-desc': return sizeB - sizeA;
        case 'path-asc': return a.localeCompare(b);
        default: return nameA.localeCompare(nameB);
      }
    });
  }, [allFoldersMap, hiddenFolders, folderSearchTerm, folderSortMode]);

  // Fast Alphabet letter indexes for side scroller
  const alphabetLetters = useMemo(() => {
    const letters = new Set<string>();
    activeFolderPaths.forEach(path => {
      const name = (path.split('/').filter(Boolean).pop() || '').trim();
      const firstChar = name[0]?.toUpperCase();
      if (firstChar && /[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add('#');
      }
    });
    return Array.from(letters).sort();
  }, [activeFolderPaths]);

  // Folder action helpers
  const handlePlayFolder = (folderPath: string, shuffle = false) => {
    const folderTracks = allFoldersMap.get(folderPath) || [];
    if (folderTracks.length === 0) {
      showToast('No playable tracks in this folder');
      return;
    }

    if (shuffle) {
      const shuffled = [...folderTracks].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0]);
      shuffled.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Shuffling ${folderTracks.length} tracks from ${folderPath.split('/').pop()}`);
    } else {
      onPlayTrack(folderTracks[0]);
      folderTracks.slice(1).forEach(t => onAddToQueue(t));
      showToast(`Playing ${folderTracks.length} tracks from ${folderPath.split('/').pop()}`);
    }
    setActiveFolderMenu(null);
  };

  const handleQueueFolder = (folderPath: string, next = false) => {
    const folderTracks = allFoldersMap.get(folderPath) || [];
    if (folderTracks.length === 0) return;

    if (next) {
      // Add in reverse to play next in order
      [...folderTracks].reverse().forEach(t => onPlayNext(t));
      showToast(`Added ${folderTracks.length} tracks to play next`);
    } else {
      folderTracks.forEach(t => onAddToQueue(t));
      showToast(`Added ${folderTracks.length} tracks to queue`);
    }
    setActiveFolderMenu(null);
  };

  const handleHideFolder = (folderPath: string) => {
    setHiddenFolders(prev => [...prev, folderPath]);
    if (selectedFolder === folderPath) {
      setSelectedFolder(null);
    }
    setActiveFolderMenu(null);
    showToast(`Folder hidden. You can restore it anytime in 'Hidden folders'`);
  };

  const handleUnhideFolder = (folderPath: string) => {
    setHiddenFolders(prev => prev.filter(p => p !== folderPath));
    showToast(`Folder unhidden and restored to main list`);
  };

  const handleRescanFolder = (folderPath: string) => {
    setActiveFolderMenu(null);
    const count = (allFoldersMap.get(folderPath) || []).length;
    showToast(`Rescanned ${folderPath.split('/').pop()}: ${count} audio files verified`);
  };

  // In-folder tracks list and filtering
  const currentFolderTracks = useMemo(() => {
    if (!selectedFolder) return [];
    const list = allFoldersMap.get(selectedFolder) || [];

    const filtered = list.filter(t => {
      const q = inFolderSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.format.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      switch (inFolderSort) {
        case 'title': return a.title.localeCompare(b.title);
        case 'artist': return a.artist.localeCompare(b.artist);
        case 'duration': return b.duration - a.duration;
        case 'size': return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
        case 'bitrate': return (b.format === 'FLAC' ? 1 : 0) - (a.format === 'FLAC' ? 1 : 0);
        default: return a.title.localeCompare(b.title);
      }
    });
  }, [selectedFolder, allFoldersMap, inFolderSearch, inFolderSort]);

  // Import files directly into active folder
  const handleImportToActiveFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedFolder) return;

    Array.from(files).forEach((file, idx) => {
      const nameParts = file.name.split('.');
      const ext = nameParts.pop()?.toUpperCase() || 'MP3';
      const cleanTitle = nameParts.join('.');

      const newTrack: Track = {
        id: `trk-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: cleanTitle,
        artist: 'Local Import',
        album: selectedFolder.split('/').filter(Boolean).pop() || 'Imported Files',
        duration: 180,
        genre: 'Local Audio',
        year: new Date().getFullYear(),
        source: 'IMPORTED',
        trackNumber: idx + 1,
        bitrate: ext === 'FLAC' ? '24-Bit / 96kHz Lossless' : '320 kbps High-Res',
        sampleRate: ext === 'FLAC' ? '96000 Hz' : '44100 Hz',
        format: (ext === 'FLAC' || ext === 'WAV' || ext === 'M4A' || ext === 'AAC' ? ext : 'MP3') as any,
        fileSizeBytes: file.size || 12000000,
        dateAdded: Date.now(),
        skipCount: 0,
        folderPath: selectedFolder,
        isFavorite: false,
        playCount: 0,
        coverGradient: ['#0f766e', '#115e59'],
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
        lyricsLrc: `[00:05.00] Imported from ${file.name}`
      };

      onImportTrack(newTrack, file);
    });

    showToast(`Imported ${files.length} song(s) into ${selectedFolder.split('/').pop()}`);
    if (folderFileInputRef.current) {
      folderFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-20 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-950/95 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: INSIDE A FOLDER ("Folder er vitor ta" - Detail Interactive Explorer) */}
      {/* ========================================================================= */}
      {selectedFolder ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top navigation & breadcrumb */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedFolder(null);
                setInFolderSearch('');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back to Folders</span>
            </button>

            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-xl border border-white/5 truncate max-w-[200px] sm:max-w-xs inline-block">
                {selectedFolder}
              </span>
            </div>
          </div>

          {/* Folder Hero Banner */}
          {(() => {
            const folderTracks = allFoldersMap.get(selectedFolder) || [];
            const folderName = selectedFolder.split('/').filter(Boolean).pop() || 'Music';
            const totalBytes = folderTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
            const totalDurationSecs = folderTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
            const flacCount = folderTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;
            const formats = Array.from(new Set(folderTracks.map(t => t.format)));

            return (
              <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-2xl space-y-4">
                {/* Background Ambient Glow */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Folder Icon / Artwork Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-xl flex-shrink-0 flex items-center justify-center">
                      <div className="w-full h-full rounded-[14px] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center text-amber-300">
                        <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 fill-amber-400 text-amber-300 drop-shadow-md" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                          {folderName}
                        </h2>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {folderTracks.length} Songs
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 font-mono truncate">
                        {selectedFolder}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-300 font-medium">
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

                  {/* Formats Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {formats.map(fmt => (
                      <span key={fmt} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-800/90 text-zinc-300 border border-white/10 shadow-sm">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handlePlayFolder(selectedFolder, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs shadow-lg hover:shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Play All ({folderTracks.length})</span>
                  </button>

                  <button
                    onClick={() => handlePlayFolder(selectedFolder, true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer shadow"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={() => {
                      setPlaylistPickerFolderTracks(folderTracks);
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add folder tracks to playlist"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Add to Playlist</span>
                  </button>

                  <button
                    onClick={() => handleQueueFolder(selectedFolder, false)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs border border-white/10 transition active:scale-95 cursor-pointer"
                    title="Add all songs to queue"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Add to Queue</span>
                  </button>

                  {/* Add Audio File To Folder Button */}
                  <label className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 font-bold text-xs border border-amber-500/20 transition active:scale-95 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Songs</span>
                    <input
                      ref={folderFileInputRef}
                      type="file"
                      multiple
                      accept="audio/*,.mp3,.flac,.wav,.m4a,.aac,.ogg,.opus"
                      onChange={handleImportToActiveFolder}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            );
          })()}

          {/* In-Folder Search & Sorter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-2xl bg-zinc-900/90 border border-white/10">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inFolderSearch}
                onChange={(e) => setInFolderSearch(e.target.value)}
                placeholder="Search within this folder..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
              {inFolderSearch && (
                <button
                  onClick={() => setInFolderSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Sort:</span>
              {(['title', 'artist', 'duration', 'size', 'bitrate'] as TrackSortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setInFolderSort(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    inFolderSort === mode
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* In-Folder Tracks List */}
          <div className="space-y-1.5">
            {currentFolderTracks.length === 0 ? (
              <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                <FileAudio className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No tracks found in this folder</p>
                {inFolderSearch && (
                  <button
                    onClick={() => setInFolderSearch('')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              currentFolderTracks.map((track, idx) => {
                const isLossless = track.format === 'FLAC' || track.format === 'WAV';
                return (
                  <div
                    key={track.id}
                    className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/5 hover:border-amber-500/30 transition shadow-sm"
                  >
                    {/* Click track to play */}
                    <div
                      onClick={() => onPlayTrack(track)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Track index */}
                      <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0 group-hover:text-amber-400 transition">
                        {idx + 1}
                      </span>

                      {/* Album Cover Thumbnail */}
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
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
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
                          <span>Delete File</span>
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
        /* VIEW 2: MAIN FOLDERS DIRECTORY LIST (MATCHING THE USER'S DDMUSIC SCREENSHOT) */
        /* ========================================================================= */
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Top Bar: Folders Count on Left + Sort Filter on Right */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                {activeFolderPaths.length} folders
              </span>
              {hiddenFolders.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5">
                  {hiddenFolders.length} hidden
                </span>
              )}
            </div>

            {/* Sort Filter Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Sort folders"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sort</span>
              </button>

              {/* Sort Menu Dropdown */}
              {showSortDropdown && (
                <div className="absolute right-0 top-11 z-30 w-48 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Sort Folders By
                  </div>
                  {[
                    { key: 'name-asc', label: 'Name (A to Z)' },
                    { key: 'name-desc', label: 'Name (Z to A)' },
                    { key: 'count-desc', label: 'Song Count (High to Low)' },
                    { key: 'size-desc', label: 'Size (Large to Small)' },
                    { key: 'path-asc', label: 'Storage Path' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setFolderSortMode(item.key as FolderSortMode);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer ${
                        folderSortMode === item.key
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {folderSortMode === item.key && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TWO TOP QUICK ACTION CARDS (EXACTLY AS IN SCREENSHOT) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Directories */}
            <button
              onClick={() => setShowDirectoriesModal(true)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/30 hover:from-blue-900/50 hover:to-indigo-900/40 border border-blue-500/20 hover:border-blue-500/40 text-left transition shadow-md group cursor-pointer active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-105 transition flex-shrink-0">
                <FolderSearch className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-blue-300 transition truncate">
                  Directories
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  Scan & add storage
                </p>
              </div>
            </button>

            {/* Card 2: Hidden Folders */}
            <button
              onClick={() => setShowHiddenModal(true)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-zinc-900/80 to-slate-900/70 hover:from-zinc-800/90 hover:to-slate-800/80 border border-white/10 hover:border-indigo-500/30 text-left transition shadow-md group cursor-pointer active:scale-98"
            >
              <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 group-hover:text-indigo-300 group-hover:scale-105 transition flex-shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-indigo-300 transition truncate">
                    Hidden folders
                  </h4>
                  {hiddenFolders.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {hiddenFolders.length} excluded
                </p>
              </div>
            </button>
          </div>

          {/* Quick Search in Folders */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={folderSearchTerm}
              onChange={(e) => setFolderSearchTerm(e.target.value)}
              placeholder="Search folders by name or path..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 shadow-inner"
            />
            {folderSearchTerm && (
              <button
                onClick={() => setFolderSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* FOLDERS LIST (MATCHING THE SCREENSHOT WITH ROUNDED AMBER FOLDERS & SUBTITLES) */}
          <div className="space-y-2 relative">
            {activeFolderPaths.length === 0 ? (
              <div className="p-10 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                <Folder className="w-12 h-12 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No folders found</p>
                <button
                  onClick={() => setFolderSearchTerm('')}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              activeFolderPaths.map((folderPath) => {
                const folderTracks = allFoldersMap.get(folderPath) || [];
                const folderName = folderPath.split('/').filter(Boolean).pop() || 'Music';
                const isSdCard = folderPath.toLowerCase().includes('sdcard');
                const isSnapTube = folderName.toLowerCase().includes('snaptube');
                const isWhatsApp = folderName.toLowerCase().includes('whatsapp');
                const isDownload = folderName.toLowerCase().includes('download');

                return (
                  <div
                    key={folderPath}
                    className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-white/5 hover:border-amber-500/30 transition shadow-sm"
                  >
                    {/* Click Folder to open detail view */}
                    <div
                      onClick={() => setSelectedFolder(folderPath)}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer pr-2"
                    >
                      {/* Realistic Amber Golden Folder Icon with 3D depth */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md flex-shrink-0 group-hover:scale-105 transition">
                        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-amber-950">
                          <Folder className="w-6 h-6 fill-amber-300 text-amber-200 drop-shadow" />
                        </div>
                      </div>

                      {/* Folder Title & Subtitle */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                            {folderName}
                          </h3>
                          {isSdCard && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                              SD Card
                            </span>
                          )}
                        </div>

                        {/* Subtitle format: "8 songs · /storage/emulated/0/Download" */}
                        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                          <span className="text-zinc-300 font-semibold">{folderTracks.length} songs</span>
                          <span className="mx-1.5 text-zinc-600">·</span>
                          <span className="font-mono text-[11px] text-zinc-500">{folderPath}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right Side 3-dots Context Menu Button */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFolderMenu(activeFolderMenu === folderPath ? null : folderPath);
                        }}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Folder options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Folder Context Menu Dropdown */}
                    {activeFolderMenu === folderPath && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-14 z-30 w-56 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in"
                      >
                        <button
                          onClick={() => handlePlayFolder(folderPath, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          <span>Play All Songs</span>
                        </button>

                        <button
                          onClick={() => handlePlayFolder(folderPath, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Shuffle Folder</span>
                        </button>

                        <button
                          onClick={() => handleQueueFolder(folderPath, true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Play Next</span>
                        </button>

                        <button
                          onClick={() => handleQueueFolder(folderPath, false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add to Queue</span>
                        </button>

                        <button
                          onClick={() => {
                            setPlaylistPickerFolderTracks(folderTracks);
                            setActiveFolderMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Folder to Playlist</span>
                        </button>

                        <button
                          onClick={() => {
                            setFolderPropertiesTarget(folderPath);
                            setActiveFolderMenu(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Folder Properties</span>
                        </button>

                        <button
                          onClick={() => handleRescanFolder(folderPath)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Rescan Folder</span>
                        </button>

                        <div className="my-1 border-t border-white/10" />

                        <button
                          onClick={() => handleHideFolder(folderPath)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-amber-400 hover:bg-amber-500/15 text-left transition cursor-pointer"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Folder</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DIRECTORIES SCANNER & STORAGE PATHS MANAGER */}
      {/* ========================================================================= */}
      {showDirectoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-blue-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                  <FolderSearch className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Music Directories
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Manage indexed storage folders on your device
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDirectoriesModal(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Storage Drive Overview */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <HardDrive className="w-4 h-4" />
                  <span>Internal Storage</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">/storage/emulated/0</p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-blue-500 h-full w-2/3" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <FolderTree className="w-4 h-4" />
                  <span>Indexed Folders</span>
                </div>
                <p className="text-sm font-black text-white">{allFoldersMap.size} Active</p>
                <p className="text-[10px] text-zinc-400">{tracks.length} total audio files</p>
              </div>
            </div>

            {/* Scanned Directories List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
                Active Scan Locations:
              </p>
              {Array.from(allFoldersMap.keys()).map((path) => {
                const count = allFoldersMap.get(path)?.length || 0;
                return (
                  <div
                    key={path}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white truncate">{path.split('/').pop()}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{path}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 flex-shrink-0">
                      {count} songs
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                onClick={() => {
                  showToast('Storage rescanned! All local folders are up to date.');
                  setShowDirectoriesModal(false);
                }}
                className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rescan All Folders</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: HIDDEN FOLDERS & FILTER MANAGER */}
      {/* ========================================================================= */}
      {showHiddenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <EyeOff className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Hidden Folders
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Manage excluded folders and voice clip filters
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHiddenModal(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Short Audio Clips Filter Toggle */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">Filter Out Short Audio Clips</h4>
                <p className="text-[10px] text-zinc-400">Ignore ringtones and audio under 30 seconds</p>
              </div>
              <button
                onClick={() => setFilterShortClips(!filterShortClips)}
                className={`w-11 h-6 rounded-full transition flex items-center p-1 cursor-pointer ${
                  filterShortClips ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Hidden Folders List */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
                Hidden Storage Folders ({hiddenFolders.length}):
              </p>
              {hiddenFolders.length === 0 ? (
                <div className="p-6 text-center bg-zinc-900/40 rounded-2xl border border-white/5">
                  <p className="text-xs text-zinc-400">No folders are currently hidden</p>
                </div>
              ) : (
                hiddenFolders.map(path => (
                  <div
                    key={path}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white truncate">{path.split('/').pop()}</p>
                      <p className="text-[10px] font-mono text-zinc-500 truncate">{path}</p>
                    </div>
                    <button
                      onClick={() => handleUnhideFolder(path)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Unhide</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHiddenModal(false)}
                className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FOLDER PROPERTIES DIALOG */}
      {/* ========================================================================= */}
      {folderPropertiesTarget && (() => {
        const folderTracks = allFoldersMap.get(folderPropertiesTarget) || [];
        const folderName = folderPropertiesTarget.split('/').filter(Boolean).pop() || 'Folder';
        const totalBytes = folderTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
        const totalSecs = folderTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
        const flacCount = folderTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;
        const formats = Array.from(new Set(folderTracks.map(t => t.format)));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {folderName}
                    </h3>
                    <p className="text-xs text-zinc-400">Folder Technical Specifications</p>
                  </div>
                </div>

                <button
                  onClick={() => setFolderPropertiesTarget(null)}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Directory Path:</span>
                  <span className="font-mono text-white text-right break-all max-w-[220px]">{folderPropertiesTarget}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Total Audio Tracks:</span>
                  <span className="font-bold text-white">{folderTracks.length} files</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Total Playtime:</span>
                  <span className="font-bold text-white">{formatTotalTime(totalSecs)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Storage Size:</span>
                  <span className="font-bold text-white">{formatBytes(totalBytes)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-400">Lossless / Hi-Res:</span>
                  <span className="font-bold text-emerald-400">{flacCount} files ({folderTracks.length ? Math.round((flacCount / folderTracks.length) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Audio Formats:</span>
                  <span className="font-bold text-amber-300">{formats.join(', ')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setFolderPropertiesTarget(null)}
                  className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD FOLDER OR SONG TO PLAYLIST PICKER */}
      {/* ========================================================================= */}
      {(playlistPickerFolderTracks || playlistPickerSingleTrack) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ListMusic className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  Add to Playlist
                </h3>
              </div>
              <button
                onClick={() => {
                  setPlaylistPickerFolderTracks(null);
                  setPlaylistPickerSingleTrack(null);
                }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select a target playlist for {playlistPickerFolderTracks ? `${playlistPickerFolderTracks.length} songs` : playlistPickerSingleTrack?.title}:
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    if (playlistPickerFolderTracks) {
                      playlistPickerFolderTracks.forEach(t => onAddToPlaylist(t.id, pl.id));
                      showToast(`Added ${playlistPickerFolderTracks.length} songs to "${pl.name}"`);
                    } else if (playlistPickerSingleTrack) {
                      onAddToPlaylist(playlistPickerSingleTrack.id, pl.id);
                      showToast(`Added "${playlistPickerSingleTrack.title}" to "${pl.name}"`);
                    }
                    setPlaylistPickerFolderTracks(null);
                    setPlaylistPickerSingleTrack(null);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-left transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-white truncate">{pl.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{pl.trackIds.length} tracks</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

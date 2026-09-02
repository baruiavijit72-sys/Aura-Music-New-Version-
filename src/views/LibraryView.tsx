import React, { useState, useRef, useMemo } from 'react';
import { 
  Music, 
  Disc, 
  User, 
  Folder, 
  Calendar, 
  ArrowUpDown, 
  MoreVertical, 
  Play, 
  Plus, 
  Share2, 
  Scissors, 
  Tags, 
  Trash2, 
  ListPlus, 
  Upload, 
  Search, 
  Download, 
  Smartphone, 
  ChevronRight, 
  ArrowLeft, 
  Shuffle, 
  FolderOpen, 
  Radio,
  CheckCircle2,
  AlertCircle,
  ListMusic
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { downloadTrackToDevice, shareTrackViaNativeOS } from '../utils/audioTransfer';
import { AUDIO_ACCEPT_STRING, convertFileToTrack, isAudioFile } from '../utils/fileScanner';
import { FolderScannerModal } from '../components/FolderScannerModal';
import { AlphabetScroller } from '../components/AlphabetScroller';
import { FoldersBrowser } from '../components/FoldersBrowser';
import { AlbumsBrowser } from '../components/AlbumsBrowser';
import { ArtistsBrowser } from '../components/ArtistsBrowser';
import { GenresBrowser } from '../components/GenresBrowser';
import { useTranslation } from '../i18n/LanguageContext';

interface LibraryViewProps {
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
  onSwitchToPlaylists?: () => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
}

type LibraryCategory = 'tracks' | 'playlists' | 'albums' | 'artists' | 'genres' | 'folders' | 'years';
type SourceFilter = 'ALL' | 'LOCAL' | 'RECEIVED' | 'IMPORTED';
type SortField = 'title' | 'artist' | 'duration' | 'year' | 'playCount';
type StorageDriveFilter = 'ALL' | 'INTERNAL' | 'SDCARD' | 'TRANSFERS';

export const getTrackIndexLetter = (text: string): string => {
  if (!text) return '#';
  const cleaned = text.replace(/^["'|#(\[\{\s\-_•*~`!@$%^&+=]+/i, '').trim();
  if (!cleaned) return '#';
  const firstChar = cleaned.charAt(0).toUpperCase();
  if (/[A-Z]/.test(firstChar)) {
    return firstChar;
  }
  return '#';
};

export const LibraryView: React.FC<LibraryViewProps> = ({
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
  onImportMultipleTracks,
  onSwitchToPlaylists,
  onSelectPlaylist,
}) => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>('tracks');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [showPlaylistSelectorForTrack, setShowPlaylistSelectorForTrack] = useState<Track | null>(null);
  const [isFolderScannerOpen, setIsFolderScannerOpen] = useState(false);
  
  // Drilldown states
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [storageDriveFilter, setStorageDriveFilter] = useState<StorageDriveFilter>('ALL');
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [scanNotification, setScanNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderDirectoryInputRef = useRef<HTMLInputElement | null>(null);

  // Safe folder path normalizer for every track
  const getTrackFolderPath = (t: Track): string => {
    if (t.folderPath && t.folderPath.trim()) {
      let fp = t.folderPath.trim();
      if (!fp.startsWith('/')) fp = '/' + fp;
      return fp;
    }
    if (t.source === 'RECEIVED') return '/storage/emulated/0/AuraTransfer/Received';
    if (t.source === 'IMPORTED') return '/storage/emulated/0/Music/Imported';
    if (t.artist && t.artist !== 'Unknown Artist' && t.artist !== 'Local Artist') {
      return `/storage/emulated/0/Music/${t.artist}`;
    }
    return '/storage/emulated/0/Music';
  };

  // Filter by source
  let filteredTracks = tracks.filter(t => {
    if (sourceFilter === 'ALL') return true;
    return t.source === sourceFilter;
  });

  // Sort
  filteredTracks.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'artist') cmp = a.artist.localeCompare(b.artist);
    else if (sortField === 'duration') cmp = a.duration - b.duration;
    else if (sortField === 'year') cmp = a.year - b.year;
    else if (sortField === 'playCount') cmp = a.playCount - b.playCount;
    return sortAsc ? cmp : -cmp;
  });

  // Calculate available letters and letter to first track id map
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    filteredTracks.forEach(t => {
      const letter = getTrackIndexLetter(sortField === 'artist' ? t.artist : t.title);
      set.add(letter);
    });
    return set;
  }, [filteredTracks, sortField]);

  const letterToFirstTrackId = useMemo(() => {
    const map = new Map<string, string>();
    filteredTracks.forEach(t => {
      const letter = getTrackIndexLetter(sortField === 'artist' ? t.artist : t.title);
      if (!map.has(letter)) {
        map.set(letter, t.id);
      }
    });
    return map;
  }, [filteredTracks, sortField]);

  // Jump to letter in tracks list
  const handleSelectLetter = (letter: string) => {
    setActiveLetter(letter);
    if (letter === '@') {
      handleScrollToTop();
      return;
    }

    // 1. Direct section header lookup
    const secEl = document.getElementById(`letter-section-${letter}`);
    if (secEl) {
      secEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // 2. Direct track id lookup
    const trackId = letterToFirstTrackId.get(letter);
    if (trackId) {
      const trackEl = document.getElementById(`track-item-${trackId}`);
      if (trackEl) {
        trackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // 3. Fallback to next alphabetical letter available
    const allAvailable = Array.from(availableLetters).sort();
    const nextLetter = allAvailable.find(l => l >= letter);
    if (nextLetter) {
      const fallbackTrackId = letterToFirstTrackId.get(nextLetter);
      if (fallbackTrackId) {
        const fallbackEl = document.getElementById(`track-item-${fallbackTrackId}`);
        if (fallbackEl) {
          fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleScrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Groupings for categories
  const albums = Array.from(new Set(tracks.map(t => t.album || 'Unknown Album')));
  const artists = Array.from(new Set(tracks.map(t => t.artist || 'Unknown Artist')));
  const genres = Array.from(new Set(tracks.map(t => t.genre || 'Other')));
  const folders = Array.from(new Set(tracks.map(t => getTrackFolderPath(t)))).sort();
  const years = Array.from(new Set(tracks.map(t => t.year || new Date().getFullYear()))).sort((a, b) => b - a);

  // Filtered folders by drive & search
  const displayedFolders = folders.filter(folderPath => {
    if (storageDriveFilter === 'INTERNAL' && !folderPath.includes('/emulated/0')) return false;
    if (storageDriveFilter === 'SDCARD' && !folderPath.includes('sdcard')) return false;
    if (storageDriveFilter === 'TRANSFERS' && !folderPath.includes('AuraTransfer') && !folderPath.includes('Received')) return false;
    
    if (folderSearchTerm.trim()) {
      const q = folderSearchTerm.toLowerCase();
      const folderName = folderPath.split('/').filter(Boolean).pop() || '';
      const hasMatchingTrack = tracks.some(t => getTrackFolderPath(t) === folderPath && (t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)));
      return folderPath.toLowerCase().includes(q) || folderName.toLowerCase().includes(q) || hasMatchingTrack;
    }
    return true;
  });

  // File Upload / Import Handler with batch support
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const audioFiles = Array.from(files).filter(isAudioFile);
    const convertedTracks: Track[] = [];
    const blobItems: { track: Track; blob: File }[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      try {
        const track = await convertFileToTrack(file, tracks.length + i);
        convertedTracks.push(track);
        blobItems.push({ track, blob: file });
      } catch (err) {
        console.warn('Could not parse audio file:', file.name, err);
      }
    }

    if (convertedTracks.length > 0) {
      if (onImportMultipleTracks) {
        onImportMultipleTracks(convertedTracks, blobItems);
      } else {
        convertedTracks.forEach(t => onImportTrack(t));
      }
      setScanNotification({
        type: 'success',
        message: `Imported ${convertedTracks.length} song(s) into your library!`
      });
    }
  };

  // Direct Folder Scanner Handler (File Manager directory picker)
  const handleFolderScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    const audioFiles = allFiles.filter(isAudioFile);

    if (audioFiles.length === 0) {
      setScanNotification({
        type: 'error',
        message: 'No audio files found in the selected folder. Please choose a folder with MP3, FLAC, WAV, AAC, or M4A music files.'
      });
      return;
    }

    const convertedTracks: Track[] = [];
    const blobItems: { track: Track; blob: File }[] = [];
    let detectedFolder = '';

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      try {
        const track = await convertFileToTrack(file, tracks.length + i);
        convertedTracks.push(track);
        blobItems.push({ track, blob: file });
        if (!detectedFolder && track.folderPath) {
          detectedFolder = track.folderPath;
        }
      } catch (err) {
        console.warn('Could not process audio track:', file.name, err);
      }
    }

    if (convertedTracks.length > 0) {
      if (onImportMultipleTracks) {
        onImportMultipleTracks(convertedTracks, blobItems);
      } else {
        convertedTracks.forEach(t => onImportTrack(t));
      }

      setScanNotification({
        type: 'success',
        message: `Successfully added ${convertedTracks.length} songs from folder!`
      });

      // Switch to folders view so the user can immediately see and play their scanned songs
      setActiveCategory('folders');
      if (detectedFolder) {
        setSelectedFolder(detectedFolder);
      }
    } else {
      setScanNotification({
        type: 'error',
        message: 'Unable to parse audio metadata from the selected folder.'
      });
    }

    // Reset input value so user can re-scan same folder if desired
    if (folderDirectoryInputRef.current) {
      folderDirectoryInputRef.current.value = '';
    }
  };

  const handleBatchImportDiscovered = (newTracks: Track[], itemsWithBlobs?: { track: Track; blob: Blob | File }[]) => {
    if (onImportMultipleTracks) {
      onImportMultipleTracks(newTracks, itemsWithBlobs);
    } else {
      newTracks.forEach(t => onImportTrack(t));
    }
    setScanNotification({
      type: 'success',
      message: `Added ${newTracks.length} song(s) to your library!`
    });
  };

  const handleCategoryChange = (category: LibraryCategory) => {
    if (category === 'playlists' && onSwitchToPlaylists) {
      onSwitchToPlaylists();
      return;
    }
    setActiveCategory(category);
    setSelectedFolder(null);
    setSelectedAlbum(null);
    setSelectedArtist(null);
    setSelectedGenre(null);
    setSelectedYear(null);
  };

  const handlePlayFolderAll = (folderPath: string, shuffle = false) => {
    const folderTracks = tracks.filter(t => getTrackFolderPath(t) === folderPath);
    if (folderTracks.length === 0) return;
    
    let playList = [...folderTracks];
    if (shuffle) {
      playList = playList.sort(() => Math.random() - 0.5);
    }
    onPlayTrack(playList[0]);
    for (let i = 1; i < playList.length; i++) {
      onAddToQueue(playList[i]);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Hidden File & Directory Inputs for optional manual import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept={AUDIO_ACCEPT_STRING}
        className="hidden"
      />
      <input
        type="file"
        ref={folderDirectoryInputRef}
        onChange={handleFolderScanChange}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Toast / Notification Banner */}
      {scanNotification && (
        <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 ${
          scanNotification.type === 'success'
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
            : scanNotification.type === 'error'
            ? 'bg-rose-950/80 text-rose-200 border-rose-500/30'
            : 'bg-zinc-900 text-zinc-200 border-white/10'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {scanNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold truncate">{scanNotification.message}</span>
          </div>
          <button
            onClick={() => setScanNotification(null)}
            className="p-1 text-zinc-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Clean Library Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold text-white tracking-tight">{t.library.title}</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-zinc-300">
            {tracks.length} {tracks.length === 1 ? t.common.tracks.slice(0, -1) || 'song' : t.common.tracks}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tracks.length > 0 && (
            <button
              onClick={() => {
                const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                onPlayTrack(shuffled[0]);
                for (let i = 1; i < shuffled.length; i++) {
                  onAddToQueue(shuffled[i]);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{t.player.shuffle}</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.library.importFiles}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {([
          { key: 'tracks', label: t.library.tracks, icon: Music },
          { key: 'playlists', label: 'Playlists', icon: ListMusic },
          { key: 'albums', label: t.library.albums, icon: Disc },
          { key: 'artists', label: t.library.artists, icon: User },
          { key: 'genres', label: t.library.genres, icon: Radio },
          { key: 'folders', label: t.library.folders, icon: Folder },
          { key: 'years', label: 'Years', icon: Calendar },
        ] as { key: LibraryCategory; label: string; icon: any }[]).map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
              {cat.key === 'folders' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                  {folders.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Sorting Sub-header (only when on tracks tab) */}
      {activeCategory === 'tracks' && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-zinc-900/70 border border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Source:</span>
            {(['ALL', 'LOCAL', 'RECEIVED', 'IMPORTED'] as SourceFilter[]).map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  sourceFilter === src
                    ? 'bg-white/20 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                if (filteredTracks.length > 0) onPlayTrack(filteredTracks[0]);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => {
                const fields: SortField[] = ['title', 'artist', 'duration', 'year', 'playCount'];
                const next = fields[(fields.indexOf(sortField) + 1) % fields.length];
                setSortField(next);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3 text-zinc-400" />
              <span className="capitalize">{sortField} ({sortAsc ? 'A-Z' : 'Z-A'})</span>
            </button>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-xs cursor-pointer"
              title="Toggle Ascending/Descending"
            >
              {sortAsc ? '↓' : '↑'}
            </button>
          </div>
        </div>
      )}

      {/* -------------------- TRACKS VIEW -------------------- */}
      {activeCategory === 'tracks' && (
        <div className="relative">
          {filteredTracks.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
              <Music className="w-10 h-10 text-zinc-500 mx-auto" />
              {tracks.length === 0 ? (
                <>
                  <p className="text-sm font-bold text-white">{t.library.emptyTitle}</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {t.library.emptySubtitle}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setIsFolderScannerOpen(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer"
                    >
                      {t.library.scanAudio}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                    >
                      {t.library.importFiles}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-zinc-300">No tracks match your current filter</p>
                  <button
                    onClick={() => setSourceFilter('ALL')}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Songs List */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {filteredTracks.map((track, idx) => {
                  const currentLetter = getTrackIndexLetter(sortField === 'artist' ? track.artist : track.title);
                  const prevLetter = idx > 0 ? getTrackIndexLetter(sortField === 'artist' ? filteredTracks[idx - 1].artist : filteredTracks[idx - 1].title) : null;
                  const isNewLetterSection = (sortField === 'title' || sortField === 'artist') && (idx === 0 || currentLetter !== prevLetter);

                  return (
                    <React.Fragment key={track.id}>
                      {/* Section Letter Sticky Divider */}
                      {isNewLetterSection && (
                        <div
                          id={`letter-section-${currentLetter}`}
                          className="sticky top-0 z-10 pt-2 pb-1.5 bg-black/85 backdrop-blur-md flex items-center gap-2.5 transition-all"
                        >
                          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-black text-xs flex items-center justify-center font-['Syne',sans-serif] shadow-sm shadow-cyan-500/20">
                            {currentLetter}
                          </div>
                          <div className="h-px bg-gradient-to-r from-cyan-500/30 via-white/10 to-transparent flex-1" />
                        </div>
                      )}

                      <div
                        id={`track-item-${track.id}`}
                        className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-white/5 hover:border-cyan-500/30 transition duration-200 shadow-sm hover:shadow-cyan-500/5 backdrop-blur-sm"
                      >
                        {/* Left Play Area */}
                        <div
                          onClick={() => onPlayTrack(track)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200 border border-white/10"
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
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                              <div className="w-7 h-7 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-3.5 h-3.5 fill-black translate-x-0.5" />
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors font-['Syne',sans-serif]">
                                {track.title}
                              </p>
                              {track.bitrate?.includes('Lossless') || track.bitrate?.includes('32-Bit') ? (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 tracking-wider">
                                  HI-RES
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10 flex-shrink-0">
                                  {track.format}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-zinc-400 truncate font-medium">
                                {track.artist} <span className="text-zinc-600">•</span> {track.album}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Metadata & Options Menu Button */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <span className="text-[11px] font-mono text-zinc-500 font-medium px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5">
                            {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                          </span>

                          <button
                            onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Context Menu Dropdown */}
                        {activeMenuTrackId === track.id && (
                          <div className="absolute right-4 top-12 z-20 w-52 p-1.5 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-0.5 animate-in fade-in">
                            <button
                              onClick={() => {
                                onPlayNext(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Play Next</span>
                            </button>

                            <button
                              onClick={() => {
                                onAddToQueue(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-purple-400" />
                              <span>Add to Queue</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowPlaylistSelectorForTrack(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Disc className="w-3.5 h-3.5 text-pink-400" />
                              <span>Add to Playlist...</span>
                            </button>

                            <button
                              onClick={() => {
                                onOpenTagEditor(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Tags className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Edit ID3 Tags</span>
                            </button>

                            <button
                              onClick={() => {
                                onOpenAudioTrimmer(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Scissors className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ringtone Cutter</span>
                            </button>

                            <button
                              onClick={() => {
                                onOpenP2PWithTrack(track);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Send to Phone (PIN / QR)</span>
                            </button>

                            <button
                              onClick={async () => {
                                setActiveMenuTrackId(null);
                                await shareTrackViaNativeOS(track);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Share via WhatsApp / Phone Apps</span>
                            </button>

                            <button
                              onClick={async () => {
                                setActiveMenuTrackId(null);
                                await downloadTrackToDevice(track);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Save Song to Downloads Folder</span>
                            </button>

                            <div className="h-px bg-white/10 my-1" />

                            <button
                              onClick={() => {
                                onDeleteTrack(track.id);
                                setActiveMenuTrackId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 text-left transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete from Library</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* A-Z Fast Scroller on the right side */}
              <div className="flex-shrink-0 sticky top-4 self-start">
                <AlphabetScroller
                  availableLetters={availableLetters}
                  activeLetter={activeLetter}
                  onSelectLetter={handleSelectLetter}
                  onScrollToTop={handleScrollToTop}
                  showScrollToTop={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- FOLDERS VIEW & FILE MANAGER -------------------- */}
      {activeCategory === 'folders' && (
        <FoldersBrowser
          tracks={tracks}
          playlists={playlists}
          onPlayTrack={onPlayTrack}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAudioTrimmer={onOpenAudioTrimmer}
          onOpenP2PWithTrack={onOpenP2PWithTrack}
          onDeleteTrack={onDeleteTrack}
          onImportTrack={onImportTrack}
          onImportMultipleTracks={onImportMultipleTracks}
        />
      )}

      {/* -------------------- ALBUMS VIEW -------------------- */}
      {activeCategory === 'albums' && (
        <AlbumsBrowser
          tracks={tracks}
          playlists={playlists}
          onPlayTrack={onPlayTrack}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAudioTrimmer={onOpenAudioTrimmer}
          onOpenP2PWithTrack={onOpenP2PWithTrack}
          onDeleteTrack={onDeleteTrack}
        />
      )}

      {/* -------------------- ARTISTS VIEW -------------------- */}
      {activeCategory === 'artists' && (
        <ArtistsBrowser
          tracks={tracks}
          playlists={playlists}
          onPlayTrack={onPlayTrack}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAudioTrimmer={onOpenAudioTrimmer}
          onOpenP2PWithTrack={onOpenP2PWithTrack}
          onDeleteTrack={onDeleteTrack}
          onSelectAlbum={() => {
            setActiveCategory('albums');
          }}
        />
      )}

      {/* -------------------- GENRES VIEW -------------------- */}
      {activeCategory === 'genres' && (
        <GenresBrowser
          tracks={tracks}
          playlists={playlists}
          onPlayTrack={onPlayTrack}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
          onOpenTagEditor={onOpenTagEditor}
          onOpenAudioTrimmer={onOpenAudioTrimmer}
          onOpenP2PWithTrack={onOpenP2PWithTrack}
          onDeleteTrack={onDeleteTrack}
        />
      )}

      {/* -------------------- YEARS VIEW -------------------- */}
      {activeCategory === 'years' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {years.map((yearNum) => {
            const yearTracks = tracks.filter(t => t.year === yearNum);
            return (
              <div
                key={yearNum}
                onClick={() => onPlayTrack(yearTracks[0] || tracks[0])}
                className="p-4 rounded-3xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition hover:-translate-y-1 shadow-md space-y-1.5"
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-extrabold text-white">{yearNum}</h4>
                <p className="text-[11px] text-zinc-400">{yearTracks.length} tracks</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add To Playlist Selector Dialog */}
      {showPlaylistSelectorForTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-zinc-950 border border-white/15 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Add "{showPlaylistSelectorForTrack.title}" to Playlist</h3>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    onAddToPlaylist(showPlaylistSelectorForTrack.id, pl.id);
                    setShowPlaylistSelectorForTrack(null);
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left text-xs font-bold text-white transition flex items-center justify-between cursor-pointer"
                >
                  <span>{pl.name}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">{pl.trackIds.length} tracks</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlaylistSelectorForTrack(null)}
              className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Advanced Folder Scanner Modal */}
      <FolderScannerModal
        isOpen={isFolderScannerOpen}
        onClose={() => setIsFolderScannerOpen(false)}
        onImportTracks={handleBatchImportDiscovered}
        existingTrackCount={tracks.length}
      />
    </div>
  );
};

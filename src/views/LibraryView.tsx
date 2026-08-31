import React, { useState, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Track, Playlist } from '../types';
import { downloadTrackToDevice, shareTrackViaNativeOS } from '../utils/audioTransfer';
import { AUDIO_ACCEPT_STRING, convertFileToTrack, isAudioFile } from '../utils/fileScanner';
import { FolderScannerModal } from '../components/FolderScannerModal';
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
}

type LibraryCategory = 'tracks' | 'albums' | 'artists' | 'genres' | 'folders' | 'years';
type SourceFilter = 'ALL' | 'LOCAL' | 'RECEIVED' | 'IMPORTED';
type SortField = 'title' | 'artist' | 'duration' | 'year' | 'playCount';
type StorageDriveFilter = 'ALL' | 'INTERNAL' | 'SDCARD' | 'TRANSFERS';

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
        <div className="space-y-1.5">
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
            filteredTracks.map((track) => (
              <div
                key={track.id}
                className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-indigo-500/30 transition shadow-sm"
              >
                {/* Left Play Area */}
                <div
                  onClick={() => onPlayTrack(track)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition"
                    style={{
                      background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                    }}
                  >
                    <Play className="w-5 h-5 fill-white text-white drop-shadow" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                        {track.title}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10 flex-shrink-0">
                        {track.format}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                      {track.artist} • {track.album} • {track.genre}
                    </p>
                  </div>
                </div>

                {/* Right Metadata & Options Menu Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
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
            ))
          )}
        </div>
      )}

      {/* -------------------- FOLDERS VIEW & FILE MANAGER -------------------- */}
      {activeCategory === 'folders' && (
        <div className="space-y-4">
          {/* Sub-view: Selected Folder Detailed File Explorer */}
          {selectedFolder ? (
            <div className="space-y-3">
              {/* Back to Folders Button & Breadcrumb */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Back to All Folders</span>
                </button>

                <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                  {selectedFolder}
                </span>
              </div>

              {/* Folder Header Card */}
              {(() => {
                const folderTracks = tracks.filter(t => getTrackFolderPath(t) === selectedFolder);
                const totalBytes = folderTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
                const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);
                const flacCount = folderTracks.filter(t => t.format === 'FLAC' || t.format === 'WAV').length;
                const folderName = selectedFolder.split('/').filter(Boolean).pop() || 'Music';

                return (
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-3 shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg">
                          <FolderOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <span>{folderName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {folderTracks.length} Files
                            </span>
                          </h3>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5 break-all">
                            {selectedFolder}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-zinc-300 font-medium">
                        Total Size: {sizeMb} MB
                      </span>
                      {flacCount > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          {flacCount} Lossless Hi-Res Tracks
                        </span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={() => handlePlayFolderAll(selectedFolder, false)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition active:scale-95 shadow cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play Folder</span>
                      </button>

                      <button
                        onClick={() => handlePlayFolderAll(selectedFolder, true)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Shuffle</span>
                      </button>

                      <button
                        onClick={() => {
                          folderTracks.forEach(t => onAddToQueue(t));
                        }}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Add All to Queue</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Tracks Inside Selected Folder */}
              <div className="space-y-1.5">
                {tracks
                  .filter(t => getTrackFolderPath(t) === selectedFolder)
                  .map((track, idx) => (
                    <div
                      key={track.id}
                      className="group relative flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-amber-500/30 transition shadow-sm"
                    >
                      <div
                        onClick={() => onPlayTrack(track)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                      >
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0">
                          {idx + 1}
                        </span>

                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow relative overflow-hidden flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                          }}
                        >
                          <Play className="w-4 h-4 fill-white text-white drop-shadow" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                              {track.title}
                            </p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10 flex-shrink-0">
                              {track.format}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                            {track.artist} • {track.album} • {track.bitrate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                          {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                        </span>

                        <button
                          onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Context Menu */}
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
                              onOpenTagEditor(track);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition cursor-pointer"
                          >
                            <Tags className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Edit Tags</span>
                          </button>
                          <button
                            onClick={() => {
                              onDeleteTrack(track.id);
                              setActiveMenuTrackId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 text-left transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Main Folders Directory Browser & Drive Overview */
            <div className="space-y-3">
              {/* Storage Drive Filter & Search Header */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1">Drive:</span>
                    {(['ALL', 'INTERNAL', 'SDCARD', 'TRANSFERS'] as StorageDriveFilter[]).map((drive) => (
                      <button
                        key={drive}
                        onClick={() => setStorageDriveFilter(drive)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          storageDriveFilter === drive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {drive === 'ALL' && 'All Storage'}
                        {drive === 'INTERNAL' && 'Internal Storage'}
                        {drive === 'SDCARD' && 'SD Card'}
                        {drive === 'TRANSFERS' && 'Transfers'}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-zinc-400">
                    {displayedFolders.length} Folders
                  </span>
                </div>

                {/* Search in Folders */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={folderSearchTerm}
                    onChange={(e) => setFolderSearchTerm(e.target.value)}
                    placeholder="Search folders..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  {folderSearchTerm && (
                    <button
                      onClick={() => setFolderSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Folder Cards List */}
              <div className="space-y-2">
                {displayedFolders.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-3xl border border-white/5 space-y-3">
                    <Folder className="w-10 h-10 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-400 font-medium">No folders found matching your filter</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setStorageDriveFilter('ALL');
                          setFolderSearchTerm('');
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  displayedFolders.map((folderPath) => {
                    const folderTracks = tracks.filter(t => getTrackFolderPath(t) === folderPath);
                    const folderName = folderPath.split('/').filter(Boolean).pop() || 'Music';
                    const isSdCard = folderPath.includes('sdcard');
                    const isTransfer = folderPath.includes('AuraTransfer') || folderPath.includes('Received');
                    const totalBytes = folderTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 8000000), 0);
                    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);
                    const formats = Array.from(new Set(folderTracks.map(t => t.format)));

                    return (
                      <div
                        key={folderPath}
                        className="group p-3.5 rounded-2xl bg-zinc-900 border border-white/10 hover:border-amber-500/40 transition flex items-center justify-between gap-3 shadow-md"
                      >
                        {/* Folder Info & Click to open */}
                        <div
                          onClick={() => setSelectedFolder(folderPath)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition flex-shrink-0">
                            <Folder className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                                {folderName}
                              </h4>
                              {isSdCard && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                                  SD Card
                                </span>
                              )}
                              {isTransfer && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                                  Received
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-zinc-400 truncate font-mono mt-0.5">
                              {folderPath}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold text-zinc-300">
                                {folderTracks.length} tracks ({sizeMb} MB)
                              </span>
                              <div className="flex items-center gap-1">
                                {formats.map(fmt => (
                                  <span key={fmt} className="text-[8px] font-bold px-1 rounded bg-white/5 text-zinc-400 border border-white/5">
                                    {fmt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handlePlayFolderAll(folderPath, false)}
                            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition active:scale-95 shadow cursor-pointer"
                            title="Play all tracks in folder"
                          >
                            <Play className="w-3.5 h-3.5 fill-black" />
                          </button>

                          <button
                            onClick={() => setSelectedFolder(folderPath)}
                            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Browse folder tracks"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- ALBUMS VIEW -------------------- */}
      {activeCategory === 'albums' && (
        <div className="space-y-3">
          {selectedAlbum ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>Back to All Albums</span>
              </button>

              {(() => {
                const albumTracks = tracks.filter(t => t.album === selectedAlbum);
                const first = albumTracks[0] || tracks[0];
                return (
                  <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                        }}
                      >
                        <Disc className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedAlbum}</h3>
                        <p className="text-xs text-zinc-400">{first?.artist} • {albumTracks.length} tracks</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPlayTrack(first)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Album</span>
                    </button>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                {tracks
                  .filter(t => t.album === selectedAlbum)
                  .map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className="p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{track.artist} • {track.format}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {albums.map((albumName) => {
                const albumTracks = tracks.filter(t => t.album === albumName);
                const first = albumTracks[0] || tracks[0];
                return (
                  <div
                    key={albumName}
                    onClick={() => setSelectedAlbum(albumName)}
                    className="p-4 rounded-3xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition hover:-translate-y-1 shadow-md space-y-2"
                  >
                    <div
                      className="w-full aspect-square rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                      }}
                    >
                      <Disc className="w-10 h-10 text-white/80" />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{albumName}</h4>
                    <p className="text-[11px] text-zinc-400 truncate">{first?.artist} • {albumTracks.length} tracks</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- ARTISTS VIEW -------------------- */}
      {activeCategory === 'artists' && (
        <div className="space-y-3">
          {selectedArtist ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedArtist(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>Back to All Artists</span>
              </button>

              {(() => {
                const artistTracks = tracks.filter(t => t.artist === selectedArtist);
                const first = artistTracks[0] || tracks[0];
                return (
                  <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                        }}
                      >
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedArtist}</h3>
                        <p className="text-xs text-zinc-400">{artistTracks.length} songs in library</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPlayTrack(first)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Artist</span>
                    </button>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                {tracks
                  .filter(t => t.artist === selectedArtist)
                  .map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className="p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{track.album} • {track.format}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artists.map((artistName) => {
                const artistTracks = tracks.filter(t => t.artist === artistName);
                const first = artistTracks[0] || tracks[0];
                return (
                  <div
                    key={artistName}
                    onClick={() => setSelectedArtist(artistName)}
                    className="p-4 rounded-3xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition hover:-translate-y-1 shadow-md flex flex-col items-center text-center space-y-2"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                      }}
                    >
                      <User className="w-8 h-8 text-white/90" />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate w-full">{artistName}</h4>
                    <p className="text-[11px] text-zinc-400">{artistTracks.length} tracks</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- GENRES VIEW -------------------- */}
      {activeCategory === 'genres' && (
        <div className="space-y-3">
          {selectedGenre ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedGenre(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>Back to All Genres</span>
              </button>

              <div className="space-y-1.5">
                {tracks
                  .filter(t => t.genre === selectedGenre)
                  .map((track, idx) => (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className="p-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{track.artist} • {track.album}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {genres.map((genreName) => {
                const genreTracks = tracks.filter(t => t.genre === genreName);
                const first = genreTracks[0] || tracks[0];
                return (
                  <div
                    key={genreName}
                    onClick={() => setSelectedGenre(genreName)}
                    className="p-4 rounded-3xl bg-zinc-900 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition hover:-translate-y-1 shadow-md space-y-2"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                      style={{
                        background: `linear-gradient(135deg, ${first?.coverGradient?.[0] || '#4f46e5'}, ${first?.coverGradient?.[1] || '#9333ea'})`
                      }}
                    >
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{genreName}</h4>
                    <p className="text-[11px] text-zinc-400">{genreTracks.length} tracks</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

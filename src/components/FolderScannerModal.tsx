import React, { useState, useRef } from 'react';
import { 
  X, 
  FolderSearch, 
  FolderPlus, 
  Upload, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Check, 
  RefreshCw,
  Sliders,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { Track } from '../types';
import { 
  AUDIO_ACCEPT_STRING, 
  convertFileToTrack, 
  isAudioFile, 
  scanDirectoryPickerRecursively,
  scanDataTransferItemsRecursively
} from '../utils/fileScanner';

interface FolderScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTracks: (tracks: Track[], itemsWithBlobs?: { track: Track; blob: Blob | File }[]) => void;
  existingTrackCount: number;
}

export const FolderScannerModal: React.FC<FolderScannerModalProps> = ({
  isOpen,
  onClose,
  onImportTracks,
  existingTrackCount,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Ready to scan');
  const [discoveredTracks, setDiscoveredTracks] = useState<Track[]>([]);
  const [discoveredBlobs, setDiscoveredBlobs] = useState<{ track: Track; blob: File }[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [filterOutShortAudio, setFilterOutShortAudio] = useState(false); // Default to false so no songs are missed
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Process raw File array into Track objects
  const processFilesBatch = async (files: File[]) => {
    if (files.length === 0) {
      setStatusMessage({ type: 'error', text: 'No files were selected.' });
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setProgressPercent(10);
    setScanStatus(`Scanning ${files.length} file(s)...`);

    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length === 0) {
      // If extension filtering was too strict, allow all files that might be audio
      const potentialAudios = files.filter(f => f.size > 10000);
      if (potentialAudios.length > 0) {
        audioFiles.push(...potentialAudios);
      } else {
        setStatusMessage({ type: 'error', text: 'No audio tracks found. Please select an audio or music folder.' });
        setIsScanning(false);
        return;
      }
    }

    const converted: Track[] = [];
    const blobItems: { track: Track; blob: File }[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      setScanStatus(`Reading ${file.name} (${i + 1}/${audioFiles.length})`);
      setProgressPercent(Math.round(10 + ((i + 1) / audioFiles.length) * 85));

      try {
        const track = await convertFileToTrack(file, existingTrackCount + i);
        if (!filterOutShortAudio || track.duration >= 15) {
          converted.push(track);
          blobItems.push({ track, blob: file });
        }
      } catch (err) {
        console.warn('Could not parse track file:', file.name, err);
      }
    }

    setProgressPercent(100);
    setDiscoveredTracks(converted);
    setDiscoveredBlobs(blobItems);
    setIsScanning(false);
    setScanStatus(`Found ${converted.length} songs`);

    if (converted.length > 0) {
      // Auto-import immediately so the user doesn't have to guess or click twice
      onImportTracks(converted, blobItems);
      setStatusMessage({
        type: 'success',
        text: `Successfully added ${converted.length} songs to your library!`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: 'No playable audio files were found in the selected folder.'
      });
    }
  };

  // 1. HTML5 Folder Input (WebKitDirectory)
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStatusMessage(null);
    const fileList = Array.from(files);
    await processFilesBatch(fileList);
  };

  // 2. HTML5 Multiple File Input
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setStatusMessage(null);
    const fileList = Array.from(files);
    await processFilesBatch(fileList);
  };

  // 3. Folder Picker with Iframe-safe fallback
  const handleNativeDirectoryPicker = async () => {
    setStatusMessage(null);

    const isIframe = window !== window.top;
    if (isIframe || !('showDirectoryPicker' in window)) {
      // In iframes, browsers require standard input directory selection
      folderInputRef.current?.click();
      return;
    }

    setIsScanning(true);
    setProgressPercent(5);
    setScanStatus('Scanning folder and subfolders recursively...');

    try {
      const files = await scanDirectoryPickerRecursively((count, folder) => {
        setScanStatus(`Scanning "${folder}"... (${count} songs found)`);
      });
      await processFilesBatch(files);
    } catch (err: any) {
      if (err.message === 'IFRAME_DIRECTORY_PICKER_NOT_ALLOWED' || err.name === 'SecurityError') {
        setIsScanning(false);
        folderInputRef.current?.click();
      } else if (err.name !== 'AbortError') {
        setIsScanning(false);
        folderInputRef.current?.click();
      } else {
        setIsScanning(false);
        setScanStatus('Ready to scan');
      }
    }
  };

  // 4. Drag & Drop Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setStatusMessage(null);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsScanning(true);
    setScanStatus('Scanning dropped folders and files...');

    try {
      const files = await scanDataTransferItemsRecursively(items);
      await processFilesBatch(files);
    } catch (err: any) {
      console.error('Drop error:', err);
      setStatusMessage({ type: 'error', text: 'Failed to process dropped folder: ' + err.message });
      setIsScanning(false);
    }
  };

  // Final Import Action
  const handleConfirmImport = () => {
    if (discoveredTracks.length === 0) return;
    onImportTracks(discoveredTracks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-2xl bg-black/85">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FolderSearch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-none">Auto-Scan Music Folder</h2>
              <p className="text-[11px] text-zinc-400 mt-1">Deep recursive scan for all audio formats and subfolders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderInputChange}
          // @ts-ignore
          webkitdirectory="true"
          directory="true"
          multiple
          className="hidden"
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          accept={AUDIO_ACCEPT_STRING}
          className="hidden"
        />

        {/* Status Notification */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between border-b ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' 
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
              : 'bg-zinc-900 text-zinc-300 border-white/10'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              )}
              <span className="truncate">{statusMessage.text}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white ml-2 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-3 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-white/15 bg-zinc-900/60 hover:bg-zinc-900/90'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FolderPlus className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Drag & Drop Music Folder or Audio Files Here
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Supports MP3, FLAC, WAV, AAC, M4A, OGG, OPUS, WMA & Lossless audio
              </p>
            </div>

            {/* Direct Action Trigger Buttons */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={handleNativeDirectoryPicker}
                disabled={isScanning}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <FolderSearch className="w-3.5 h-3.5" />
                <span>Select Entire Music Folder</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select Multiple Files</span>
              </button>
            </div>
          </div>

          {/* Scanner Filter Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300">Filter out short audio clips (&lt; 25s ringtones/system sounds)</span>
            </div>
            <input
              type="checkbox"
              checked={filterOutShortAudio}
              onChange={(e) => setFilterOutShortAudio(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Progress Indicator */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-indigo-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{scanStatus}</span>
                </div>
                <span className="font-mono text-zinc-400">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Discovered Tracks Preview */}
          {discoveredTracks.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase text-indigo-400">
                  Discovered Songs ({discoveredTracks.length})
                </span>
                <span className="text-[11px] text-zinc-400">
                  Ready to add to library
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {discoveredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${track.coverGradient[0]}, ${track.coverGradient[1]})`
                        }}
                      >
                        <Music className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{track.title}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{track.artist} • {track.album}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                        {track.format}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {Math.floor(track.duration / 60)}:{((track.duration % 60) < 10 ? '0' : '') + (track.duration % 60)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer with Import Button */}
        {discoveredTracks.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-zinc-900/80 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {discoveredTracks.length} song(s) will be added to your library.
            </span>

            <button
              onClick={handleConfirmImport}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Import All {discoveredTracks.length} Songs</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

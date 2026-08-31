import { Track } from '../types';

// Supported audio file extensions (all standard and lossless formats)
export const AUDIO_EXTENSIONS = [
  'mp3', 'flac', 'wav', 'aac', 'm4a', 'ogg', 'oga', 'opus', 
  'wma', 'alac', 'aiff', 'aif', 'webm', 'ape', 'wv', 'mka', 'caf',
  'm4b', 'm4p', '3gp', 'amr', 'mid', 'midi', 'dsf', 'dff', 'mp2', 'mp1'
];

export const AUDIO_ACCEPT_STRING = 
  'audio/*,.mp3,.flac,.wav,.aac,.m4a,.ogg,.oga,.opus,.wma,.alac,.aiff,.aif,.webm,.ape,.wv,.mka,.caf,.m4b,.3gp,.amr,.mid,.midi,.dsf,.dff,*/*';

// Check if a file is an audio file by extension or mime type
export const isAudioFile = (file: File | { name: string; type?: string }): boolean => {
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop() || '';
  if (AUDIO_EXTENSIONS.includes(ext)) {
    return true;
  }
  if (file.type) {
    const t = file.type.toLowerCase();
    if (t.startsWith('audio/') || t.includes('ogg') || t.includes('webm') || t.includes('flac') || t.includes('wav') || t.includes('mp4')) {
      return true;
    }
  }
  return false;
};

// Generate vivid gradient based on track name
export const generateTrackGradient = (title: string, artist: string): [string, string] => {
  const palettes: [string, string][] = [
    ['#3b82f6', '#1d4ed8'],
    ['#8b5cf6', '#6d28d9'],
    ['#ec4899', '#be185d'],
    ['#10b981', '#047857'],
    ['#f59e0b', '#b45309'],
    ['#06b6d4', '#0e7490'],
    ['#6366f1', '#4338ca'],
    ['#f43f5e', '#be123c'],
    ['#14b8a6', '#0f766e'],
    ['#eab308', '#a16207'],
  ];
  const charCodeSum = (title + artist).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palettes[charCodeSum % palettes.length];
};

// Parse clean title, artist, album, and track number from filename and relative folder path
export const parseAudioMetadataFromPath = (file: File): {
  title: string;
  artist: string;
  album: string;
  trackNumber: number;
  folderPath: string;
  format: 'FLAC' | 'MP3' | 'WAV' | 'AAC' | 'M4A' | 'OPUS';
} => {
  const relativePath = (file as any).webkitRelativePath || file.name;
  const pathParts = relativePath.split('/').filter(Boolean);
  
  const rawFileName = pathParts[pathParts.length - 1] || file.name;
  const ext = rawFileName.split('.').pop()?.toUpperCase() as any || 'MP3';
  const validFormat = ['FLAC', 'MP3', 'WAV', 'AAC', 'M4A', 'OPUS'].includes(ext) ? ext : 'MP3';

  // Base name without extension
  let baseName = rawFileName.replace(/\.[^/.]+$/, '').trim();

  let trackNumber = 1;
  let artist = 'Local Artist';
  let album = 'Local Audio';
  let folderPath = '/storage/emulated/0/Music';

  // Derive folder path
  if (pathParts.length > 1) {
    folderPath = '/' + pathParts.slice(0, -1).join('/');
    // If standard Artist/Album folder structure
    if (pathParts.length >= 3) {
      artist = pathParts[pathParts.length - 3].replace(/^[0-9]+[\s._-]+/, '').trim();
      album = pathParts[pathParts.length - 2].replace(/^[0-9]+[\s._-]+/, '').trim();
    } else if (pathParts.length === 2) {
      album = pathParts[0].replace(/^[0-9]+[\s._-]+/, '').trim();
    }
  }

  // Check if filename starts with track number (e.g., "01 - Title", "01. Title", "01 Title")
  const trackNumMatch = baseName.match(/^(\d{1,3})[\s._-]+(.*)$/);
  if (trackNumMatch) {
    trackNumber = parseInt(trackNumMatch[1], 10);
    baseName = trackNumMatch[2].trim();
  }

  // Check if filename contains "Artist - Title" or "Artist - Album - Title"
  let title = baseName;
  if (baseName.includes(' - ')) {
    const segments = baseName.split(' - ').map((s: string) => s.trim()).filter(Boolean);
    if (segments.length === 2) {
      artist = segments[0];
      title = segments[1];
    } else if (segments.length >= 3) {
      artist = segments[0];
      album = segments[1];
      title = segments.slice(2).join(' - ');
    }
  } else if (baseName.includes('_') && !baseName.includes(' ')) {
    title = baseName.replace(/_/g, ' ');
  }

  return {
    title: title || 'Unknown Title',
    artist: artist || 'Local Artist',
    album: album || 'Local Audio',
    trackNumber,
    folderPath,
    format: validFormat,
  };
};

// Probe audio file duration using temporary Audio element
export const probeAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      
      const cleanUp = () => {
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
      };

      const onLoaded = () => {
        cleanUp();
        const dur = Math.round(audio.duration);
        resolve(dur > 0 && isFinite(dur) ? dur : 180);
      };

      const onError = () => {
        cleanUp();
        // Fallback default duration
        resolve(180 + Math.floor(Math.random() * 60));
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);
      audio.src = url;

      // Timeout safety
      setTimeout(() => {
        cleanUp();
        resolve(180);
      }, 1500);
    } catch {
      resolve(180);
    }
  });
};

// Convert a single File into a complete Track model
export const convertFileToTrack = async (file: File, indexOffset = 0): Promise<Track> => {
  const metadata = parseAudioMetadataFromPath(file);
  const duration = await probeAudioDuration(file);
  const audioBlobUrl = URL.createObjectURL(file);

  return {
    id: `local-file-${Date.now()}-${indexOffset}-${Math.random().toString(36).slice(2, 7)}`,
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    duration: duration,
    audioUrl: audioBlobUrl,
    source: 'IMPORTED',
    format: metadata.format,
    bitrate: metadata.format === 'FLAC' || metadata.format === 'WAV' ? '1411 kbps Lossless' : '320 kbps High Quality',
    sampleRate: metadata.format === 'FLAC' ? '96kHz / 24-bit' : '44.1kHz / 16-bit',
    genre: 'Local Music',
    year: new Date().getFullYear(),
    trackNumber: metadata.trackNumber || (indexOffset + 1),
    playCount: 0,
    skipCount: 0,
    dateAdded: Date.now(),
    isFavorite: false,
    coverGradient: generateTrackGradient(metadata.title, metadata.artist),
    folderPath: metadata.folderPath,
    fileSizeBytes: file.size || 8500000,
    lyricsLrc: `[00:00.00]${metadata.title} - ${metadata.artist}\n[00:05.00]Local Audio Storage Playback`,
  };
};

export const convertFilesBatchWithBlobs = async (
  files: File[], 
  existingTrackCount = 0,
  filterShort = false,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ track: Track; blob: File }[]> => {
  const results: { track: Track; blob: File }[] = [];
  const audioFiles = files.filter(isAudioFile);

  for (let i = 0; i < audioFiles.length; i++) {
    const file = audioFiles[i];
    onProgress?.(i + 1, audioFiles.length, file.name);
    try {
      const track = await convertFileToTrack(file, existingTrackCount + i);
      if (!filterShort || track.duration >= 20) {
        results.push({ track, blob: file });
      }
    } catch (err) {
      console.warn('Error converting file:', file.name, err);
    }
  }

  return results;
};

// Deep recursive scan using File System Access API (showDirectoryPicker) with safe iframe fallback
export const scanDirectoryPickerRecursively = async (
  onProgress?: (count: number, currentFolderName: string) => void
): Promise<File[]> => {
  // Check if running in a cross-origin iframe where showDirectoryPicker is blocked by browser security
  const isIframe = window !== window.top;
  if (isIframe || !('showDirectoryPicker' in window)) {
    throw new Error('IFRAME_DIRECTORY_PICKER_NOT_ALLOWED');
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    const collectedFiles: File[] = [];

    const readDir = async (handle: any, currentPath: string) => {
      onProgress?.(collectedFiles.length, currentPath || handle.name);

      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (isAudioFile(file)) {
            // Attach relative path for metadata extraction
            Object.defineProperty(file, 'webkitRelativePath', {
              value: `${currentPath ? currentPath + '/' : ''}${file.name}`,
              writable: false,
            });
            collectedFiles.push(file);
          }
        } else if (entry.kind === 'directory') {
          const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          await readDir(entry, nextPath);
        }
      }
    };

    await readDir(dirHandle, dirHandle.name);
    return collectedFiles;
  } catch (err: any) {
    if (err.name === 'SecurityError' || err.message?.includes('Cross origin sub frames') || err.message?.includes('file picker')) {
      throw new Error('IFRAME_DIRECTORY_PICKER_NOT_ALLOWED');
    }
    throw err;
  }
};

// Traverse Drag-and-Drop DataTransferItemList entries recursively
export const scanDataTransferItemsRecursively = async (
  items: DataTransferItemList
): Promise<File[]> => {
  const audioFiles: File[] = [];

  const traverseEntry = async (entry: any, currentPath = ''): Promise<void> => {
    if (!entry) return;

    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => {
          if (isAudioFile(file)) {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: `${currentPath ? currentPath + '/' : ''}${file.name}`,
              writable: false,
            });
            audioFiles.push(file);
          }
          resolve();
        }, () => resolve());
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      const readEntries = async (): Promise<void> => {
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries: any[]) => {
            if (entries.length === 0) {
              resolve();
            } else {
              for (const childEntry of entries) {
                await traverseEntry(childEntry, nextPath);
              }
              await readEntries();
              resolve();
            }
          }, () => resolve());
        });
      };

      await readEntries();
    }
  };

  const promises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        promises.push(traverseEntry(entry, ''));
      }
    } else if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && isAudioFile(file)) {
        audioFiles.push(file);
      }
    }
  }

  await Promise.all(promises);
  return audioFiles;
};

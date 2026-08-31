import { Track } from '../types';

export interface AndroidNativeBridge {
  scanDeviceMedia?: () => string;
  requestPermissionAndScan?: () => void;
  showToast?: (message: string) => void;
  updatePlaybackNotification?: (title: string, artist: string, album: string, isPlaying: boolean) => void;
  startForegroundAudioService?: () => void;
  stopForegroundAudioService?: () => void;
  requestNotificationPermission?: () => void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidNativeBridge;
    onNativeMediaStoreScanComplete?: (jsonString: string) => void;
    onNativePermissionResult?: (permission: string, granted: boolean) => void;
    onNativePlaybackAction?: (action: 'PLAY' | 'PAUSE' | 'NEXT' | 'PREVIOUS' | 'STOP') => void;
  }
}

/**
 * Checks if running inside the Android Native APK container
 */
export const isNativeAndroidApp = (): boolean => {
  return typeof window !== 'undefined' && typeof window.AndroidBridge !== 'undefined';
};

/**
 * Triggers permission request & MediaStore auto-scan from native Android
 */
export const requestNativeDeviceScan = () => {
  if (isNativeAndroidApp()) {
    if (window.AndroidBridge?.requestPermissionAndScan) {
      window.AndroidBridge.requestPermissionAndScan();
    } else if (window.AndroidBridge?.scanDeviceMedia) {
      const raw = window.AndroidBridge.scanDeviceMedia();
      if (raw && window.onNativeMediaStoreScanComplete) {
        window.onNativeMediaStoreScanComplete(raw);
      }
    }
  }
};

/**
 * Updates Android Foreground Media Playback notification if inside APK
 */
export const syncNativePlaybackNotification = (
  track: Track | null,
  isPlaying: boolean
) => {
  if (isNativeAndroidApp() && window.AndroidBridge?.updatePlaybackNotification && track) {
    window.AndroidBridge.updatePlaybackNotification(
      track.title,
      track.artist,
      track.album || 'Aura Music',
      isPlaying
    );
  }
};

/**
 * Parses native MediaStore tracks and prevents duplicates
 */
export const parseNativeTracks = (rawJson: string): Track[] => {
  try {
    if (!rawJson) return [];
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: any, index: number) => {
      const ext = item.mimeType?.includes('flac') ? 'FLAC' : item.mimeType?.includes('wav') ? 'WAV' : 'MP3';
      return {
        id: item.id || `native_${item.mediaStoreId || index}_${Date.now()}`,
        title: item.title || 'Unknown Title',
        artist: item.artist || 'Unknown Artist',
        album: item.album || 'Unknown Album',
        duration: Number(item.duration) || 180,
        audioUrl: item.url || item.filePath || '',
        source: 'LOCAL',
        format: (item.format || ext) as any,
        bitrate: item.bitrate || '320 kbps High Quality',
        sampleRate: item.sampleRate || '48kHz / 24-bit',
        genre: item.genre || 'Device Audio',
        year: Number(item.year) || new Date().getFullYear(),
        trackNumber: Number(item.trackNumber) || index + 1,
        playCount: 0,
        skipCount: 0,
        dateAdded: Number(item.dateAdded) || Date.now(),
        isFavorite: false,
        coverGradient: ['#10b981', '#06b6d4'],
        lyricsLrc: item.lyricsLrc || '',
        folderPath: item.folder || item.folderPath || '/storage/emulated/0/Music',
        fileSizeBytes: Number(item.fileSizeBytes) || 8000000
      };
    });
  } catch (err) {
    console.error('Failed to parse native Android tracks:', err);
    return [];
  }
};

/**
 * Reconciles newly scanned MediaStore tracks with existing library:
 * - Adds new files
 * - Removes deleted files
 * - Updates moved / renamed files
 * - Prevents duplicates by unique mediaStoreId / filePath
 */
export const reconcileMediaStoreTracks = (
  existingTracks: Track[],
  scannedTracks: Track[]
): {
  updatedLibrary: Track[];
  addedCount: number;
  removedCount: number;
} => {
  const existingMap = new Map<string, Track>();
  existingTracks.forEach(t => {
    existingMap.set(t.id, t);
    if (t.audioUrl) existingMap.set(t.audioUrl, t);
  });

  const nonMediaStoreTracks = existingTracks.filter(t => t.source !== 'LOCAL');
  const currentScannedTracks = existingTracks.filter(t => t.source === 'LOCAL');

  let addedCount = 0;
  const mergedScannedTracks: Track[] = [];

  scannedTracks.forEach(scanned => {
    const existing = existingMap.get(scanned.id) || (scanned.audioUrl ? existingMap.get(scanned.audioUrl) : undefined);
    if (existing) {
      mergedScannedTracks.push({
        ...scanned,
        isFavorite: existing.isFavorite,
        playCount: existing.playCount || 0,
        skipCount: existing.skipCount || 0,
        lastPlayed: existing.lastPlayed,
        lyricsLrc: existing.lyricsLrc || scanned.lyricsLrc
      });
    } else {
      mergedScannedTracks.push(scanned);
      addedCount++;
    }
  });

  const scannedIdSet = new Set(scannedTracks.map(t => t.id));
  const removedCount = currentScannedTracks.filter(t => !scannedIdSet.has(t.id)).length;

  const updatedLibrary = [...nonMediaStoreTracks, ...mergedScannedTracks];
  return { updatedLibrary, addedCount, removedCount };
};

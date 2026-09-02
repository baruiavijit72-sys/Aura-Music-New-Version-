export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  audioUrl?: string; // audio asset or synthetic tone
  source: 'LOCAL' | 'RECEIVED' | 'IMPORTED';
  format: 'FLAC' | 'MP3' | 'WAV' | 'AAC' | 'M4A' | 'OPUS';
  bitrate: string; // e.g. "920 kbps Lossless"
  sampleRate: string; // e.g. "96kHz / 24-bit"
  genre: string;
  year: number;
  trackNumber: number;
  playCount: number;
  skipCount: number;
  lastPlayed?: number; // timestamp
  dateAdded: number;
  isFavorite: boolean;
  coverGradient: [string, string]; // hex gradient colors
  coverUrl?: string;
  lyricsLrc: string;
  folderPath: string;
  fileSizeBytes: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  isSmart: boolean;
  smartCriteria?: 'LIKED' | 'MOST_PLAYED' | 'RECENTLY_PLAYED' | 'RECENTLY_ADDED' | 'MOST_SKIPPED';
  trackIds: string[];
  createdAt: number;
  coverGradient?: [string, string];
  isPinned?: boolean;
}

export type PlaybackMode = 'SEQUENTIAL' | 'SHUFFLE' | 'REPEAT_ALL' | 'REPEAT_ONE';

export interface EqualizerSettings {
  isEnabled: boolean;
  preset: string;
  bands: number[]; // 10 bands values in dB (-12 to +12)
  bassBoost: number; // 0 to 100
  virtualizer3D: number; // 0 to 100
  trebleBoost: number; // 0 to 100
  volumeBoost: number; // 0 to 100
  balance: number; // -100 (Left) to +100 (Right)
  crossfadeSeconds: number; // 0 to 10s
  gaplessPlayback: boolean;
  replayGain: boolean;
  playbackSpeed: number; // 0.25x to 3.0x
  pitchShift: number; // -12 to +12 semitones
}

export interface P2PTransferLog {
  id: string;
  fileName: string;
  trackTitle: string;
  fileSizeBytes: number;
  speedMbps: number;
  progressPercent: number;
  direction: 'SENT' | 'RECEIVED';
  peerDeviceName: string;
  protocol: 'WIFI_DIRECT' | 'HOTSPOT' | 'BLUETOOTH_5';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  timestamp: number;
}

export interface P2PPeer {
  id: string;
  name: string;
  signalStrength: number; // 0-100
  protocol: 'WIFI_DIRECT' | 'HOTSPOT' | 'BLUETOOTH_5';
  ipAddress: string;
  isAvailable: boolean;
  avatarColor: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  authProvider: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' | 'PHONE' | 'GUEST';
  avatarUrl?: string;
  isCloudSyncEnabled: boolean;
  lastCloudBackup?: number;
  totalListeningSeconds: number;
}

export interface ListeningLogEntry {
  id: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  genre: string;
  timestamp: number;
  durationSeconds: number;
  completedPercent: number;
  isSkipped: boolean;
}

export type ThemeMode = 'OLED_BLACK' | 'DARK_MATERIAL' | 'LIGHT_AIR' | 'DYNAMIC_ALBUM_ART';

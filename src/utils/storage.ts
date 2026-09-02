import { Track, Playlist, P2PTransferLog, UserProfile, ListeningLogEntry, EqualizerSettings, ThemeMode } from '../types';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, INITIAL_TRANSFER_LOGS } from '../data/mockAudio';

const STORAGE_KEYS = {
  TRACKS: 'aura_tracks_v1',
  PLAYLISTS: 'aura_playlists_v1',
  TRANSFER_LOGS: 'aura_transfer_logs_v1',
  LISTENING_LOGS: 'aura_listening_logs_v1',
  PROFILE: 'aura_user_profile_v1',
  EQ_SETTINGS: 'aura_eq_settings_v1',
  THEME_MODE: 'aura_theme_mode_v1',
  FOLDER_BLACKLIST: 'aura_folder_blacklist_v1',
  DURATION_FILTER_MIN_SEC: 'aura_duration_filter_sec_v1',
};

export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  isEnabled: false,
  preset: 'Flat',
  bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: 0,
  virtualizer3D: 0,
  trebleBoost: 0,
  volumeBoost: 0,
  balance: 0,
  crossfadeSeconds: 2,
  gaplessPlayback: true,
  replayGain: true,
  playbackSpeed: 1.0,
  pitchShift: 0,
};

export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-guest-01',
  name: 'Alex Vance',
  email: 'alex.vance@auramusic.io',
  authProvider: 'GUEST',
  avatarUrl: '',
  isCloudSyncEnabled: true,
  lastCloudBackup: Date.now() - 3600000 * 5,
  totalListeningSeconds: 14280,
};

export const loadStoredTracks = (): Track[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKS);
    if (raw) {
      const stored: Track[] = JSON.parse(raw);
      // Remove any legacy demo tracks (track-1 through track-30 or soundhelix demo URLs)
      const userOnly = stored.filter(t => {
        if (!t || !t.id) return false;
        const isDemoId = /^track-\d+$/.test(t.id);
        const isDemoUrl = t.audioUrl && t.audioUrl.includes('soundhelix.com');
        return !isDemoId && !isDemoUrl;
      });

      if (userOnly.length > 0) {
        return userOnly;
      }
    }
  } catch (e) {
    console.error('Failed to load stored tracks', e);
  }
  return INITIAL_TRACKS;
};

export const saveStoredTracks = (tracks: Track[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
  } catch (e) {
    console.error('Failed to save tracks', e);
  }
};

export const loadStoredPlaylists = (): Playlist[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (raw) {
      const parsed: Playlist[] = JSON.parse(raw);
      const cleanPlaylists = parsed
        .filter(pl => pl && pl.id && !['pl-custom-1'].includes(pl.id))
        .map(pl => ({
          ...pl,
          trackIds: (pl.trackIds || []).filter(id => !/^track-\d+$/.test(id))
        }));
      if (cleanPlaylists.length > 0) {
        return cleanPlaylists;
      }
    }
  } catch (e) {
    console.error('Failed to load playlists', e);
  }
  return INITIAL_PLAYLISTS;
};

export const saveStoredPlaylists = (playlists: Playlist[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  } catch (e) {
    console.error('Failed to save playlists', e);
  }
};

export const loadStoredEQ = (): EqualizerSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQ_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load EQ settings', e);
  }
  return DEFAULT_EQ_SETTINGS;
};

export const saveStoredEQ = (eq: EqualizerSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.EQ_SETTINGS, JSON.stringify(eq));
  } catch (e) {
    console.error('Failed to save EQ settings', e);
  }
};

export const loadTransferLogs = (): P2PTransferLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFER_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transfer logs', e);
  }
  return INITIAL_TRANSFER_LOGS;
};

export const saveTransferLogs = (logs: P2PTransferLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSFER_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save transfer logs', e);
  }
};

export const loadListeningLogs = (): ListeningLogEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LISTENING_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load listening logs', e);
  }
  return [];
};

export const saveListeningLogs = (logs: ListeningLogEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LISTENING_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save listening logs', e);
  }
};

export const loadProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile', e);
  }
  return DEFAULT_PROFILE;
};

export const saveProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
};

export const loadThemeMode = (): ThemeMode => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (raw) return raw as ThemeMode;
  } catch (e) {
    // fallback
  }
  return 'OLED_BLACK';
};

export const saveThemeMode = (mode: ThemeMode) => {
  localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
};

export const exportAllDataJson = () => {
  const data = {
    tracks: loadStoredTracks(),
    playlists: loadStoredPlaylists(),
    eqSettings: loadStoredEQ(),
    transferLogs: loadTransferLogs(),
    listeningLogs: loadListeningLogs(),
    profile: loadProfile(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const restoreAllDataJson = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.tracks) saveStoredTracks(parsed.tracks);
    if (parsed.playlists) saveStoredPlaylists(parsed.playlists);
    if (parsed.eqSettings) saveStoredEQ(parsed.eqSettings);
    if (parsed.transferLogs) saveTransferLogs(parsed.transferLogs);
    if (parsed.listeningLogs) saveListeningLogs(parsed.listeningLogs);
    if (parsed.profile) saveProfile(parsed.profile);
    return true;
  } catch (e) {
    console.error('Restore error', e);
    return false;
  }
};

import { Track } from '../types';
import { syncNativePlaybackNotification } from './nativeBridge';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeekTo: (seconds: number) => void;
}

// Generate SVG canvas data URL for rich notification album artwork
function createCoverDataUrl(title: string, artist: string, gradientColors?: [string, string]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const c1 = gradientColors ? gradientColors[0] : '#6366f1';
  const c2 = gradientColors ? gradientColors[1] : '#a855f7';

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Decorative vinyl ring pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Center circle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.arc(256, 256, 70, 0, Math.PI * 2);
  ctx.fill();

  // Music Note Icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♫', 256, 256);

  // App & Track Title label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  
  const displayTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
  ctx.fillText(displayTitle, 256, 420);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const displayArtist = artist.length > 24 ? artist.substring(0, 22) + '...' : artist;
  ctx.fillText(displayArtist, 256, 460);

  return canvas.toDataURL('image/png');
}

let wakeLockSentinel: any = null;

/**
 * Request Screen / CPU WakeLock to ensure audio continues playing seamlessly in background
 */
export async function requestWakeLock(): Promise<void> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      if (!wakeLockSentinel) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
    } catch (e) {
      // WakeLock might not be granted in non-active tab or low power mode; safe to ignore
    }
  }
}

/**
 * Release wake lock when playback is stopped
 */
export function releaseWakeLock(): void {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch (e) {
      wakeLockSentinel = null;
    }
  }
}

/**
 * Updates the System Notification Bar & Lock Screen via MediaSession API
 */
export function updateSystemMediaSession(
  track: Track | null,
  isPlaying: boolean,
  callbacks: MediaSessionCallbacks
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    // Fallback sync with native Android Bridge if in APK
    if (track) {
      syncNativePlaybackNotification(track, isPlaying);
    }
    return;
  }

  if (!track) {
    navigator.mediaSession.playbackState = 'none';
    releaseWakeLock();
    return;
  }

  // Generate artwork for notification bar & lockscreen
  let artworkUrl = track.coverUrl;
  if (!artworkUrl || !artworkUrl.startsWith('http')) {
    try {
      artworkUrl = createCoverDataUrl(track.title, track.artist, track.coverGradient);
    } catch (e) {
      artworkUrl = '';
    }
  }

  const artworkList = artworkUrl
    ? [
        { src: artworkUrl, sizes: '96x96', type: 'image/png' },
        { src: artworkUrl, sizes: '128x128', type: 'image/png' },
        { src: artworkUrl, sizes: '192x192', type: 'image/png' },
        { src: artworkUrl, sizes: '256x256', type: 'image/png' },
        { src: artworkUrl, sizes: '512x512', type: 'image/png' },
      ]
    : [];

  // 1. Set System Metadata (Notification Title, Artist, Album, Art)
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Aura Track',
      artist: track.artist || 'Aura Music',
      album: track.album || 'Aura High-Res Audio',
      artwork: artworkList,
    });
  } catch (err) {
    console.warn('Failed to set mediaSession metadata:', err);
  }

  // 2. Set Playback State
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  // 3. Register Action Handlers for System Notification Bar
  const actionHandlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
    [
      'play',
      () => {
        callbacks.onPlay();
        navigator.mediaSession.playbackState = 'playing';
        requestWakeLock();
      },
    ],
    [
      'pause',
      () => {
        callbacks.onPause();
        navigator.mediaSession.playbackState = 'paused';
        releaseWakeLock();
      },
    ],
    [
      'stop',
      () => {
        callbacks.onStop();
        navigator.mediaSession.playbackState = 'none';
        releaseWakeLock();
      },
    ],
    [
      'previoustrack',
      () => {
        callbacks.onPrevious();
      },
    ],
    [
      'nexttrack',
      () => {
        callbacks.onNext();
      },
    ],
    [
      'seekto',
      (details) => {
        if (details.seekTime !== undefined) {
          callbacks.onSeekTo(details.seekTime);
        }
      },
    ],
    [
      'seekbackward',
      (details) => {
        const offset = details.seekOffset || 10;
        callbacks.onSeekTo(Math.max(0, (track.duration || 0) - offset));
      },
    ],
    [
      'seekforward',
      (details) => {
        const offset = details.seekOffset || 10;
        callbacks.onSeekTo(Math.min(track.duration || 0, offset));
      },
    ],
  ];

  actionHandlers.forEach(([action, handler]) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (e) {
      // Some browsers don't support all actions (like seekforward/seekbackward)
    }
  });

  // Keep WakeLock state in sync
  if (isPlaying) {
    requestWakeLock();
  } else {
    releaseWakeLock();
  }

  // Also sync with native Android bridge if running in Android app
  syncNativePlaybackNotification(track, isPlaying);
}

/**
 * Updates notification scrubber position & playback rate
 */
export function updateSystemPositionState(
  duration: number,
  position: number,
  playbackRate: number = 1.0
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) {
    return;
  }

  if (duration > 0 && position >= 0 && position <= duration) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, duration),
        playbackRate: Math.max(0.5, Math.min(2.0, playbackRate)),
        position: Math.min(duration, Math.max(0, position)),
      });
    } catch (e) {
      // Ignore occasional out-of-range position adjustments
    }
  }
}

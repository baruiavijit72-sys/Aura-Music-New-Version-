import React, { useState, useEffect, useRef } from 'react';
import { 
  Track, 
  Playlist, 
  PlaybackMode, 
  EqualizerSettings, 
  ThemeMode, 
  UserProfile, 
  P2PTransferLog, 
  ListeningLogEntry 
} from './types';
import { 
  loadStoredTracks, 
  saveStoredTracks, 
  loadStoredPlaylists, 
  saveStoredPlaylists, 
  loadStoredEQ, 
  saveStoredEQ, 
  loadTransferLogs, 
  saveTransferLogs, 
  loadListeningLogs, 
  saveListeningLogs, 
  loadProfile, 
  saveProfile, 
  loadThemeMode, 
  saveThemeMode 
} from './utils/storage';
import { 
  loadAllStoredTracksFromIndexedDB, 
  saveTracksBatchToIndexedDB, 
  deleteTrackFromIndexedDB 
} from './utils/indexedDbStorage';
import { audioEngine } from './utils/audioEngine';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS } from './data/mockAudio';
import { auth, onAuthStateChanged, logOut } from './lib/firebase';
import { 
  isNativeAndroidApp, 
  requestNativeDeviceScan, 
  parseNativeTracks, 
  reconcileMediaStoreTracks, 
  syncNativePlaybackNotification 
} from './utils/nativeBridge';
import { 
  updateSystemMediaSession, 
  updateSystemPositionState 
} from './utils/mediaSession';

// Components
import { Header } from './components/Header';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { EqualizerModal } from './components/EqualizerModal';
import { P2PSharingModal } from './components/P2PSharingModal';
import { QueueModal } from './components/QueueModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { TagEditorModal } from './components/TagEditorModal';
import { AudioTrimmerModal } from './components/AudioTrimmerModal';
import { ProfileCloudModal } from './components/ProfileCloudModal';
import { SystemIntegrationModal } from './components/SystemIntegrationModal';
import { PlaylistModal } from './components/PlaylistModal';
import { FeedbackModal } from './components/FeedbackModal';
import { BottomNav } from './components/BottomNav';
import { AuthGateway } from './components/AuthGateway';
import { SplashScreen, SplashSceneType } from './components/SplashScreen';
import { AppIconTheme } from './components/AuraAppIcon';

// Views
import { HomeView } from './views/HomeView';
import { LibraryView } from './views/LibraryView';
import { PlaylistsView } from './views/PlaylistsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  // Flow States:
  // 1. Splash Screen plays first on app launch
  // 2. Authentication Gateway opens immediately after the splash screen
  // 3. Complete App opens once authenticated or guest mode chosen
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [hasCompletedAuth, setHasCompletedAuth] = useState<boolean>(false);

  // Splash Scene state
  const [splashScene, setSplashSceneState] = useState<SplashSceneType>(() => {
    try {
      const saved = localStorage.getItem('aura_splash_scene') as SplashSceneType;
      if (saved && ['disney-hotstar', 'netflix-cinema', 'google-fluid', 'sony-liv', 'cosmic-aura'].includes(saved)) {
        return saved;
      }
      return 'disney-hotstar';
    } catch {
      return 'disney-hotstar';
    }
  });

  const handleSetSplashScene = (scene: SplashSceneType) => {
    setSplashSceneState(scene);
    try {
      localStorage.setItem('aura_splash_scene', scene);
    } catch {
      // ignore
    }
  };

  // App Icon Theme state
  const [iconTheme, setIconThemeState] = useState<AppIconTheme>(() => {
    try {
      return (localStorage.getItem('aura_icon_theme') as AppIconTheme) || 'cosmic-clef';
    } catch {
      return 'cosmic-clef';
    }
  });

  const handleSetIconTheme = (theme: AppIconTheme) => {
    setIconThemeState(theme);
    try {
      localStorage.setItem('aura_icon_theme', theme);
    } catch {
      // ignore
    }
  };

  // Main states
  const [tracks, setTracks] = useState<Track[]>(() => loadStoredTracks());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadStoredPlaylists());
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(() => loadStoredEQ());
  const [transferLogs, setTransferLogs] = useState<P2PTransferLog[]>(() => loadTransferLogs());
  const [listeningLogs, setListeningLogs] = useState<ListeningLogEntry[]>(() => loadListeningLogs());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadProfile());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());

  // Navigation and Search
  const [currentTab, setCurrentTab] = useState<'home' | 'library' | 'playlists' | 'analytics' | 'settings'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Active Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('SEQUENTIAL');
  const [queue, setQueue] = useState<Track[]>(tracks);

  // Sleep timer in seconds remaining
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  // Modals visibility
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isP2POpen, setIsP2POpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Track context modal targets
  const [tagEditorTrack, setTagEditorTrack] = useState<Track | null>(null);
  const [audioTrimmerTrack, setAudioTrimmerTrack] = useState<Track | null>(null);
  const [p2pInitialTrack, setP2pInitialTrack] = useState<Track | null>(null);
  const [p2pInitialPin, setP2pInitialPin] = useState<string | null>(null);

  // Auto-open Transfer Modal if URL contains transfer PIN
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const transferPin = urlParams.get('transfer') || urlParams.get('pin');
      if (transferPin && /^\d{6}$/.test(transferPin.trim())) {
        setP2pInitialPin(transferPin.trim());
        setIsP2POpen(true);
      }
    } catch (e) {
      console.warn('Could not parse URL query parameters:', e);
    }
  }, []);

  // Hydrate persistent tracks from IndexedDB on startup
  useEffect(() => {
    loadAllStoredTracksFromIndexedDB().then((idbTracks) => {
      if (idbTracks && idbTracks.length > 0) {
        setTracks((prev) => {
          const existingIds = new Set(prev.map(t => t.id));
          const newFromIdb = idbTracks.filter(t => !existingIds.has(t.id));
          if (newFromIdb.length > 0) {
            return [...newFromIdb, ...prev];
          }
          return prev;
        });
      }
    });
  }, []);

  // Native Android MediaStore Bridge & Foreground Service Sync
  useEffect(() => {
    // 1. Sync playback state to native Android Foreground Service Media Notification
    syncNativePlaybackNotification(currentTrack, isPlaying);
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    // 2. Register native Android bridge callbacks
    window.onNativeMediaStoreScanComplete = (jsonString: string) => {
      try {
        const nativeTracks = parseNativeTracks(jsonString);
        if (nativeTracks && nativeTracks.length > 0) {
          setTracks((prev) => {
            const { updatedLibrary } = reconcileMediaStoreTracks(prev, nativeTracks);
            return updatedLibrary;
          });
          // Batch persist to IndexedDB for offline instant startup
          saveTracksBatchToIndexedDB(nativeTracks.map(track => ({ track })));
        }
      } catch (err) {
        console.error('Error handling onNativeMediaStoreScanComplete:', err);
      }
    };

    window.onNativePlaybackAction = (action) => {
      if (action === 'PLAY') {
        if (!isPlaying) handleTogglePlay();
      } else if (action === 'PAUSE') {
        if (isPlaying) handleTogglePlay();
      } else if (action === 'NEXT') {
        handleNext();
      } else if (action === 'PREVIOUS') {
        handlePrevious();
      } else if (action === 'STOP') {
        audioEngine.stop();
        setIsPlaying(false);
      }
    };

    // 3. If running inside native Android container, automatically query MediaStore on startup
    if (isNativeAndroidApp()) {
      requestNativeDeviceScan();
    }

    return () => {
      delete window.onNativeMediaStoreScanComplete;
      delete window.onNativePlaybackAction;
    };
  }, [isPlaying, currentTrack, queue, tracks]);

  // Sync state to local storage
  useEffect(() => { saveStoredTracks(tracks); }, [tracks]);
  useEffect(() => { saveStoredPlaylists(playlists); }, [playlists]);
  useEffect(() => { saveStoredEQ(eqSettings); audioEngine.updateEQ(eqSettings); }, [eqSettings]);
  useEffect(() => { saveTransferLogs(transferLogs); }, [transferLogs]);
  useEffect(() => { saveListeningLogs(listeningLogs); }, [listeningLogs]);
  useEffect(() => { saveProfile(userProfile); }, [userProfile]);
  useEffect(() => { saveThemeMode(themeMode); }, [themeMode]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const providerId = user.providerData[0]?.providerId || '';
        let providerType: 'GOOGLE' | 'FACEBOOK' | 'EMAIL' = 'EMAIL';
        if (providerId.includes('google')) providerType = 'GOOGLE';
        else if (providerId.includes('facebook')) providerType = 'FACEBOOK';

        setUserProfile((prev) => ({
          ...prev,
          name: user.displayName || user.email?.split('@')[0] || 'Aura Member',
          email: user.email || '',
          avatarUrl: user.photoURL || undefined,
          authProvider: providerType,
          isCloudSyncEnabled: true,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Audio Playback Timer Ticker & MediaSession Position Synchronizer
  useEffect(() => {
    let timer: number;
    if (isPlaying && currentTrack) {
      timer = window.setInterval(() => {
        const engineTime = audioEngine.getCurrentTime();
        if (engineTime > 0) {
          setCurrentTime(Math.floor(engineTime));
          const dur = audioEngine.getDuration() || currentTrack.duration;
          updateSystemPositionState(dur, engineTime, eqSettings.playbackSpeed || 1.0);
          if (dur > 0 && engineTime >= dur) {
            handleTrackEnded();
          }
        } else {
          setCurrentTime((prev) => {
            const next = prev + 1;
            updateSystemPositionState(currentTrack.duration, next, eqSettings.playbackSpeed || 1.0);
            if (next >= currentTrack.duration) {
              handleTrackEnded();
              return 0;
            }
            return next;
          });
        }
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack, eqSettings.playbackSpeed]);

  // Keep a stable ref of playback actions for Notification MediaSession handlers
  const mediaCallbacksRef = useRef({
    handleTogglePlay: () => {},
    handleNext: () => {},
    handlePrevious: () => {},
    handleSeek: (_sec: number) => {},
    isPlaying: false,
    currentTrack: null as Track | null,
  });

  useEffect(() => {
    mediaCallbacksRef.current = {
      handleTogglePlay,
      handleNext,
      handlePrevious,
      handleSeek,
      isPlaying,
      currentTrack,
    };
  });

  // MediaSession Notification Bar & Lock Screen Synchronizer
  useEffect(() => {
    updateSystemMediaSession(currentTrack, isPlaying, {
      onPlay: () => {
        if (!mediaCallbacksRef.current.isPlaying) {
          mediaCallbacksRef.current.handleTogglePlay();
        }
      },
      onPause: () => {
        if (mediaCallbacksRef.current.isPlaying) {
          mediaCallbacksRef.current.handleTogglePlay();
        }
      },
      onStop: () => {
        audioEngine.stop();
        setIsPlaying(false);
      },
      onNext: () => {
        mediaCallbacksRef.current.handleNext();
      },
      onPrevious: () => {
        mediaCallbacksRef.current.handlePrevious();
      },
      onSeekTo: (seconds) => {
        mediaCallbacksRef.current.handleSeek(seconds);
      },
    });
  }, [currentTrack, isPlaying]);

  // Sleep Timer Countdown Ticker
  useEffect(() => {
    let sleepInterval: number;
    if (sleepTimerSeconds !== null && sleepTimerSeconds > 0) {
      sleepInterval = window.setInterval(() => {
        setSleepTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            // Stop playback on expiration
            audioEngine.stop();
            setIsPlaying(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(sleepInterval);
  }, [sleepTimerSeconds]);

  // Handle Track Play
  const handlePlayTrack = (track: Track, offsetSec = 0) => {
    setCurrentTrack(track);
    setCurrentTime(offsetSec);
    setIsPlaying(true);
    audioEngine.playTrack(track, offsetSec, handleTrackEnded);

    // Update playCount and lastPlayed
    setTracks(prev => prev.map(t => {
      if (t.id === track.id) {
        return {
          ...t,
          playCount: t.playCount + 1,
          lastPlayed: Date.now(),
        };
      }
      return t;
    }));

    // Record listening log entry
    const newLog: ListeningLogEntry = {
      id: `log-${Date.now()}`,
      trackId: track.id,
      trackTitle: track.title,
      artist: track.artist,
      genre: track.genre,
      timestamp: Date.now(),
      durationSeconds: track.duration,
      completedPercent: 100,
      isSkipped: false,
    };
    setListeningLogs(prev => [newLog, ...prev.slice(0, 49)]);

    // Ensure track is in queue
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [track, ...prev]);
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (tracks.length > 0) handlePlayTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume(currentTime);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentTrack || queue.length === 0) return;

    if (playbackMode === 'SHUFFLE') {
      const remaining = queue.filter(t => t.id !== currentTrack.id);
      const randomTrack = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : currentTrack;
      handlePlayTrack(randomTrack);
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      handlePlayTrack(queue[currentIndex + 1]);
    } else if (playbackMode === 'REPEAT_ALL' && queue.length > 0) {
      handlePlayTrack(queue[0]);
    } else {
      handlePlayTrack(queue[0]);
    }
  };

  const handlePrevious = () => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTime > 4) {
      handleSeek(0);
      return;
    }
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(queue[currentIndex - 1]);
    } else {
      handlePlayTrack(queue[queue.length - 1]);
    }
  };

  const handleTrackEnded = () => {
    if (playbackMode === 'REPEAT_ONE' && currentTrack) {
      handlePlayTrack(currentTrack, 0);
    } else {
      handleNext();
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const handleCyclePlaybackMode = () => {
    const modes: PlaybackMode[] = ['SEQUENTIAL', 'SHUFFLE', 'REPEAT_ALL', 'REPEAT_ONE'];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIdx]);
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return { ...t, isFavorite: !t.isFavorite };
      }
      return t;
    }));

    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Queue Operations
  const handlePlayNext = (track: Track) => {
    if (!currentTrack) {
      handlePlayTrack(track);
      return;
    }
    const filtered = queue.filter(t => t.id !== track.id);
    const currIndex = filtered.findIndex(t => t.id === currentTrack.id);
    filtered.splice(currIndex + 1, 0, track);
    setQueue(filtered);
  };

  const handleAddToQueue = (track: Track) => {
    if (!queue.some(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
    }
  };

  const handleReorderQueue = (fromIndex: number, toIndex: number) => {
    const updated = [...queue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setQueue(updated);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
  };

  const handleSaveQueueAsPlaylist = () => {
    const newPl: Playlist = {
      id: `pl-saved-${Date.now()}`,
      name: `Queue Mix ${new Date().toLocaleDateString()}`,
      description: 'Exported from active play queue',
      isSmart: false,
      trackIds: queue.map(t => t.id),
      createdAt: Date.now(),
      coverGradient: ['#6366f1', '#a855f7'],
    };
    setPlaylists(prev => [newPl, ...prev]);
    setIsQueueOpen(false);
  };

  // Tag Editor Save
  const handleSaveTrackTags = (updatedTrack: Track) => {
    setTracks(prev => prev.map(t => t.id === updatedTrack.id ? updatedTrack : t));
    if (currentTrack?.id === updatedTrack.id) {
      setCurrentTrack(updatedTrack);
    }
  };

  // Audio Trimmer open
  const handleOpenAudioTrimmer = (track: Track) => {
    setAudioTrimmerTrack(track);
  };

  // P2P direct share open
  const handleOpenP2PWithTrack = (track: Track) => {
    setP2pInitialTrack(track);
    setIsP2POpen(true);
  };

  // Add to Playlist
  const handleAddToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(pl => {
      if (pl.id === playlistId && !pl.trackIds.includes(trackId)) {
        return { ...pl, trackIds: [...pl.trackIds, trackId] };
      }
      return pl;
    }));
  };

  // Delete Track from Library
  const handleDeleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setQueue(prev => prev.filter(t => t.id !== trackId));
    deleteTrackFromIndexedDB(trackId);
    if (currentTrack?.id === trackId) {
      handleNext();
    }
  };

  // Import Single & Multiple Tracks
  const handleImportTrack = (newTrack: Track, blob?: Blob | File) => {
    setTracks(prev => [newTrack, ...prev]);
    setQueue(prev => [newTrack, ...prev]);
    if (blob) {
      saveTracksBatchToIndexedDB([{ track: newTrack, blob }]);
    }
  };

  const handleImportMultipleTracks = (newTracks: Track[], itemsWithBlobs?: { track: Track; blob?: Blob | File }[]) => {
    setTracks(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNew = newTracks.filter(t => !existingIds.has(t.id));
      return [...filteredNew, ...prev];
    });
    setQueue(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNew = newTracks.filter(t => !existingIds.has(t.id));
      return [...filteredNew, ...prev];
    });

    if (itemsWithBlobs && itemsWithBlobs.length > 0) {
      saveTracksBatchToIndexedDB(itemsWithBlobs);
    }
  };

  // Create Playlist
  const handleCreatePlaylist = (newPlaylist: Playlist) => {
    setPlaylists(prev => [newPlaylist, ...prev]);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const handleDuplicatePlaylist = (playlist: Playlist) => {
    const duplicated: Playlist = {
      ...playlist,
      id: `pl-dup-${Date.now()}`,
      name: `${playlist.name} (Copy)`,
      createdAt: Date.now(),
    };
    setPlaylists(prev => [duplicated, ...prev]);
  };

  const handleTogglePinPlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) return { ...p, isPinned: !p.isPinned };
      return p;
    }));
  };

  const handleUpdatePlaylist = (updatedPlaylist: Playlist) => {
    setPlaylists(prev => {
      const exists = prev.some(p => p.id === updatedPlaylist.id);
      if (exists) {
        return prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p);
      }
      return [updatedPlaylist, ...prev];
    });
    if (activePlaylist?.id === updatedPlaylist.id) {
      setActivePlaylist(updatedPlaylist);
    }
  };

  const handleResetDemoData = () => {
    setTracks([]);
    setPlaylists([]);
    setQueue([]);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleAuthCompleted = (profile: UserProfile) => {
    setUserProfile(profile);
    setHasCompletedAuth(true);
    try {
      localStorage.setItem('aura_auth_completed', 'true');
    } catch (e) {}
  };

  const handleGuestExplore = () => {
    setHasCompletedAuth(true);
    try {
      localStorage.setItem('aura_auth_completed', 'true');
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem('aura_auth_completed');
    } catch (e) {}
    setHasCompletedAuth(false);
    setUserProfile({
      id: 'local-user',
      name: 'Aura Member',
      email: '',
      authProvider: 'GUEST',
      isCloudSyncEnabled: false,
      totalListeningSeconds: 0
    });
  };

  const handleDataRestored = () => {
    setTracks(loadStoredTracks());
    setPlaylists(loadStoredPlaylists());
    setEqSettings(loadStoredEQ());
    setListeningLogs(loadListeningLogs());
    setUserProfile(loadProfile());
  };

  // Filtered tracks by search
  const visibleTracks = tracks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      t.format.toLowerCase().includes(q)
    );
  });

  // Dynamic Theme styling classes
  const getThemeClass = () => {
    switch (themeMode) {
      case 'LIGHT_AIR':
        return 'bg-zinc-100 text-zinc-900';
      case 'DARK_MATERIAL':
        return 'bg-zinc-900 text-zinc-100';
      case 'DYNAMIC_ALBUM_ART':
        return 'bg-zinc-950 text-white';
      case 'OLED_BLACK':
      default:
        return 'bg-black text-white';
    }
  };

  // Step 1: Splash Screen plays first on app launch
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  // Step 2: Authentication Gateway opens directly after the splash screen
  if (!hasCompletedAuth) {
    return (
      <AuthGateway
        onAuthenticated={handleAuthCompleted}
        onExploreGuest={handleGuestExplore}
      />
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${getThemeClass()} transition-colors duration-300`}>
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenP2P={() => {
          setP2pInitialTrack(null);
          setIsP2POpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSystem={() => setIsSystemOpen(true)}
        onOpenSplash={() => setShowSplash(true)}
        onPlayTrack={handlePlayTrack}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-36 md:pb-28 max-w-6xl w-full mx-auto">
        {currentTab === 'home' && (
          <HomeView
            tracks={visibleTracks}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onTogglePlay={handleTogglePlay}
            onSelectPlaylist={(pl) => {
              setActivePlaylist(pl);
              setCurrentTab('playlists');
            }}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenScan={() => setIsSystemOpen(true)}
            onOpenFeedback={() => setIsFeedbackOpen(true)}
            onOpenWidgets={() => setIsSystemOpen(true)}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            tracks={visibleTracks}
            playlists={playlists}
            onPlayTrack={handlePlayTrack}
            onPlayNext={handlePlayNext}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddToPlaylist}
            onOpenTagEditor={(t) => setTagEditorTrack(t)}
            onOpenAudioTrimmer={handleOpenAudioTrimmer}
            onOpenP2PWithTrack={handleOpenP2PWithTrack}
            onDeleteTrack={handleDeleteTrack}
            onImportTrack={handleImportTrack}
            onImportMultipleTracks={handleImportMultipleTracks}
            onSwitchToPlaylists={() => setCurrentTab('playlists')}
            onSelectPlaylist={(pl) => {
              setActivePlaylist(pl);
              setCurrentTab('playlists');
            }}
          />
        )}

        {currentTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            tracks={tracks}
            onPlayTrack={handlePlayTrack}
            onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
            onDeletePlaylist={handleDeletePlaylist}
            onTogglePinPlaylist={handleTogglePinPlaylist}
            onDuplicatePlaylist={handleDuplicatePlaylist}
            activePlaylist={activePlaylist}
            setActivePlaylist={setActivePlaylist}
            onUpdatePlaylist={handleUpdatePlaylist}
            onAddToQueue={handleAddToQueue}
            onPlayNext={handlePlayNext}
            onOpenTagEditor={(t) => setTagEditorTrack(t)}
            onOpenAudioTrimmer={handleOpenAudioTrimmer}
            onOpenP2PWithTrack={handleOpenP2PWithTrack}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            tracks={tracks}
            listeningLogs={listeningLogs}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            eqSettings={eqSettings}
            onUpdateEQ={setEqSettings}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            onResetAllData={handleResetDemoData}
            userProfile={userProfile}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
            onDataRestored={handleDataRestored}
            onOpenSplash={() => setShowSplash(true)}
            iconTheme={iconTheme}
            setIconTheme={handleSetIconTheme}
            splashScene={splashScene}
            setSplashScene={handleSetSplashScene}
          />
        )}
      </main>

      {/* Floating Bottom Mini Player */}
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onToggleFavorite={handleToggleFavorite}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        currentTime={currentTime}
        duration={currentTrack?.duration || 0}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        hasActivePlayer={!!currentTrack}
      />

      {/* Fullscreen / Modal Overlays */}
      {isNowPlayingOpen && (
        <NowPlayingModal
          isOpen={isNowPlayingOpen}
          onClose={() => setIsNowPlayingOpen(false)}
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrevious={handlePrevious}
          playbackMode={playbackMode}
          onCyclePlaybackMode={handleCyclePlaybackMode}
          onToggleFavorite={handleToggleFavorite}
          currentTime={currentTime}
          duration={currentTrack?.duration || 0}
          onSeek={handleSeek}
          onOpenEQ={() => setIsEQOpen(true)}
          onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
          onOpenTagEditor={(t) => setTagEditorTrack(t)}
          onOpenAudioTrimmer={handleOpenAudioTrimmer}
          onOpenP2PWithTrack={handleOpenP2PWithTrack}
          onOpenLyricsEditor={(t) => setTagEditorTrack(t)}
          eqSettings={eqSettings}
          onUpdateEQ={setEqSettings}
        />
      )}

      {isEQOpen && (
        <EqualizerModal
          isOpen={isEQOpen}
          onClose={() => setIsEQOpen(false)}
          eqSettings={eqSettings}
          onUpdateEQ={setEqSettings}
        />
      )}

      {isP2POpen && (
        <P2PSharingModal
          isOpen={isP2POpen}
          onClose={() => {
            setIsP2POpen(false);
            setP2pInitialTrack(null);
            setP2pInitialPin(null);
          }}
          tracks={tracks}
          playlists={playlists}
          initialSelectedTrack={p2pInitialTrack}
          initialPin={p2pInitialPin}
          transferLogs={transferLogs}
          onAddTransferLog={(log) => setTransferLogs(prev => [log, ...prev])}
          onImportTrack={handleImportTrack}
          onPlayTrack={handlePlayTrack}
        />
      )}

      {isQueueOpen && (
        <QueueModal
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          queue={queue}
          currentTrackId={currentTrack?.id || null}
          onSelectTrack={handlePlayTrack}
          onRemoveFromQueue={handleRemoveFromQueue}
          onReorderQueue={handleReorderQueue}
          onClearQueue={handleClearQueue}
          onSaveAsPlaylist={handleSaveQueueAsPlaylist}
        />
      )}

      {isSleepTimerOpen && (
        <SleepTimerModal
          isOpen={isSleepTimerOpen}
          onClose={() => setIsSleepTimerOpen(false)}
          sleepTimerSeconds={sleepTimerSeconds}
          onSetSleepTimer={setSleepTimerSeconds}
        />
      )}

      {tagEditorTrack && (
        <TagEditorModal
          isOpen={tagEditorTrack !== null}
          onClose={() => setTagEditorTrack(null)}
          track={tagEditorTrack}
          onSaveTrack={handleSaveTrackTags}
        />
      )}

      {audioTrimmerTrack && (
        <AudioTrimmerModal
          isOpen={audioTrimmerTrack !== null}
          onClose={() => setAudioTrimmerTrack(null)}
          track={audioTrimmerTrack}
        />
      )}

      {isProfileOpen && (
        <ProfileCloudModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
        />
      )}

      {isSystemOpen && (
        <SystemIntegrationModal
          isOpen={isSystemOpen}
          onClose={() => setIsSystemOpen(false)}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {isPlaylistModalOpen && (
        <PlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          onCreatePlaylist={handleCreatePlaylist}
          availableTracks={tracks}
        />
      )}

      {isFeedbackOpen && (
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          userEmail={userProfile.email}
          userName={userProfile.name}
        />
      )}
    </div>
  );
}

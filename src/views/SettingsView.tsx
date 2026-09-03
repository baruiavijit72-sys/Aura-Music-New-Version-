import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Volume2, 
  FolderMinus, 
  Clock, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Sun, 
  Moon, 
  Sparkles,
  Zap,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  User,
  SlidersHorizontal,
  FileCode,
  Loader2,
  Smartphone,
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Globe,
  Heart,
  Radio,
  Download,
  Gem,
  Crown,
  ChevronRight
} from 'lucide-react';
import { EqualizerSettings, ThemeMode, UserProfile } from '../types';
import { exportAllDataJson, restoreAllDataJson } from '../utils/storage';
import { isNativeAndroidApp, requestNativeDeviceScan } from '../utils/nativeBridge';
import { 
  saveCloudBackupToFirestore, 
  fetchCloudBackupFromFirestore, 
  logOut, 
  auth 
} from '../lib/firebase';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageModal } from '../components/LanguageModal';
import { AuraAppIcon, AppIconTheme } from '../components/AuraAppIcon';
import { SplashSceneType } from '../components/SplashScreen';
import { RealAdBanner } from '../components/RealAdBanner';

interface SettingsViewProps {
  eqSettings: EqualizerSettings;
  onUpdateEQ: (settings: EqualizerSettings) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onResetAllData: () => void;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onDataRestored?: () => void;
  onOpenSplash?: () => void;
  iconTheme?: AppIconTheme;
  setIconTheme?: (theme: AppIconTheme) => void;
  splashScene?: SplashSceneType;
  setSplashScene?: (scene: SplashSceneType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  eqSettings,
  onUpdateEQ,
  themeMode,
  setThemeMode,
  onResetAllData,
  userProfile,
  onOpenProfile,
  onLogout,
  onDataRestored,
  onOpenSplash,
  iconTheme = 'cosmic-clef',
  setIconTheme,
  splashScene = 'cosmic-clef',
  setSplashScene
}) => {
  const { t, language, setLanguage, currentLanguageInfo, supportedLanguages } = useTranslation();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [blacklistedFolders, setBlacklistedFolders] = useState<string[]>([
    '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio',
    '/storage/emulated/0/VoiceRecorder',
    '/storage/emulated/0/Ringtones',
  ]);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [minDurationSec, setMinDurationSec] = useState(30);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
  const [isCloudRestoring, setIsCloudRestoring] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isVipActive, setIsVipActive] = useState(() => {
    return localStorage.getItem('aura_vip_status') === 'active';
  });

  React.useEffect(() => {
    const handleVipUpdate = () => {
      setIsVipActive(localStorage.getItem('aura_vip_status') === 'active');
    };
    window.addEventListener('aura_vip_updated', handleVipUpdate);
    return () => window.removeEventListener('aura_vip_updated', handleVipUpdate);
  }, []);

  const appShareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ai.studio/build';

  const handleCopyShareLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appShareUrl);
      } else {
        const input = document.createElement('input');
        input.value = appShareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setStatusBanner('App link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setStatusBanner(null);
      }, 2500);
    } catch (e) {
      setStatusBanner('Could not copy link automatically.');
      setTimeout(() => setStatusBanner(null), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Aura Music Player',
          text: 'Listen to high-fidelity offline & streaming music with Aura Music Player:',
          url: appShareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyShareLink();
        }
      }
    } else {
      handleCopyShareLink();
    }
  };

  const handleAddBlacklist = () => {
    if (!newFolderInput.trim()) return;
    setBlacklistedFolders([...blacklistedFolders, newFolderInput.trim()]);
    setNewFolderInput('');
    setStatusBanner('Folder added to scanner blacklist.');
    setTimeout(() => setStatusBanner(null), 2500);
  };

  const handleRemoveBlacklist = (folder: string) => {
    setBlacklistedFolders(blacklistedFolders.filter(f => f !== folder));
  };

  const handleClearCache = () => {
    setStatusBanner('Album artwork & decoded waveform cache successfully purged.');
    setTimeout(() => setStatusBanner(null), 2500);
  };

  const handleBackupToCloud = async () => {
    const currentUid = auth.currentUser?.uid || userProfile?.id;
    if (!currentUid) {
      if (onOpenProfile) onOpenProfile();
      return;
    }

    setIsCloudBackingUp(true);
    try {
      const dataJson = exportAllDataJson();
      const backupTimestamp = await saveCloudBackupToFirestore(currentUid, dataJson);
      setStatusBanner(`Full Library & Playlists backed up to Firestore at ${new Date(backupTimestamp).toLocaleTimeString()}!`);
      setTimeout(() => setStatusBanner(null), 3500);
    } catch (err: any) {
      console.error('Cloud backup error:', err);
      setStatusBanner('Cloud backup failed. Please check network connection.');
      setTimeout(() => setStatusBanner(null), 3500);
    } finally {
      setIsCloudBackingUp(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    const currentUid = auth.currentUser?.uid || userProfile?.id;
    if (!currentUid) {
      if (onOpenProfile) onOpenProfile();
      return;
    }

    setIsCloudRestoring(true);
    try {
      const backupJson = await fetchCloudBackupFromFirestore(currentUid);
      if (!backupJson) {
        setStatusBanner('No cloud backup found on this account yet.');
        setTimeout(() => setStatusBanner(null), 3000);
        return;
      }

      const success = restoreAllDataJson(backupJson);
      if (success) {
        setStatusBanner('Library & Equalizer settings restored from Cloud!');
        if (onDataRestored) onDataRestored();
        setTimeout(() => setStatusBanner(null), 3500);
      } else {
        setStatusBanner('Failed to parse backup snapshot data.');
        setTimeout(() => setStatusBanner(null), 3000);
      }
    } catch (err: any) {
      console.error('Cloud restore error:', err);
      setStatusBanner('Cloud restore failed.');
      setTimeout(() => setStatusBanner(null), 3000);
    } finally {
      setIsCloudRestoring(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn('Sign out:', e);
    }
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">{t.settings.title}</h2>
        <p className="text-xs text-zinc-400">{t.settings.subtitle}</p>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* VIP Diamond Subscription & Membership Section */}
      <div 
        id="section-vip-subscription"
        className="p-5 rounded-3xl bg-gradient-to-br from-[#1c1300] via-[#221603] to-[#0f172a] border border-amber-400/40 space-y-4 shadow-xl shadow-amber-950/25 relative overflow-hidden select-none"
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-[1.5px] shadow-[0_0_15px_rgba(251,191,36,0.35)] shrink-0">
              <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center">
                <Gem className="w-5 h-5 text-amber-300 fill-amber-400/30 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
                  AURA VIP Diamond Subscription
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isVipActive 
                    ? 'bg-amber-400/25 text-amber-300 border-amber-400/50'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {isVipActive ? 'ACTIVE PRO' : 'FREE TIER'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                {isVipActive 
                  ? 'Your 32-Bit Lossless Audio DSP engine & 0-Ads privilege are active.' 
                  : 'Upgrade to unlock 32-Bit Lossless Audio, 0 Ads, and Direct Bank Settlements.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-settings-open-vip"
            onClick={() => window.dispatchEvent(new CustomEvent('open_vip_modal'))}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold text-xs tracking-wide shadow-md shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{isVipActive ? 'Manage Subscription' : 'Subscribe to VIP (₹210 / ₹1,250)'}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>32-Bit Lossless DSP</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>100% Zero Ads</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Direct UPI / QR Pay</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Cloud Sync & Backup</span>
          </div>
        </div>
      </div>

      {/* Language & Internationalization Section */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                {t.settings.languageSection}
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                  {currentLanguageInfo.flag} {currentLanguageInfo.nativeName}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                {t.settings.selectLanguage}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLanguageModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All ({supportedLanguages.length})</span>
          </button>
        </div>

        {/* Quick Language Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950 to-purple-950 border-indigo-500 text-white shadow-md'
                    : 'bg-zinc-950/80 border-white/5 hover:bg-zinc-950 hover:border-white/20 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{lang.nativeName}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{lang.name}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real Account & Cloud Sync Controls */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Aura Cloud Sync & Account</h3>
              <p className="text-[11px] text-zinc-400">
                {auth.currentUser 
                  ? `Signed in as ${userProfile?.name || auth.currentUser.displayName || auth.currentUser.email}`
                  : (userProfile?.name ? `Signed in as ${userProfile.name}` : 'Local Account')}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOutClick}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Quick Cloud Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handleBackupToCloud}
            disabled={isCloudBackingUp}
            className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCloudBackingUp ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <CloudUpload className="w-4 h-4 text-emerald-400" />
            )}
            <span>Backup Library to Cloud</span>
          </button>

          <button
            onClick={handleRestoreFromCloud}
            disabled={isCloudRestoring}
            className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCloudRestoring ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <CloudDownload className="w-4 h-4 text-indigo-400" />
            )}
            <span>Restore from Cloud</span>
          </button>
        </div>

        {userProfile?.lastCloudBackup && (
          <p className="text-[10px] text-zinc-500 text-center">
            Last synced to Firestore: {new Date(userProfile.lastCloudBackup).toLocaleString()}
          </p>
        )}
      </div>

      {/* Theme Selection */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Theme & Visual Engine</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setThemeMode('OLED_BLACK')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
              themeMode === 'OLED_BLACK'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-black border border-white/20" />
            <span>OLED Pure Black</span>
          </button>

          <button
            onClick={() => setThemeMode('DARK_MATERIAL')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
              themeMode === 'DARK_MATERIAL'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Moon className="w-5 h-5 text-purple-400" />
            <span>Material Dark</span>
          </button>

          <button
            onClick={() => setThemeMode('LIGHT_AIR')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
              themeMode === 'LIGHT_AIR'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Light Air</span>
          </button>

          <button
            onClick={() => setThemeMode('DYNAMIC_ALBUM_ART')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
              themeMode === 'DYNAMIC_ALBUM_ART'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Material You Reactive</span>
          </button>
        </div>
      </div>

      {/* Audio Engine Configuration */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Lossless DSP & Playback Engine</h3>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Background & Notification Playback</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Music continues playing uninterrupted when your screen turns off or you switch apps. Notification bar and lock screen display real-time track info with interactive play, pause, next, previous, and scrubber controls.
            </p>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 border border-white/5 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white">Gapless Audio Engine</span>
              <p className="text-[11px] text-zinc-400">Eliminates silence buffers between consecutive tracks</p>
            </div>
            <input
              type="checkbox"
              checked={eqSettings.gaplessPlayback}
              onChange={(e) => onUpdateEQ({ ...eqSettings, gaplessPlayback: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/80 border border-white/5 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-white">ReplayGain Normalization</span>
              <p className="text-[11px] text-zinc-400">Prevents sudden volume jumps across varying audio formats</p>
            </div>
            <input
              type="checkbox"
              checked={eqSettings.replayGain}
              onChange={(e) => onUpdateEQ({ ...eqSettings, replayGain: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Crossfade Duration</span>
              <span className="font-mono text-indigo-400 font-bold">{eqSettings.crossfadeSeconds} seconds</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={eqSettings.crossfadeSeconds}
              onChange={(e) => onUpdateEQ({ ...eqSettings, crossfadeSeconds: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Library Scanner & Exclusions */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <FolderMinus className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Folder Blacklist & Duration Filter</h3>
        </div>

        {/* Duration Filter */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Ignore Short Audio Files Below</span>
            <span className="font-mono text-amber-400 font-bold">{minDurationSec} seconds</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={minDurationSec}
            onChange={(e) => setMinDurationSec(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[10px] text-zinc-500">Automatically filters out voice notes and short notifications.</p>
        </div>

        {/* Blacklisted Folders List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-300">Excluded Directories</span>
          <div className="space-y-1.5">
            {blacklistedFolders.map((folder) => (
              <div key={folder} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs">
                <span className="text-zinc-400 font-mono truncate mr-2">{folder}</span>
                <button
                  onClick={() => handleRemoveBlacklist(folder)}
                  className="text-red-400 hover:text-red-300 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="/storage/emulated/0/..."
              value={newFolderInput}
              onChange={(e) => setNewFolderInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleAddBlacklist}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition"
            >
              Add Exclusion
            </button>
          </div>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Storage & Maintenance</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={handleClearCache}
            className="p-3 rounded-2xl bg-zinc-950 border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Purge Artwork Cache</span>
          </button>

          <button
            onClick={onResetAllData}
            className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Demo Database</span>
          </button>
        </div>
      </div>

      {/* Flagship Aura Identity */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-sky-950/30 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <AuraAppIcon size={52} variant="full" animated={true} glow={true} />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Aura Music Signature Identity</span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  32-Bit Hi-Res Edition
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Midnight sapphire squircle, sweeping stardust arc & luminous acoustic treble clef
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* About & App Sharing */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/30 border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">About & App Sharing</h3>
              <p className="text-[11px] text-zinc-400">Share Aura with friends or open on another device</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
            v2.4.0
          </span>
        </div>

        {/* Share Link Box */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">App Share Link</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live & Accessible
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 truncate select-all">
              {appShareUrl}
            </div>
            <button
              onClick={handleCopyShareLink}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 flex-shrink-0"
              title="Copy App Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleNativeShare}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-xs font-bold text-white transition flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Share Link</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-xs font-bold text-white transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* About App Specs */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-xl bg-zinc-950/50">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Audio Engine</p>
            <p className="text-xs font-bold text-zinc-200 mt-0.5">32-Bit WebAudio</p>
          </div>
          <div className="p-2 rounded-xl bg-zinc-950/50">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Formats</p>
            <p className="text-xs font-bold text-zinc-200 mt-0.5">FLAC/MP3/WAV/AAC</p>
          </div>
          <div className="p-2 rounded-xl bg-zinc-950/50">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">P2P Mesh</p>
            <p className="text-xs font-bold text-zinc-200 mt-0.5">WebRTC Direct</p>
          </div>
          <div className="p-2 rounded-xl bg-zinc-950/50">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Cloud Sync</p>
            <p className="text-xs font-bold text-zinc-200 mt-0.5">Firebase Auth</p>
          </div>
        </div>
      </div>

      {/* Featured Partner & Audiophile Ad */}
      <RealAdBanner slotIndex={1} />

      {/* QR Code Modal for Scanning from Phone */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="w-full max-w-sm p-6 rounded-3xl bg-zinc-900 border border-white/10 space-y-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <QrCode className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Scan to Open App</h4>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appShareUrl)}`}
                alt="Aura App QR Code"
                className="w-44 h-44 rounded-lg"
              />
              <p className="text-[11px] text-zinc-600 font-mono mt-3 font-semibold">Scan with camera app</p>
            </div>

            <p className="text-xs text-zinc-400">
              Point your smartphone or tablet camera at the QR code above to instantly open Aura Music Player.
            </p>

            <button
              onClick={handleCopyShareLink}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link URL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Language Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </div>
  );
};

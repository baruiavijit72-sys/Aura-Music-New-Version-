import React, { useState } from 'react';
import { 
  Search, 
  Gem, 
  Film, 
  Settings as SettingsIcon,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Share2,
  Globe,
  Download,
  Smartphone
} from 'lucide-react';
import { ThemeMode, UserProfile, Track } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageModal } from './LanguageModal';
import { VipDiamondModal } from './VipDiamondModal';
import { VideoStreamFinderModal } from './VideoStreamFinderModal';
import { AuraLogo } from './AuraLogo';

interface HeaderProps {
  currentTab: 'home' | 'library' | 'playlists' | 'analytics' | 'settings';
  setCurrentTab: (tab: 'home' | 'library' | 'playlists' | 'analytics' | 'settings') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onOpenEQ: () => void;
  onOpenP2P: () => void;
  onOpenProfile: () => void;
  onOpenSystem: () => void;
  onOpenSplash?: () => void;
  onPlayTrack?: (track: Track) => void;
  userProfile: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  themeMode,
  setThemeMode,
  onOpenEQ,
  onOpenP2P,
  onOpenProfile,
  onOpenSystem,
  onOpenSplash,
  onPlayTrack,
  userProfile
}) => {
  const { t, currentLanguageInfo } = useTranslation();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isVipActive, setIsVipActive] = useState(() => {
    return localStorage.getItem('aura_vip_status') === 'active';
  });

  React.useEffect(() => {
    const handleVipUpdate = (e: any) => {
      setIsVipActive(localStorage.getItem('aura_vip_status') === 'active');
    };
    const handleOpenVipModal = () => {
      setIsVipModalOpen(true);
    };

    window.addEventListener('aura_vip_updated', handleVipUpdate);
    window.addEventListener('open_vip_modal', handleOpenVipModal);

    return () => {
      window.removeEventListener('aura_vip_updated', handleVipUpdate);
      window.removeEventListener('open_vip_modal', handleOpenVipModal);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#091522]/90 border-b border-white/10 px-4 py-2.5 transition-all shadow-xl shadow-black/40 select-none">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          
          {/* TOP ULTRA-STYLISH SIGNATURE RIBBON: MADE BY AVIJIT */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>AURA MUSIC Hi-Res Audio</span>
            </div>

            {/* Luxurious Signature Pill */}
            <div className="relative group flex items-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/25 via-rose-500/25 to-cyan-500/25 blur-sm opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="relative px-3.5 py-1 rounded-full bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-amber-300/30 backdrop-blur-md flex items-center gap-1.5 shadow-[0_2px_12px_rgba(251,191,36,0.15)]">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow shrink-0" />
                <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-300">
                  Made by
                </span>
                <div className="w-1 h-1 rotate-45 bg-amber-300 shadow-[0_0_6px_#fde047]" />
                <span 
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
                  className="text-xs sm:text-sm font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-300 drop-shadow-[0_1px_8px_rgba(251,191,36,0.5)]"
                >
                  Avijit
                </span>
                <Sparkles className="w-2.5 h-2.5 text-cyan-300 shrink-0 ml-0.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/app-debug.apk"
                download="AuraMusic-v2.0-native.apk"
                id="btn-download-apk-header"
                title="Download Real Original Android APK (Install on your phone)"
                className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-emerald-500/10 cursor-pointer"
              >
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>APK v2.0</span>
                <Download className="w-2.5 h-2.5 text-emerald-400" />
              </a>

              <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  DSP 32-Bit Lossless
                </span>
              </div>
            </div>
          </div>

          {/* MAIN TOP BAR: AURA MUSIC LOGO ON LEFT + [ 💎 ] [ 🔍 ] [ ▶️ ] [ ⬡ ] ON RIGHT */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            {/* AURA MUSIC Ultra-Stylish Brand Logo Badge */}
            <div 
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              {/* Master Aura Music App Badge */}
              <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <AuraLogo size={38} variant="emblem" glow={true} animated={true} />
              </div>

              {/* Stylish Brand Typography */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span 
                    style={{ fontFamily: "'Orbitron', 'Syne', sans-serif" }}
                    className="text-lg sm:text-xl font-black tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-sky-400 drop-shadow-[0_1px_10px_rgba(56,189,248,0.4)] group-hover:from-cyan-100 group-hover:to-sky-300 transition-all duration-300"
                  >
                    AURA
                  </span>
                  <span 
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    className="text-xs sm:text-sm font-extrabold tracking-[0.22em] text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] uppercase"
                  >
                    MUSIC
                  </span>
                </div>
                <div className="flex items-center gap-1.5 -mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                  <span 
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase"
                  >
                    HI-RES LOSSLESS
                  </span>
                </div>
              </div>
            </div>

            {/* Action Icons matching Screenshot: [ Diamond VIP ] [ Search ] [ Video/Stream ] [ Settings Hexagon ] */}
            <div className="flex items-center gap-2">
              
              {/* 💎 Aura Music Premium VIP Button */}
              <button
                id="btn-diamond-vip"
                onClick={() => setIsVipModalOpen(true)}
                title={isVipActive ? "Aura Music Premium VIP (Active)" : "Get Aura Music Premium (VIP Membership)"}
                className={`relative h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 ${
                  isVipActive
                    ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-600/30 to-zinc-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(30,215,96,0.35)]'
                    : 'bg-[#1ed760]/15 hover:bg-[#1ed760]/25 border-[#1ed760]/40 text-[#1ed760] shadow-[0_0_10px_rgba(30,215,96,0.15)]'
                }`}
              >
                <Gem className={`w-3.5 h-3.5 shrink-0 ${isVipActive ? 'fill-emerald-400/40 text-emerald-300 animate-pulse' : 'text-[#1ed760]'}`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {isVipActive ? 'PREMIUM VIP' : 'PREMIUM'}
                </span>
                {isVipActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-ping" />
                ) : (
                  <span className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30 font-bold">
                    VIP
                  </span>
                )}
              </button>

              {/* 🔍 Search Toggle Button */}
              <button
                id="btn-search-toggle"
                onClick={() => setIsSearchExpanded(prev => !prev)}
                title="Search Songs, Artists, Albums"
                className={`w-9 h-9 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                  isSearchExpanded || searchQuery
                    ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-md'
                    : 'bg-[#142334] hover:bg-[#1e344f] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* ▶️ Video / Online Stream Button */}
              <button
                id="btn-video-stream"
                onClick={() => setIsVideoModalOpen(true)}
                title="Video & Online Audio Stream"
                className="w-9 h-9 rounded-xl bg-[#142334] hover:bg-[#1e344f] border border-white/10 text-red-400 flex items-center justify-center transition shadow-sm cursor-pointer active:scale-95"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* ⬡ Settings Hexagon Button */}
              <button
                id="btn-settings-header"
                onClick={() => setCurrentTab('settings')}
                title="Settings"
                className={`w-9 h-9 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                  currentTab === 'settings'
                    ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-md'
                    : 'bg-[#142334] hover:bg-[#1e344f] border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Search Input */}
          {(isSearchExpanded || searchQuery) && (
            <div className="relative pt-1 animate-in fade-in slide-in-from-top-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none mt-0.5" />
              <input
                id="input-global-search"
                type="text"
                autoFocus
                placeholder="Search songs, artists, albums, or lyrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#142334] border border-[#0284c7]/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white p-1 mt-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          )}

        </div>
      </header>

      {/* VIP Modal */}
      <VipDiamondModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
      />

      {/* Video & Online Stream Finder Modal */}
      <VideoStreamFinderModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onImportAndPlay={(track) => {
          if (onPlayTrack) onPlayTrack(track);
        }}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </>
  );
};

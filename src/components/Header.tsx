import React, { useState } from 'react';
import { 
  Radio, 
  SlidersHorizontal, 
  Share2, 
  Moon, 
  Sun, 
  Sparkles, 
  Search, 
  Cloud,
  Layers,
  Settings as SettingsIcon,
  Home,
  Library,
  ListMusic,
  BarChart3,
  Globe
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageModal } from './LanguageModal';
import { AuraAppIcon, AppIconTheme } from './AuraAppIcon';

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
  iconTheme?: AppIconTheme;
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
  iconTheme = 'cosmic-clef',
  userProfile
}) => {
  const { t, currentLanguageInfo } = useTranslation();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['OLED_BLACK', 'DARK_MATERIAL', 'LIGHT_AIR', 'DYNAMIC_ALBUM_ART'];
    const nextIndex = (modes.indexOf(themeMode) + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/85 border-b border-white/10 px-4 py-2.5 transition-all shadow-xl shadow-black/40">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          
          {/* TOP ULTRA-STYLISH SIGNATURE RIBBON: MADE BY AVIJIT */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Aura Hi-Res Audio</span>
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

            <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                DSP 32-Bit Lossless
              </span>
            </div>
          </div>

          {/* Main Top Row: Brand on left, clean Icon Actions on right */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Logo and Brand Title */}
            <div 
              className="flex items-center gap-2.5"
              title="Aura Hi-Res Audio Player"
            >
              <AuraAppIcon 
                size={36} 
                theme={iconTheme}
                variant="full" 
                animated={false} 
                glow={true} 
                className="transition-transform duration-300 hover:scale-105"
              />
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
                  <span>Aura</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    DSP
                  </span>
                </h1>
                <span className="text-[10px] text-zinc-400 font-medium tracking-wide">Hi-Res Player</span>
              </div>
            </div>

            {/* Clean Top Action Buttons (Icon-Only, Spacious, No Text Clutter) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language Switcher Button */}
              <button
                id="btn-language-header"
                onClick={() => setIsLanguageModalOpen(true)}
                title={`${t.header.language} (${currentLanguageInfo.nativeName})`}
                className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-xs font-medium">{currentLanguageInfo.nativeName}</span>
                <span className="sm:hidden text-xs">{currentLanguageInfo.flag}</span>
              </button>

              <button
                id="btn-p2p-header"
                onClick={onOpenP2P}
                title={t.header.p2pShare}
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition cursor-pointer"
                aria-label="P2P Transfer"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                id="btn-eq-header"
                onClick={onOpenEQ}
                title={t.header.equalizer}
                className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                aria-label="Equalizer"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                id="btn-system-header"
                onClick={onOpenSystem}
                title={t.header.systemTools}
                className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                aria-label="System Tools"
              >
                <Layers className="w-4 h-4 text-amber-400" />
              </button>

              <button
                id="btn-theme-header"
                onClick={toggleTheme}
                title={`${t.header.toggleTheme} (${themeMode})`}
                className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                aria-label="Toggle Theme"
              >
                {themeMode === 'LIGHT_AIR' ? (
                  <Sun className="w-4 h-4 text-yellow-400" />
                ) : themeMode === 'DYNAMIC_ALBUM_ART' ? (
                  <Sparkles className="w-4 h-4 text-pink-400" />
                ) : (
                  <Moon className="w-4 h-4 text-purple-400" />
                )}
              </button>

              <button
                id="btn-profile-header"
                onClick={onOpenProfile}
                title={t.header.profile}
                className="p-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition flex items-center justify-center cursor-pointer"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          </div>

          {/* Second Row: Clean Search Input & Desktop/Tablet Tabs */}
          <div className="flex items-center gap-3">
            {/* Full Width Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                id="input-global-search"
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white p-1"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Desktop/Tablet Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/10">
              <button
                id="tab-nav-home"
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t.nav.home}</span>
              </button>

              <button
                id="tab-nav-library"
                onClick={() => setCurrentTab('library')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'library'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>{t.nav.library}</span>
              </button>

              <button
                id="tab-nav-playlists"
                onClick={() => setCurrentTab('playlists')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'playlists'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>{t.nav.playlists}</span>
              </button>

              <button
                id="tab-nav-analytics"
                onClick={() => setCurrentTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.nav.analytics}</span>
              </button>

              <button
                id="tab-nav-settings"
                onClick={() => setCurrentTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>{t.nav.settings}</span>
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* Language Selection Dialog */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </>
  );
};

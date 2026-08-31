import React from 'react';
import { Home, Library, ListMusic, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface BottomNavProps {
  currentTab: 'home' | 'library' | 'playlists' | 'analytics' | 'settings';
  setCurrentTab: (tab: 'home' | 'library' | 'playlists' | 'analytics' | 'settings') => void;
  hasActivePlayer: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  hasActivePlayer
}) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home' as const, label: t.nav.home, icon: Home },
    { id: 'library' as const, label: t.nav.library, icon: Library },
    { id: 'playlists' as const, label: t.nav.playlists, icon: ListMusic },
    { id: 'analytics' as const, label: t.nav.analytics, icon: BarChart3 },
    { id: 'settings' as const, label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className={`md:hidden fixed left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 transition-all duration-300 ${
      hasActivePlayer ? 'bottom-[70px]' : 'bottom-0'
    }`}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition ${isActive ? 'bg-indigo-500/20' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px] text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

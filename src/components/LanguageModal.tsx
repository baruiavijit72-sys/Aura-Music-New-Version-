import React, { useState } from 'react';
import { Globe, Check, X, Search, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageCode } from '../i18n/languages';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, supportedLanguages, t } = useTranslation();
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-2xl bg-black/85 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-950/95 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {t.settings.languageSection}
              </h2>
              <p className="text-xs text-zinc-400">
                {t.settings.selectLanguage}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input for languages */}
        <div className="relative z-10">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search language / ভাষা খুঁজুন..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/50 transition"
          />
        </div>

        {/* Language Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-indigo-500/60 shadow-lg shadow-indigo-950/40 text-white ring-1 ring-indigo-500/40'
                      : 'bg-zinc-900/70 border-white/5 hover:bg-zinc-900 hover:border-white/20 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {lang.nativeName}
                        </span>
                        {lang.code === 'bn' && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            বাংলা
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {lang.name} • {lang.region}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick note & footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 relative z-10">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            100% Offline & Saved Locally
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition cursor-pointer"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  );
};

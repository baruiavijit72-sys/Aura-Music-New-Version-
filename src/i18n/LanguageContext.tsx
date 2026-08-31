import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageInfo, SUPPORTED_LANGUAGES } from './languages';
import { Translations, translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'aura_user_language_v1';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: Translations;
  currentLanguageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getInitialLanguage(): LanguageCode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }

    // Auto-detect from browser locale if available
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('bn')) return 'bn';
    if (browserLang.startsWith('hi')) return 'hi';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('ru')) return 'ru';
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (e) {
      console.warn('Could not save language preference', e);
    }

    // Set page direction for RTL languages like Arabic
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
      document.documentElement.dir = langInfo?.dir || 'ltr';
    }
  };

  useEffect(() => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = langInfo?.dir || 'ltr';
    }
  }, [language]);

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

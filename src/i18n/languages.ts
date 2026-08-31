export type LanguageCode = 
  | 'en' // English
  | 'bn' // Bengali (বাংলা)
  | 'hi' // Hindi (हिन्दी)
  | 'es' // Spanish (Español)
  | 'fr' // French (Français)
  | 'de' // German (Deutsch)
  | 'ja' // Japanese (日本語)
  | 'ar' // Arabic (العربية)
  | 'pt' // Portuguese (Português)
  | 'ru'; // Russian (Русский)

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'United States / Global',
    flag: '🇺🇸',
    dir: 'ltr',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'বাংলাদেশ / ভারত (West Bengal)',
    flag: '🇧🇩',
    dir: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'भारत (India)',
    flag: '🇮🇳',
    dir: 'ltr',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    region: 'España / América Latina',
    flag: '🇪🇸',
    dir: 'ltr',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    region: 'France / Monde',
    flag: '🇫🇷',
    dir: 'ltr',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    region: 'Deutschland / Österreich',
    flag: '🇩🇪',
    dir: 'ltr',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    region: '日本 (Japan)',
    flag: '🇯🇵',
    dir: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    region: 'الشرق الأوسط (Middle East)',
    flag: '🇸🇦',
    dir: 'rtl',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    region: 'Brasil / Portugal',
    flag: '🇧🇷',
    dir: 'ltr',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    region: 'Россия / СНГ',
    flag: '🇷🇺',
    dir: 'ltr',
  },
];

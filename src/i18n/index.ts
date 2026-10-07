import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import ar from './locales/ar/translation.json';

function updateDocumentLanguage(language: string) {
  const locale = language.startsWith('ar') ? 'ar' : 'en';
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  })
  .then(() => updateDocumentLanguage(i18n.language));

i18n.on('initialized', (options) => updateDocumentLanguage(options.lng ?? 'en'));
i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;
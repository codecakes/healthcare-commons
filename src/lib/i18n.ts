import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import existing language files
import en from '../locales/en.json';
import hi from '../locales/hi.json';

// Initialize with existing resources, more will be loaded lazily
const resources = {
  en: { translation: en },
  hi: { translation: hi }
};

// Define the supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },   // Hindi
  { code: 'bn', name: 'বাংলা' },    // Bengali
  { code: 'ta', name: 'தமிழ்' },    // Tamil
  { code: 'te', name: 'తెలుగు' },   // Telugu
  { code: 'mr', name: 'मराठी' },    // Marathi
  { code: 'gu', name: 'ગુજરાતી' },  // Gujarati
  { code: 'kn', name: 'ಕನ್ನಡ' },    // Kannada
  { code: 'ml', name: 'മലയാളം' }    // Malayalam
];

// Lazily load translations for languages other than English and Hindi
const loadLanguage = (language: string) => {
  if (language !== 'en' && language !== 'hi' && !i18n.hasResourceBundle(language, 'translation')) {
    try {
      // This would be replaced with proper dynamic import in a production app
      import(`../locales/${language}.json`)
        .then((module) => {
          i18n.addResourceBundle(language, 'translation', module.default);
        })
        .catch(error => {
          console.error(`Failed to load ${language} translation:`, error);
        });
    } catch (error) {
      console.error(`Error loading ${language} translation:`, error);
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: supportedLanguages.map(lang => lang.code),
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['navigator', 'localStorage'],
      caches: ['localStorage']
    },
    react: {
      useSuspense: false, // React suspense not needed for this app
    }
  });

// Language change handler with lazy loading
export const changeLanguage = (languageCode: string) => {
  loadLanguage(languageCode);
  return i18n.changeLanguage(languageCode);
};

export default i18n;

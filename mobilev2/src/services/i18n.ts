/**
 * ============================================
 * 🌍 i18n.ts - Salifz
 * ============================================
 * ✅ Service d'internationalisation
 * ✅ Support: Arabe, Français, Anglais
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

// Import des fichiers de traduction
import ar from '../locales/ar.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const LOG_PREFIX = '[i18n.ts]';

// Types
type TranslationKeys = typeof ar;
type SupportedLocale = 'ar' | 'en' | 'fr';

interface Translations {
  ar: TranslationKeys;
  en: Partial<TranslationKeys>;
  fr: Partial<TranslationKeys>;
}

// Traductions
const translations: Translations = {
  ar,
  en: en as Partial<TranslationKeys>,
  fr: fr as Partial<TranslationKeys>,
};

// État actuel
let currentLocale: SupportedLocale = 'ar';
let isInitialized = false;

// Listeners pour les changements de langue
type LocaleChangeListener = (locale: SupportedLocale) => void;
const listeners: Set<LocaleChangeListener> = new Set();

/**
 * Initialise le service i18n
 */
export const initI18n = async (): Promise<void> => {
  try {
    const savedLocale = await AsyncStorage.getItem('app_locale');
    if (savedLocale && ['ar', 'en', 'fr'].includes(savedLocale)) {
      currentLocale = savedLocale as SupportedLocale;
    } else {
      // Premier lancement : la langue du téléphone, pas un « ar » figé.
      // Un appareil en français ouvrait l'application en arabe — et rien ne
      // signalait qu'un sélecteur existait au fond des réglages. Le repli des
      // langues non couvertes est l'anglais.
      const langueAppareil = Localization.getLocales()[0]?.languageCode ?? '';
      currentLocale = (['ar', 'en', 'fr'].includes(langueAppareil)
        ? langueAppareil
        : 'en') as SupportedLocale;
    }
    
    // Configurer RTL pour l'arabe
    const isRTL = currentLocale === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
    
    isInitialized = true;
    console.log(`${LOG_PREFIX} ✅ Initialized with locale: ${currentLocale}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Init error:`, error);
    isInitialized = true;
  }
};

/**
 * Obtient la locale actuelle
 */
export const getLocale = (): SupportedLocale => {
  return currentLocale;
};

/**
 * Vérifie si une locale est supportée
 */
export const isSupportedLocale = (locale: string): locale is SupportedLocale => {
  return ['ar', 'en', 'fr'].includes(locale);
};

/**
 * Change la langue
 */
export const changeLanguage = async (locale: string): Promise<void> => {
  if (!isSupportedLocale(locale)) {
    console.warn(`${LOG_PREFIX} ⚠️ Invalid locale: ${locale}`);
    return;
  }

  try {
    currentLocale = locale;
    await AsyncStorage.setItem('app_locale', locale);
    
    // Configurer RTL
    const isRTL = locale === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
    
    // Notifier les listeners
    listeners.forEach(listener => listener(locale));
    
    console.log(`${LOG_PREFIX} ✅ Language changed to: ${locale}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ Change language error:`, error);
  }
};

/**
 * Ajoute un listener pour les changements de langue
 */
export const addLocaleChangeListener = (listener: LocaleChangeListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Obtient une valeur imbriquée d'un objet via un chemin (ex: "common.error")
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  
  return typeof result === 'string' ? result : undefined;
};

/**
 * Fonction de traduction principale
 * @param key - Clé de traduction (ex: "common.error")
 * @param params - Paramètres pour interpolation (ex: { count: 5 })
 */
export const t = (key: string, params?: Record<string, any>): string => {
  // Chercher dans la langue actuelle
  let translation = getNestedValue(translations[currentLocale], key);
  
  // Fallback vers l'arabe si non trouvé
  if (!translation && currentLocale !== 'ar') {
    translation = getNestedValue(translations.ar, key);
  }
  
  // Si toujours pas trouvé, retourner la clé
  if (!translation) {
    console.warn(`${LOG_PREFIX} ⚠️ Missing translation: ${key}`);
    return key;
  }
  
  // Interpolation des paramètres.
  //
  // Les fichiers de traduction utilisent la syntaxe `{{clé}}`, alors que cette
  // fonction ne remplaçait que `{clé}` : sur « المستوى {{level}} », seule la
  // partie intérieure était substituée et l'écran affichait « المستوى {1} ».
  // Les deux syntaxes sont désormais acceptées, la double d'abord.
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      // Les accolades sont des quantificateurs en expression régulière :
      // il faut les échapper.
      const name = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      translation = translation!
        .replace(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g'), String(value))
        .replace(new RegExp(`\\{\\s*${name}\\s*\\}`, 'g'), String(value));
    });
  }
  
  return translation;
};

/**
 * Vérifie si une clé de traduction existe
 */
export const hasTranslation = (key: string): boolean => {
  return getNestedValue(translations[currentLocale], key) !== undefined ||
         getNestedValue(translations.ar, key) !== undefined;
};

/**
 * Obtient la direction du texte
 */
export const getTextDirection = (): 'rtl' | 'ltr' => {
  return currentLocale === 'ar' ? 'rtl' : 'ltr';
};

/**
 * Vérifie si la langue actuelle est RTL
 */
export const isRTL = (): boolean => {
  return currentLocale === 'ar';
};

/**
 * Obtient toutes les locales supportées
 */
export const getSupportedLocales = (): SupportedLocale[] => {
  return ['ar', 'en', 'fr'];
};

/**
 * Obtient le nom d'une locale
 */
export const getLocaleName = (locale: SupportedLocale): string => {
  const names: Record<SupportedLocale, string> = {
    ar: 'العربية',
    en: 'English',
    fr: 'Français',
  };
  return names[locale] || locale;
};

// Export par défaut
export default {
  t,
  getLocale,
  changeLanguage,
  initI18n,
  addLocaleChangeListener,
  hasTranslation,
  getTextDirection,
  isRTL,
  getSupportedLocales,
  getLocaleName,
};
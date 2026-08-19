/**
 * Internationalisation — Salifz
 *
 * Trois langues : français (repli), arabe (RTL), anglais.
 *
 * Les namespaces sont chargés à la demande plutôt que tous d'un bloc : vingt-
 * quatre fichiers par langue dans le bundle initial pèseraient plus que
 * l'application elle-même, pour du texte que l'utilisateur ne verra jamais.
 *
 * Le français est la locale de repli — pas l'anglais. C'est la langue de
 * référence du produit, et une chaîne manquante doit tomber sur la version la
 * plus soignée, pas sur une traduction intermédiaire.
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

import { MOIS_HEGIRIENS, ERE_HEGIRIENNE } from './hegire';

export const LOCALES = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Les seules langues écrites de droite à gauche du produit. */
const RTL: readonly string[] = ['ar'];

export const isRTL = (locale: string) => RTL.includes(locale);

export const NOMS_LOCALES: Record<Locale, string> = {
  // Chaque langue est nommée dans sa propre écriture : personne ne cherche
  // « Arabic » dans une liste, on cherche « العربية ».
  fr: 'Français',
  ar: 'العربية',
  en: 'English',
};

/**
 * Applique la direction et la langue au document.
 *
 * `lang` importe autant que `dir` : c'est lui qui fait basculer la voix des
 * lecteurs d'écran et qui déclenche les ajustements typographiques arabes
 * définis dans le thème.
 */
export function appliquerDirection(locale: string) {
  const racine = document.documentElement;
  racine.lang = locale;
  racine.dir = isRTL(locale) ? 'rtl' : 'ltr';
}

i18next
  .use(
    resourcesToBackend(
      (langue: string, namespace: string) =>
        import(`./locales/${langue}/${namespace}.json`)
    )
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    supportedLngs: LOCALES,
    defaultNS: 'common',
    ns: ['common'],

    detection: {
      // L'ordre compte : un choix explicite de l'utilisateur prime toujours
      // sur la préférence du navigateur.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'salifz:locale',
      caches: ['localStorage'],
    },

    interpolation: {
      // React échappe déjà : doubler l'échappement produirait des `&#39;`
      // visibles dans l'interface.
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

i18next.on('languageChanged', appliquerDirection);

// Appliqué aussi au démarrage : `languageChanged` ne se déclenche pas pour la
// langue initiale.
appliquerDirection(i18next.language || 'fr');

export default i18next;

/**
 * Formatage des nombres et des dates par la locale active.
 *
 * Les jours de la semaine s'affichaient en anglais (`Wed Thu Fri`) dans une
 * interface française : c'était un `toLocaleDateString` sans locale explicite.
 * Ces fonctions existent pour qu'aucun écran n'ait à s'en souvenir.
 */
export function formaterNombre(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formaterDate(
  date: Date | string | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

/** Jour de la semaine abrégé — utilisé par les histogrammes de statistiques. */
export function jourAbrege(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(date));
}

/**
 * Date hégirienne. `Intl` sait la produire via le calendrier `islamic-umalqura`,
 * qui est celui utilisé en Arabie saoudite et le plus proche des calendriers
 * imprimés dans les mushafs.
 */
export function dateHegirienne(date: Date | string, locale: string): string {
  try {
    // L'arabe est bien servi par `Intl` : ses propres mois y sont nommes et
    // l'annee s'ecrit en chiffres arabes. On ne touche a rien.
    if (locale === 'ar') {
      return new Intl.DateTimeFormat('ar-SA', {
        calendar: 'islamic-umalqura',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(date));
    }

    // Pour le francais et l'anglais, `Intl` ne sait convertir que les nombres :
    // il rendait « 6 rabia al awal 1448 AH » au milieu d'une interface
    // francaise. On lui demande donc les composantes, et on nomme le mois
    // nous-memes.
    const parties = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      calendar: 'islamic-umalqura',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(new Date(date));

    const valeur = (type: string) => parties.find((p) => p.type === type)?.value ?? '';
    const jour = valeur('day');
    const annee = valeur('year');
    const rang = Number(valeur('month'));

    const mois = MOIS_HEGIRIENS[locale]?.[rang - 1];
    const ere = ERE_HEGIRIENNE[locale];
    if (!mois || !jour || !annee) return '';

    return `${jour} ${mois} ${annee} ${ere}`;
  } catch {
    // Un environnement sans donnees de calendrier islamique ne doit pas faire
    // tomber l'ecran : on renvoie une chaine vide, l'appelant l'omet.
    return '';
  }
}

/**
 * Isole un segment latin dans un texte arabe.
 *
 * Sans cela, « Al-Fatiha · 7 versets » se réordonne de travers : l'algorithme
 * bidi place les chiffres et le nom latin dans un ordre que personne n'a voulu.
 * FSI/PDI délimitent le segment et neutralisent le problème.
 */
export function isolerLatin(texte: string): string {
  return `⁦${texte}⁩`;
}

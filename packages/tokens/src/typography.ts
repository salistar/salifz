/**
 * Typographie — Salifz
 *
 * Quatre familles, chacune pour une raison précise :
 *
 * - **Amiri** pour les titres. Son compagnon latin a été dessiné pour
 *   s'harmoniser avec l'arabe : une seule famille tient les trois scripts,
 *   ce qui est vrai du sujet et rare dans les interfaces.
 * - **IBM Plex Sans Arabic** pour l'interface. Couvre latin, arabe et chiffres
 *   arabo-indiens avec des proportions communes, et tient en petites tailles.
 * - **IBM Plex Mono** pour les données. Chiffres tabulaires : les colonnes de
 *   statistiques s'alignent verticalement.
 * - **KFGQPC HAFS Uthmanic** pour le texte coranique, et lui seul.
 *
 * Règle absolue : le texte coranique n'utilise jamais une police d'interface,
 * dans aucun contexte — aperçu, notification, bouton compris.
 */

export const fontFamily = {
  display: "'Amiri', Georgia, serif",
  ui: "'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', sans-serif",
  data: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  // Le repli Amiri Quran est le seul acceptable : il reproduit le rasm.
  quran: "'KFGQPC HAFS Uthmanic Script', 'Amiri Quran', 'Scheherazade New', serif",
} as const;

/**
 * Échelle. Base 16 px, ratio 1.2 pour l'interface, 1.333 pour l'éditorial.
 *
 * L'interlignage coranique n'est jamais inférieur à 2.0 : en dessous, les
 * signes de waqf, la hamza et les voyelles superposées se chevauchent.
 * Vérifié sur `اللَّهِ` et sur les versets d'Al-Baqara portant un signe de sajda.
 */
export const type = {
  displayXl: { size: 56, line: 60, family: 'display', weight: 700 },
  displayLg: { size: 40, line: 46, family: 'display', weight: 700 },
  displayMd: { size: 30, line: 38, family: 'display', weight: 600 },

  titleLg: { size: 22, line: 30, family: 'ui', weight: 600 },
  titleMd: { size: 18, line: 26, family: 'ui', weight: 600 },

  bodyLg: { size: 17, line: 28, family: 'ui', weight: 400 },
  body: { size: 15, line: 24, family: 'ui', weight: 400 },
  caption: { size: 13, line: 18, family: 'ui', weight: 450 },
  overline: { size: 11, line: 14, family: 'ui', weight: 600, tracking: 0.14, upper: true },

  dataXl: { size: 36, line: 40, family: 'data', weight: 500 },
  data: { size: 15, line: 20, family: 'data', weight: 500 },

  quranLg: { size: 34, line: 68, family: 'quran', weight: 400 },
  quranMd: { size: 26, line: 56, family: 'quran', weight: 400 },
  quranSm: { size: 20, line: 44, family: 'quran', weight: 400 },
} as const;

export type TypeToken = keyof typeof type;

/**
 * Ajustements par langue.
 *
 * L'arabe se lit plus petit à hauteur d'œil équivalente : +1 px sur le corps.
 * Et l'arabe fin se délave sur fond sombre, d'où la graisse minimale.
 */
export const languageAdjust = {
  ar: { sizeDelta: 1, minWeight: 500 },
  fr: { sizeDelta: 0, minWeight: 400 },
  en: { sizeDelta: 0, minWeight: 400 },
} as const;

/**
 * Chiffres arabo-indiens : uniquement en locale `ar`, et uniquement pour les
 * numéros de verset, page, juz et hizb.
 *
 * Les statistiques, l'XP et les prix restent en chiffres latins dans toutes
 * les langues — un prix lu de travers coûte plus cher qu'une incohérence
 * typographique.
 */
export function toArabicNumerals(n: number | string): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

/** Numéro structurel : arabo-indien en `ar`, latin ailleurs. */
export function structuralNumber(n: number | string, locale: string): string {
  return locale === 'ar' ? toArabicNumerals(n) : String(n);
}

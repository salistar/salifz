/**
 * Chiffres arabo-indiens.
 *
 * Réservés à la locale arabe **et** aux numéros structurels : verset, page,
 * juz, hizb. Les statistiques, l'XP et les prix restent en chiffres latins
 * dans toutes les langues — un prix lu de travers coûte plus cher qu'une
 * incohérence typographique.
 */

const ARABO_INDIENS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicNumerals(n: number | string): string {
  return String(n).replace(/\d/g, (d) => ARABO_INDIENS[Number(d)]);
}

/** Numéro structurel du codex : arabo-indien en `ar`, latin partout ailleurs. */
export function structuralNumber(n: number | string, locale: string): string {
  return locale === 'ar' ? toArabicNumerals(n) : String(n);
}

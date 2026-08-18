/**
 * Libellés localisés venus du serveur.
 *
 * Le modèle de données stocke les textes visibles sous la forme
 * `{ ar, en, fr }`. Les rendre directement fait planter React — « Objects are
 * not valid as a React child » — et la page entière disparaît.
 *
 * Cette fonction était recopiée à l'identique dans cinq pages. Une divergence
 * entre deux copies suffirait à ce qu'un écran plante là où un autre tient.
 */
export type Localise = string | { ar?: string; en?: string; fr?: string } | null | undefined;

export function label(valeur: Localise, locale: 'fr' | 'en' | 'ar' = 'fr'): string {
  if (valeur == null) return '';
  if (typeof valeur === 'string') return valeur;
  if (typeof valeur === 'object') {
    // Repli en cascade : mieux vaut un libellé dans une autre langue qu'un
    // espace vide là où l'utilisateur attend un nom.
    return valeur[locale] ?? valeur.fr ?? valeur.en ?? valeur.ar ?? '';
  }
  return String(valeur);
}

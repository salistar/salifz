import { useTranslation as useTranslationHook } from 'react-i18next';

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

/**
 * Version liée à la locale active.
 *
 * `label()` prend la locale en second argument, avec le français par défaut.
 * Appelée sans ce paramètre — ce qui était le cas partout — elle rendait donc
 * du français à un utilisateur arabophone, alors que le serveur envoyait bien
 * les trois langues. Ce hook retire l'occasion de l'oublier.
 */
export function useLabel() {
  const { i18n } = useTranslationHook();
  const locale = (i18n.resolvedLanguage ?? 'fr') as 'fr' | 'en' | 'ar';
  return (valeur: Localise) => label(valeur, locale);
}

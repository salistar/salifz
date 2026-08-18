/**
 * Tokens de couleur — Salifz
 *
 * Source unique, consommée par le web (variables CSS) et par le mobile
 * (StyleSheet). Deux fichiers de couleurs qui divergent, c'est un thème sombre
 * qui marche d'un côté et pas de l'autre.
 *
 * Direction : « émeraude anobli ». L'émeraude passe de peinture à pierre —
 * vert profond dans les fonds, émeraude vive réservée au signal d'action.
 * L'or est un filet, jamais une surface : bordures, chiffres, ornements.
 *
 * Le code ne référence jamais un hex ni un nom de teinte, uniquement un rôle.
 */

/** Palette brute. Ne pas consommer directement : passer par `semantic`. */
export const palette = {
  ink950: '#06120E',
  ink900: '#0A1B15',
  ink800: '#0F251D',
  ink700: '#163227',
  ink600: '#1E4034',

  emerald600: '#0F7B5A',
  emerald500: '#149A70',
  emerald400: '#34C08A',
  emerald300: '#6FD6AE',

  gold600: '#A8871C',
  gold500: '#C9A227',
  gold300: '#E8CE7A',

  ivory50: '#FBF8F1',
  ivory100: '#F4EFE3',
  ivory200: '#E7DECB',

  sand600: '#8A7F6A',
  garnet500: '#A63A2E',
  saffron500: '#D98E23',
  lapis500: '#2E5E8A',
} as const;

/**
 * Rôles sémantiques.
 *
 * Le thème clair n'est pas une variante secondaire : beaucoup d'utilisateurs
 * mémorisent le matin. Il est ivoire chaud — jamais blanc pur en fond — avec
 * des filets d'or plus soutenus pour compenser la perte de contraste.
 */
export const semantic = {
  dark: {
    bg: '#06120E',
    bgElevated: '#0A1B15',
    surface: '#0F251D',
    surfaceHover: '#163227',
    surfaceSunken: '#040D0A',
    border: '#1E4034',
    borderStrong: '#2A5442',
    borderGold: 'rgba(201,162,39,0.28)',
    text: '#F4EFE3',
    textMuted: '#9FB3A9',
    textFaint: '#6C8479',
    textOnBrand: '#04120C',
    brand: '#149A70',
    brandHover: '#34C08A',
    brandSunken: '#0F7B5A',
    accent: '#C9A227',
    accentText: '#E8CE7A',
    danger: '#C4503F',
    warning: '#D98E23',
    info: '#5B92C4',
    focusRing: '#34C08A',
    overlay: 'rgba(4,13,10,0.72)',
  },
  light: {
    bg: '#FBF8F1',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#F4EFE3',
    surfaceSunken: '#F0EADC',
    border: '#E7DECB',
    borderStrong: '#D6C9AE',
    borderGold: 'rgba(168,135,28,0.35)',
    text: '#0B1F17',
    textMuted: '#4A5D54',
    textFaint: '#8A7F6A',
    textOnBrand: '#FFFFFF',
    brand: '#0F7B5A',
    brandHover: '#0C6449',
    brandSunken: '#149A70',
    accent: '#A8871C',
    accentText: '#8A6E12',
    danger: '#A63A2E',
    warning: '#B4720F',
    info: '#2E5E8A',
    focusRing: '#0F7B5A',
    overlay: 'rgba(11,31,23,0.45)',
  },
} as const;

export type Theme = keyof typeof semantic;
export type ColorRole = keyof typeof semantic.dark;

/** Génère le bloc de variables CSS d'un thème, pour injection dans une feuille. */
export function cssVariables(theme: Theme): string {
  return Object.entries(semantic[theme])
    // `bgElevated` devient `--bg-elevated` : les noms CSS restent en kebab-case.
    .map(([role, value]) => `  --${role.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}: ${value};`)
    .join('\n');
}

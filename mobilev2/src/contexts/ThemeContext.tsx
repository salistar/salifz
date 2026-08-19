/**
 * Thème — Salifz
 *
 * Ce contexte existait déjà (palette claire + palette sombre + détection du
 * thème système) mais **aucun des 40 écrans ne l'importait** : le sélecteur
 * clair / sombre / auto des réglages écrivait bien dans le store, et rien ne
 * changeait à l'écran. En parallèle, 1 586 couleurs hexadécimales étaient
 * écrites en dur dans 57 fichiers.
 *
 * Les jetons ci-dessous couvrent l'intégralité de la palette réellement
 * utilisée dans l'application. Le mode clair reprend exactement les valeurs
 * historiques : à thème clair, le rendu est identique à avant.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores';

type ThemeMode = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Fonds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;

  // Fonds profonds : dégradés d'authentification, splash, en-têtes immersifs
  canvasDeep: string;
  canvasDeepAlt: string;

  // Texte
  text: string;
  textSecondary: string;
  textMuted: string;
  onPrimary: string;
  onDeep: string;

  // Marque
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;

  // Accent (dégradés violets des écrans sociaux et d'authentification)
  accent: string;
  accentDeep: string;
  accentSoft: string;

  // États
  error: string;
  errorSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  warningStrong: string;
  info: string;
  infoSoft: string;
  infoStrong: string;

  // Structure
  border: string;
  divider: string;
  overlay: string;
  shadow: string;

  // Neutres
  neutral: string;
  neutralSoft: string;
}

/**
 * Couleurs qui ne dépendent pas du thème : métaux des ligues, or des
 * récompenses. Les inverser en mode sombre les rendrait méconnaissables.
 */
export const fixedColors = {
  gold: '#c9a227',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  diamond: '#B9F2FF',
  platinum: '#E5E4E2',
  master: '#9B59B6',
  streak: '#b4720f',
  gem: '#4FC3F7',
  heart: '#F44336',
} as const;

/**
 * Palette claire — ivoire et emeraude.
 *
 * Les valeurs sont exactement celles de `web/src/theme.css` : le meme compte
 * ouvre les deux applications, et deux verts differents pour un meme produit
 * se remarquent immediatement. Le contrat de jetons ne change pas, seules les
 * valeurs bougent — les quarante ecrans adoptent la palette sans etre touches.
 *
 * Le vert Material `#4CAF50` qui servait de marque est celui de trois mille
 * applications ; l'emeraude sombre porte l'identite du produit et laisse a
 * l'or le role d'accent, comme dans les enluminures de mushaf.
 */
const lightColors: ThemeColors = {
  background: '#fbf8f1',
  backgroundAlt: '#f0eadc',
  surface: '#ffffff',
  surfaceAlt: '#f4efe3',
  surfaceRaised: '#ffffff',

  canvasDeep: '#0b1f17',
  canvasDeepAlt: '#0f2b20',

  text: '#0b1f17',
  textSecondary: '#4a5d54',
  textMuted: '#8a7f6a',
  onPrimary: '#ffffff',
  onDeep: '#ffffff',

  primary: '#0f7b5a',
  primaryDark: '#0c6449',
  primaryLight: '#149a70',
  primarySoft: '#e4f0ea',

  // L'accent n'est plus un violet : c'est l'or des enluminures, la seule
  // couleur du produit qui ne vienne pas du vert.
  accent: '#a8871c',
  accentDeep: '#8a6e12',
  accentSoft: '#f7f0dd',

  error: '#a63a2e',
  errorSoft: '#f7e6e3',
  success: '#0f7b5a',
  successSoft: '#e4f0ea',
  warning: '#b4720f',
  warningSoft: '#f9efdd',
  warningStrong: '#8f5a0b',
  info: '#2e5e8a',
  infoSoft: '#e3ecf4',
  infoStrong: '#1f4463',

  border: '#e7decb',
  divider: '#f0eadc',
  overlay: 'rgba(11, 31, 23, 0.45)',
  shadow: '#0b1f17',

  neutral: '#8a7f6a',
  neutralSoft: '#f0eadc',
};

/**
 * Palette sombre — vert profond, pas gris bleute.
 *
 * L'ancienne version virait au bleu nuit (`#12121C`), sans rapport avec la
 * marque. Ici le fond reste vert : c'est la meme identite a la tombee du jour,
 * et l'or y gagne le contraste qu'il n'avait pas sur l'ivoire.
 */
const darkColors: ThemeColors = {
  background: '#06120e',
  backgroundAlt: '#0a1b15',
  surface: '#0f251d',
  surfaceAlt: '#163227',
  surfaceRaised: '#1a3b2e',

  canvasDeep: '#040d0a',
  canvasDeepAlt: '#0a1b15',

  text: '#f4efe3',
  textSecondary: '#9fb3a9',
  textMuted: '#6c8479',
  onPrimary: '#04120c',
  onDeep: '#f4efe3',

  // Verts eclaircis : sur fond sombre, `#0f7b5a` n'atteint pas 4,5:1.
  primary: '#149a70',
  primaryDark: '#0f7b5a',
  primaryLight: '#34c08a',
  primarySoft: '#0f2b20',

  accent: '#c9a227',
  accentDeep: '#e8ce7a',
  accentSoft: '#1a1608',

  error: '#c4503f',
  errorSoft: '#2e1512',
  success: '#149a70',
  successSoft: '#0f2b20',
  warning: '#d98e23',
  warningSoft: '#2e2109',
  warningStrong: '#f0ab45',
  info: '#5b92c4',
  infoSoft: '#132231',
  infoStrong: '#8ab6de',

  border: '#1e4034',
  divider: '#163227',
  overlay: 'rgba(4, 13, 10, 0.72)',
  shadow: '#000000',

  neutral: '#6c8479',
  neutralSoft: '#163227',
};

/** Dégradés courants, dérivés des jetons pour rester cohérents. */
export const makeGradients = (c: ThemeColors) => ({
  primary: [c.primary, c.primaryDark] as [string, string],
  accent: [c.accent, c.accentDeep] as [string, string],
  canvas: [c.canvasDeep, c.canvasDeepAlt] as [string, string],
  surface: [c.surface, c.surfaceAlt] as [string, string],
});

interface ThemeContextType {
  theme: ThemeMode;
  preference: ThemePreference;
  colors: ThemeColors;
  gradients: ReturnType<typeof makeGradients>;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { theme: preference, setTheme: setStoredTheme } = useSettingsStore();

  // Le thème est *dérivé* de la préférence enregistrée, il n'est plus dupliqué
  // dans un état local. L'ancienne version gardait une copie qui ne se
  // resynchronisait qu'en mode « auto » : choisir « sombre » dans les réglages
  // n'avait donc aucun effet.
  const resolved: ThemeMode =
    preference === 'auto'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : (preference as ThemeMode) === 'dark'
      ? 'dark'
      : 'light';

  const value = useMemo<ThemeContextType>(() => {
    const colors = resolved === 'dark' ? darkColors : lightColors;
    return {
      theme: resolved,
      preference: (preference as ThemePreference) || 'auto',
      colors,
      gradients: makeGradients(colors),
      isDark: resolved === 'dark',
      toggleTheme: () => setStoredTheme(resolved === 'light' ? 'dark' : 'light'),
      setTheme: (next: ThemePreference) => setStoredTheme(next),
    };
  }, [resolved, preference, setStoredTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé à l’intérieur d’un ThemeProvider');
  }
  return context;
}

/** Raccourci : seulement les couleurs. */
export const useThemeColors = (): ThemeColors => useTheme().colors;

// ---------------------------------------------------------------------------
// Jetons non chromatiques (identiques dans les deux thèmes)
// ---------------------------------------------------------------------------

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 28, fontWeight: '700' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  h4: { fontSize: 20, fontWeight: '600' as const },
  h5: { fontSize: 18, fontWeight: '600' as const },
  h6: { fontSize: 16, fontWeight: '600' as const },
  body1: { fontSize: 16, fontWeight: '400' as const },
  body2: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, full: 9999 };

/**
 * Palette statique conservée pour les rares usages hors composant React
 * (constantes de configuration). À l'intérieur d'un composant, préférer
 * `useTheme()` : c'est la seule voie qui suit le thème choisi.
 */
export const colors = {
  primary: {
    50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A',
    500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20',
  },
  secondary: {
    50: '#FFF8E1', 100: '#FFECB3', 200: '#FFE082', 300: '#FFD54F', 400: '#FFCA28',
    500: '#FFC107', 600: '#FFB300', 700: '#FFA000', 800: '#FF8F00', 900: '#FF6F00',
  },
  gray: {
    50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD',
    500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121',
  },
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

export { lightColors, darkColors };
export type { ThemeColors, ThemeMode, ThemePreference };

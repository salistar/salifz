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
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  diamond: '#B9F2FF',
  platinum: '#E5E4E2',
  master: '#9B59B6',
  streak: '#FF6B35',
  gem: '#4FC3F7',
  heart: '#F44336',
} as const;

const lightColors: ThemeColors = {
  background: '#F5F5F5',
  backgroundAlt: '#F0F0F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  surfaceRaised: '#FFFFFF',

  canvasDeep: '#1A1A2E',
  canvasDeepAlt: '#16213E',

  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#9E9E9E',
  onPrimary: '#FFFFFF',
  onDeep: '#FFFFFF',

  primary: '#4CAF50',
  primaryDark: '#2E7D32',
  primaryLight: '#6BCB77',
  primarySoft: '#E8F5E9',

  accent: '#667EEA',
  accentDeep: '#764BA2',
  accentSoft: '#FCE4EC',

  error: '#F44336',
  errorSoft: '#FFEBEE',
  success: '#4CAF50',
  successSoft: '#E8F5E9',
  warning: '#FF9800',
  warningSoft: '#FFF3E0',
  warningStrong: '#F57C00',
  info: '#2196F3',
  infoSoft: '#E3F2FD',
  infoStrong: '#1976D2',

  border: '#E0E0E0',
  divider: '#EEEEEE',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',

  neutral: '#9E9E9E',
  neutralSoft: '#F0F0F0',
};

const darkColors: ThemeColors = {
  background: '#12121C',
  backgroundAlt: '#1A1A2E',
  surface: '#1E1E32',
  surfaceAlt: '#252540',
  surfaceRaised: '#2A2A45',

  // En mode sombre, les fonds profonds sont ceux de toute l'application.
  canvasDeep: '#12121C',
  canvasDeepAlt: '#1A1A2E',

  text: '#F5F5F5',
  textSecondary: '#B0B6C4',
  textMuted: '#7A8194',
  onPrimary: '#0E1611',
  onDeep: '#FFFFFF',

  // Verts éclaircis : sur fond sombre, #4CAF50 n'atteint pas 4.5:1.
  primary: '#66BB6A',
  primaryDark: '#43A047',
  primaryLight: '#81C784',
  primarySoft: '#1F3325',

  accent: '#8B9CF7',
  accentDeep: '#9B6BC7',
  accentSoft: '#33243A',

  error: '#EF5350',
  errorSoft: '#3A1F1F',
  success: '#66BB6A',
  successSoft: '#1F3325',
  warning: '#FFA726',
  warningSoft: '#3A2E1C',
  warningStrong: '#FFB74D',
  info: '#64B5F6',
  infoSoft: '#1C2A3A',
  infoStrong: '#90CAF9',

  border: '#33344A',
  divider: '#2A2B3D',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',

  neutral: '#7A8194',
  neutralSoft: '#252540',
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

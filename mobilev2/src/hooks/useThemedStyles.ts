/**
 * useThemedStyles — Salifz
 *
 * `StyleSheet.create({...})` est évalué une seule fois, au chargement du
 * module : il ne peut pas lire un thème qui vit dans un contexte React. C'est
 * la raison technique pour laquelle les 40 écrans avaient leurs couleurs en
 * dur.
 *
 * La feuille de style devient donc une fonction des couleurs, et ce crochet la
 * recalcule quand le thème change — une seule fois par thème, grâce au cache.
 *
 *   const makeStyles = (c: ThemeColors) => StyleSheet.create({
 *     card: { backgroundColor: c.surface, borderColor: c.border },
 *   });
 *
 *   export default function Écran() {
 *     const styles = useThemedStyles(makeStyles);
 *     const { colors } = useTheme();   // pour les couleurs hors StyleSheet
 *     ...
 *   }
 */

import { useMemo } from 'react';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

type StyleFactory<T> = (colors: ThemeColors, isDark: boolean) => T;

// Une feuille par fabrique et par thème : recalculée au premier rendu dans ce
// thème, puis réutilisée. Sans ce cache, chaque écran reconstruirait sa feuille
// à chaque rendu.
const cache = new WeakMap<StyleFactory<any>, Partial<Record<string, any>>>();

export function useThemedStyles<T>(factory: StyleFactory<T>): T {
  const { colors, theme, isDark } = useTheme();

  return useMemo(() => {
    let perTheme = cache.get(factory);
    if (!perTheme) {
      perTheme = {};
      cache.set(factory, perTheme);
    }
    if (!perTheme[theme]) {
      perTheme[theme] = factory(colors, isDark);
    }
    return perTheme[theme] as T;
  }, [factory, theme, colors, isDark]);
}

export default useThemedStyles;

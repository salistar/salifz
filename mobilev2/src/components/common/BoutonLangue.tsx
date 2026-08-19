/**
 * Bouton de langue flottant — Salifz
 *
 * Visible sur tous les écrans, il cycle entre les trois langues d'un appui.
 * Il existe parce que le sélecteur des réglages était introuvable : quatre
 * niveaux de navigation pour changer de langue, c'est un sélecteur que
 * personne ne trouve — surtout quand l'interface s'affiche dans une écriture
 * qu'on ne lit pas.
 *
 * Le changement est appliqué par `changeLanguage`, et App.tsx remonte tout
 * l'arbre (clé de rendu = locale) : chaque écran relit ses traductions.
 * Passer de/vers l'arabe inverse aussi le sens de lecture — ce basculement
 * RTL/LTR ne prend pleinement effet qu'au prochain démarrage de l'app,
 * limite de React Native, pas de ce bouton.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { changeLanguage, getLocale } from '../../services/i18n';
import { useTheme } from '../../contexts/ThemeContext';

const ORDRE = ['ar', 'fr', 'en'] as const;
const ETIQUETTES: Record<string, string> = { ar: 'ع', fr: 'FR', en: 'EN' };

export default function BoutonLangue() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const locale = getLocale();

  const suivant = async () => {
    const position = ORDRE.indexOf(locale as (typeof ORDRE)[number]);
    const prochaine = ORDRE[(position + 1) % ORDRE.length];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeLanguage(prochaine);
  };

  return (
    <Pressable
      onPress={suivant}
      accessibilityRole="button"
      accessibilityLabel={`Langue : ${ETIQUETTES[locale]}`}
      hitSlop={10}
      style={[
        styles.bouton,
        {
          top: insets.top + 8,
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      <Text style={styles.globe}>🌐</Text>
      <Text style={[styles.code, { color: colors.text }]}>{ETIQUETTES[locale]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    position: 'absolute',
    // Toujours à droite, quel que soit le sens de lecture : `right` n'est pas
    // inversé par le RTL sur une position absolue, le bouton reste au même
    // endroit physique — c'est voulu, un contrôle global ne doit pas bouger.
    right: 10,
    zIndex: 1000,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  globe: { fontSize: 13 },
  code: { fontSize: 12, fontWeight: '700' },
});

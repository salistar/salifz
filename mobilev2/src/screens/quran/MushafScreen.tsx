/**
 * MushafScreen — Salifz
 *
 * Vue page par page du Mushaf de Médine (604 pages).
 *
 * C'est la vue par défaut de tous les concurrents (Quran.com, Muslim Pro,
 * Elmohafez) et elle manquait entièrement. Elle compte parce que les hafiz
 * mémorisent la **position** des mots sur la page : « en haut à gauche de la
 * page 293 » est un repère de rappel aussi fort que le texte lui-même. Une
 * liste de versets détache la mémoire de ce repère.
 *
 * L'écran intègre aussi le **masquage progressif**, technique centrale de la
 * mémorisation : on relit la page en cachant de plus en plus de texte jusqu'à
 * réciter de mémoire. Toucher un mot le dévoile le temps d'un doute.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { quranAPI } from '../../services/api';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[MushafScreen.tsx]';
const TOTAL_PAGES = 604;

interface MushafWord {
  position: number;
  line: number;
  text: string;
  isEnd: boolean;
  verseKey: string;
}

interface MushafLine {
  line: number;
  words: MushafWord[];
}

interface MushafPage {
  page: number;
  juz: number | null;
  hizb: number | null;
  surahs: number[];
  lines: MushafLine[];
  verses: { verseKey: string; surahNumber: number; ayahNumber: number }[];
}

/**
 * Niveaux de masquage, du plus permissif au plus exigeant.
 * `reveal` reçoit l'index du mot dans sa ligne et décide s'il reste lisible.
 */
type MaskLevel = 0 | 1 | 2 | 3;

const MASK_LEVELS: {
  level: MaskLevel;
  labelKey: string;
  fallback: string;
  icon: keyof typeof Ionicons.glyphMap;
  reveal: (indexInLine: number) => 'full' | 'hint' | 'hidden';
}[] = [
  {
    level: 0,
    labelKey: 'mushaf.mask.full',
    fallback: 'Texte complet',
    icon: 'eye',
    reveal: () => 'full',
  },
  {
    level: 1,
    labelKey: 'mushaf.mask.firstWord',
    fallback: 'Premier mot',
    // Le premier mot de chaque ligne suffit souvent à relancer la récitation.
    icon: 'contrast',
    reveal: (i) => (i === 0 ? 'full' : 'hint'),
  },
  {
    level: 2,
    labelKey: 'mushaf.mask.hints',
    fallback: 'Indices',
    icon: 'eye-off',
    reveal: () => 'hint',
  },
  {
    level: 3,
    labelKey: 'mushaf.mask.hidden',
    fallback: 'Masqué',
    icon: 'lock-closed',
    reveal: () => 'hidden',
  },
];

export default function MushafScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const initialPage = Number(route?.params?.page) || 1;

  const [page, setPage] = useState<number>(initialPage);
  const [data, setData] = useState<MushafPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maskLevel, setMaskLevel] = useState<MaskLevel>(0);
  // Mots dévoilés à la main : réinitialisés à chaque page et à chaque
  // changement de niveau, pour que l'exercice reparte à zéro.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const loadPage = useCallback(async (target: number) => {
    console.log(`${LOG_PREFIX} 📖 Chargement page ${target}`);
    setLoading(true);
    setError(null);
    try {
      const response: any = await quranAPI.getPage(target);
      const payload = response?.data ?? response;
      setData(payload);
      setRevealed(new Set());
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌`, e?.message);
      setError(t('errors.generic'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const goTo = (target: number) => {
    if (target < 1 || target > TOTAL_PAGES) return;
    Haptics.selectionAsync();
    setPage(target);
  };

  const cycleMask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMaskLevel((prev) => ((prev + 1) % MASK_LEVELS.length) as MaskLevel);
    setRevealed(new Set());
  };

  const activeMask = MASK_LEVELS[maskLevel];

  const toggleWord = (key: string) => {
    if (maskLevel === 0) return;
    Haptics.selectionAsync();
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const header = useMemo(() => {
    if (!data) return '';
    const parts = [`${t('mushaf.page', { page: data.page }) || `Page ${data.page}`}`];
    if (data.juz) parts.push(`${t('quran.juz') || 'Juz'} ${data.juz}`);
    if (data.hizb) parts.push(`${t('quran.hizb') || 'Hizb'} ${data.hizb}`);
    return parts.join(' · ');
  }, [data]);

  const renderWord = (word: MushafWord, indexInLine: number) => {
    const key = `${word.verseKey}-${word.position}`;

    // Le rond de fin de verset porte le numéro : jamais masqué, il structure
    // la page et sert de repère visuel.
    if (word.isEnd) {
      return (
        <Text key={key} style={styles.endMarker}>
          {word.text}
        </Text>
      );
    }

    const state = revealed.has(key) ? 'full' : activeMask.reveal(indexInLine);

    if (state === 'full') {
      return (
        <Text
          key={key}
          style={styles.word}
          onPress={() => toggleWord(key)}
          suppressHighlighting
        >
          {word.text}{' '}
        </Text>
      );
    }

    // « Indice » : la première lettre reste, le reste devient un trait.
    // C'est assez pour reconnaître le mot sans le lire.
    const label =
      state === 'hint' ? `${Array.from(word.text)[0] ?? ''}‌…` : '   ';

    return (
      <Text
        key={key}
        style={[styles.word, styles.maskedWord]}
        onPress={() => toggleWord(key)}
        suppressHighlighting
        accessibilityLabel={t('mushaf.revealWord') || 'Dévoiler le mot'}
      >
        {label}{' '}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('common.back') || 'Retour'}
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onDeep} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{header}</Text>
        </View>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={activeMask.fallback}
          accessibilityHint={t('mushaf.mask.hint') || 'Change le niveau de masquage'}
          onPress={cycleMask}
          style={[styles.headerButton, maskLevel > 0 && styles.headerButtonActive]}
        >
          <Ionicons name={activeMask.icon} size={20} color={colors.onDeep} />
        </TouchableOpacity>
      </View>

      {/* Niveau de masquage courant */}
      {maskLevel > 0 && (
        <View style={styles.maskBanner}>
          <Text style={styles.maskBannerText}>
            {t(activeMask.labelKey) !== activeMask.labelKey
              ? t(activeMask.labelKey)
              : activeMask.fallback}
            {' — '}
            {t('mushaf.tapToReveal') || 'touchez un mot pour le dévoiler'}
          </Text>
        </View>
      )}

      {/* Page */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            onPress={() => loadPage(page)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>{t('common.retry') || 'Réessayer'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.pageContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => loadPage(page)} />
          }
        >
          {data?.lines.map((line) => (
            <View key={line.line} style={styles.line}>
              <Text style={styles.lineText}>
                {line.words.map((w, i) => renderWord(w, i))}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Navigation entre les pages */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('mushaf.previousPage') || 'Page précédente'}
          accessibilityState={{ disabled: page <= 1 }}
          disabled={page <= 1}
          onPress={() => goTo(page - 1)}
          style={[styles.navButton, page <= 1 && styles.navButtonDisabled]}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          {page} / {TOTAL_PAGES}
        </Text>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('mushaf.nextPage') || 'Page suivante'}
          accessibilityState={{ disabled: page >= TOTAL_PAGES }}
          disabled={page >= TOTAL_PAGES}
          onPress={() => goTo(page + 1)}
          style={[styles.navButton, page >= TOTAL_PAGES && styles.navButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: c.primaryDark,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerButtonActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: c.onDeep, fontSize: 15, fontWeight: '600' },

    maskBanner: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: c.primarySoft,
    },
    maskBannerText: { color: c.primaryDark, fontSize: 12, textAlign: 'center' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { color: c.textSecondary, marginBottom: 16 },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: c.primary,
    },
    retryText: { color: c.onDeep, fontWeight: '600' },

    pageContent: { padding: 20, paddingBottom: 40 },
    line: { marginBottom: 6 },
    lineText: {
      // Le Mushaf se lit de droite à gauche, centré sur la ligne.
      textAlign: 'center',
      writingDirection: 'rtl',
      fontSize: 26,
      lineHeight: 52,
      color: c.text,
    },
    word: { fontSize: 26, lineHeight: 52, color: c.text },
    maskedWord: {
      color: c.textMuted,
      backgroundColor: c.backgroundAlt,
      borderRadius: 4,
    },
    endMarker: { fontSize: 22, color: c.primary },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    navButtonDisabled: { opacity: 0.35 },
    pageIndicator: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
  });

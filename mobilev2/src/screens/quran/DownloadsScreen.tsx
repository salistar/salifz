/**
 * DownloadsScreen — Salifz
 *
 * Gestion des récitations conservées sur l'appareil.
 *
 * L'application dépendait entièrement du réseau pour l'audio, alors que la
 * mémorisation se pratique souvent là où il n'y en a pas. L'écran affiche la
 * taille avant de télécharger — une sourate longue pèse plus de 100 Mo, et
 * l'annoncer après coup serait déloyal.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SURAHS_COMPLETE } from './QuranData';
import { offlineAudio, formatBytes, DownloadState } from '../../services/offlineAudio';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[DownloadsScreen.tsx]';
const RECITER = 'ar.alafasy';

export default function DownloadsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [states, setStates] = useState<Record<number, DownloadState>>({});
  const [sizes, setSizes] = useState<Record<number, number | null>>({});
  const [totalUsed, setTotalUsed] = useState(0);
  const [freeSpace, setFreeSpace] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshTotals = useCallback(async () => {
    const [used, free] = await Promise.all([
      offlineAudio.totalBytes(),
      offlineAudio.freeDiskBytes(),
    ]);
    setTotalUsed(used);
    setFreeSpace(free);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      const downloaded = await offlineAudio.list();
      if (!alive) return;

      const initial: Record<number, DownloadState> = {};
      downloaded.forEach((d) => {
        initial[d.surah] = { status: 'done', bytes: d.bytes };
      });
      setStates(initial);
      await refreshTotals();
      setLoading(false);
    })();

    const unsubscribe = offlineAudio.subscribe((surah, state) => {
      setStates((prev) => ({ ...prev, [surah]: state }));
      if (state.status === 'done' || state.status === 'idle') refreshTotals();
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [refreshTotals]);

  /** La taille n'est demandée qu'au moment où elle est utile. */
  const ensureSize = useCallback(async (surah: number) => {
    if (sizes[surah] !== undefined) return sizes[surah];
    const size = await offlineAudio.getRemoteSize(surah, RECITER);
    setSizes((prev) => ({ ...prev, [surah]: size }));
    return size;
  }, [sizes]);

  const handlePress = async (surah: number, name: string) => {
    const state = states[surah] ?? { status: 'idle' };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (state.status === 'downloading') {
      await offlineAudio.pause(surah, RECITER);
      return;
    }

    if (state.status === 'done') {
      Alert.alert(
        t('downloads.removeTitle') || 'Supprimer la récitation ?',
        `${name} — ${formatBytes(state.bytes)}`,
        [
          { text: t('common.cancel') || 'Annuler', style: 'cancel' },
          {
            text: t('common.delete') || 'Supprimer',
            style: 'destructive',
            onPress: () => offlineAudio.remove(surah, RECITER),
          },
        ]
      );
      return;
    }

    // Annoncer le poids avant de lancer : certaines sourates dépassent 100 Mo.
    const size = await ensureSize(surah);
    const label = size ? formatBytes(size) : t('downloads.unknownSize') || 'taille inconnue';

    if (size && size > 20 * 1024 * 1024) {
      Alert.alert(
        t('downloads.confirmTitle') || 'Télécharger cette sourate ?',
        `${name} — ${label}`,
        [
          { text: t('common.cancel') || 'Annuler', style: 'cancel' },
          {
            text: t('downloads.download') || 'Télécharger',
            onPress: () => offlineAudio.download(surah, RECITER),
          },
        ]
      );
      return;
    }

    offlineAudio.download(surah, RECITER);
  };

  const confirmRemoveAll = () => {
    Alert.alert(
      t('downloads.removeAllTitle') || 'Tout supprimer ?',
      t('downloads.removeAllBody') || 'Toutes les récitations conservées seront effacées.',
      [
        { text: t('common.cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('common.delete') || 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await offlineAudio.removeAll();
            setStates({});
            refreshTotals();
          },
        },
      ]
    );
  };

  const downloadedCount = useMemo(
    () => Object.values(states).filter((s) => s.status === 'done').length,
    [states]
  );

  const renderItem = ({ item }: { item: any }) => {
    const state: DownloadState = states[item.id] ?? { status: 'idle' };
    const size = sizes[item.id];

    const { icon, tint, label } = describe(state, size, colors);

    return (
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.nameEn} — ${label}`}
        accessibilityState={{ busy: state.status === 'downloading' }}
        style={styles.row}
        onPress={() => handlePress(item.id, item.nameEn)}
      >
        <View style={styles.rowNumber}>
          <Text style={styles.rowNumberText}>{item.id}</Text>
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowMeta}>
            {item.nameEn} · {item.ayahs} {t('quran.ayahs') || 'versets'}
            {label ? ` · ${label}` : ''}
          </Text>

          {state.status === 'downloading' && (
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.round(state.progress * 100)}%` }]}
              />
            </View>
          )}
        </View>

        <Ionicons name={icon} size={24} color={tint} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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

        <Text style={styles.headerTitle}>{t('downloads.title') || 'Hors ligne'}</Text>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('downloads.removeAllTitle') || 'Tout supprimer'}
          accessibilityState={{ disabled: downloadedCount === 0 }}
          disabled={downloadedCount === 0}
          onPress={confirmRemoveAll}
          style={[styles.headerButton, downloadedCount === 0 && styles.headerButtonDisabled]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.onDeep} />
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {downloadedCount} {t('downloads.surahsStored') || 'sourate(s) sur l’appareil'} ·{' '}
          {formatBytes(totalUsed)}
        </Text>
        <Text style={styles.summaryFree}>
          {formatBytes(freeSpace)} {t('downloads.freeSpace') || 'disponibles'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={SURAHS_COMPLETE}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          initialNumToRender={15}
        />
      )}
    </View>
  );
}

/** Traduit un état de téléchargement en icône, teinte et libellé. */
function describe(state: DownloadState, size: number | null | undefined, colors: ThemeColors) {
  switch (state.status) {
    case 'done':
      return {
        icon: 'checkmark-circle' as const,
        tint: colors.primary,
        label: formatBytes(state.bytes),
      };
    case 'downloading':
      return {
        icon: 'pause-circle' as const,
        tint: colors.warning,
        label: `${Math.round(state.progress * 100)} %`,
      };
    case 'error':
      return { icon: 'alert-circle' as const, tint: colors.error, label: state.message };
    default:
      return {
        icon: 'download-outline' as const,
        tint: colors.textMuted,
        label: size ? formatBytes(size) : '',
      };
  }
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
    headerButtonDisabled: { opacity: 0.35 },
    headerTitle: { color: c.onDeep, fontSize: 17, fontWeight: '700' },

    summary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: c.primarySoft,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryText: { color: c.primaryDark, fontSize: 13, fontWeight: '600' },
    summaryFree: { color: c.textSecondary, fontSize: 12 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      backgroundColor: c.surface,
    },
    rowNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowNumberText: { color: c.primaryDark, fontWeight: '700', fontSize: 13 },
    rowInfo: { flex: 1 },
    rowName: { color: c.text, fontSize: 17, fontWeight: '600', writingDirection: 'rtl' },
    rowMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },

    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: c.divider,
      marginTop: 8,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: c.primary },
  });

/**
 * TeacherReviewScreen — Salifz
 *
 * File d'attente de l'enseignant : il écoute les passages soumis par les
 * élèves de sa halaqa, puis valide ou demande une reprise.
 *
 * Le serveur refuse une demande de reprise sans remarque — corriger sans
 * expliquer n'apprend rien. L'écran applique la même règle avant l'envoi,
 * pour que le refus soit compris avant la requête.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SURAHS_COMPLETE } from '../quran/QuranData';
import { recitationsAPI } from '../../services/api';
import ENV from '../../config/env';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[TeacherReviewScreen.tsx]';

interface Recitation {
  _id: string;
  student: { displayName?: string; username?: string };
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  kind: 'hifz' | 'muraja';
  attempt: number;
  audioUrl: string;
  durationSeconds?: number;
  createdAt: string;
}

export default function TeacherReviewScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const halaqaId: string = route?.params?.halaqaId;

  const [items, setItems] = useState<Recitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Formulaire d'évaluation du passage ouvert
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [tajwidNotes, setTajwidNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await recitationsAPI.pending(halaqaId);
      setItems(response?.data?.recitations ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [halaqaId]);

  useEffect(() => {
    load();
  }, [load]);

  // Le son doit être libéré en quittant l'écran, sinon la lecture continue.
  useEffect(() => () => { sound?.unloadAsync().catch(() => {}); }, [sound]);

  const play = async (item: Recitation) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      if (playingId === item._id) {
        setPlayingId(null);
        return;
      }

      // `audioUrl` est un chemin relatif servi par l'API.
      const base = ENV.API_URL.replace(/\/api\/v1\/?$/, '');
      const { sound: created } = await Audio.Sound.createAsync(
        { uri: `${base}${item.audioUrl}` },
        { shouldPlay: true }
      );
      setSound(created);
      setPlayingId(item._id);

      created.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) setPlayingId(null);
      });
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ lecture:`, e?.message);
      Alert.alert(t('errors.generic') || 'Erreur', t('recitation.playFailed') || 'Lecture impossible');
    }
  };

  const openReview = (id: string) => {
    setOpenId(openId === id ? null : id);
    setGrade('');
    setComment('');
    setTajwidNotes('');
  };

  const review = async (item: Recitation, status: 'approved' | 'needs_work') => {
    // Même règle que le serveur : une reprise doit être expliquée.
    if (status === 'needs_work' && !comment.trim() && !tajwidNotes.trim()) {
      Alert.alert(
        t('recitation.feedbackRequired') || 'Remarque obligatoire',
        t('recitation.feedbackRequiredBody') ||
          'Une demande de reprise doit indiquer ce qui est à revoir.'
      );
      return;
    }

    setSending(true);
    try {
      const parsed = parseInt(grade, 10);
      await recitationsAPI.review(item._id, {
        status,
        grade: Number.isInteger(parsed) ? Math.min(100, Math.max(0, parsed)) : undefined,
        comment: comment.trim() || undefined,
        tajwidNotes: tajwidNotes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setItems((prev) => prev.filter((r) => r._id !== item._id));
      setOpenId(null);
    } catch (e: any) {
      Alert.alert(t('errors.generic') || 'Erreur', e?.response?.data?.error ?? e?.message ?? '');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Recitation }) => {
    const surah = SURAHS_COMPLETE.find((s) => s.id === item.surahNumber);
    const isOpen = openId === item._id;
    const isPlaying = playingId === item._id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${item.student?.displayName ?? item.student?.username} — ${surah?.nameEn}`}
          style={styles.cardHeader}
          onPress={() => openReview(item._id)}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.student}>
              {item.student?.displayName || item.student?.username || '—'}
            </Text>
            <Text style={styles.passage}>
              {surah?.name} · {item.fromAyah}–{item.toAyah}
              {item.attempt > 1 ? ` · ${t('recitation.attempt') || 'tentative'} ${item.attempt}` : ''}
            </Text>
            <Text style={styles.kind}>
              {item.kind === 'hifz'
                ? t('recitation.kindHifz') || 'Nouvelle mémorisation'
                : t('recitation.kindMuraja') || 'Révision'}
            </Text>
          </View>

          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? t('recitation.stop') || 'Arrêter' : t('recitation.listen') || 'Écouter'}
            style={styles.playButton}
            onPress={() => play(item)}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={colors.onDeep} />
          </TouchableOpacity>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.reviewBox}>
            <View style={styles.gradeRow}>
              <Text style={styles.fieldLabel}>{t('recitation.grade') || 'Note / 100'}</Text>
              <TextInput
                style={styles.gradeInput}
                value={grade}
                onChangeText={setGrade}
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel={t('recitation.grade') || 'Note sur 100'}
              />
            </View>

            <Text style={styles.fieldLabel}>{t('recitation.tajwidNotes') || 'Remarques de tajwid'}</Text>
            <TextInput
              style={styles.textArea}
              value={tajwidNotes}
              onChangeText={setTajwidNotes}
              multiline
              placeholder={t('recitation.tajwidPlaceholder') || 'Madd, idgham, makharij…'}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('recitation.tajwidNotes') || 'Remarques de tajwid'}
            />

            <Text style={styles.fieldLabel}>{t('recitation.comment') || 'Commentaire'}</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              multiline
              accessibilityLabel={t('recitation.comment') || 'Commentaire'}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={t('recitation.needsWork') || 'À revoir'}
                accessibilityState={{ disabled: sending }}
                disabled={sending}
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => review(item, 'needs_work')}
              >
                <Text style={styles.rejectText}>{t('recitation.needsWork') || 'À revoir'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel={t('recitation.approve') || 'Valider'}
                accessibilityState={{ disabled: sending, busy: sending }}
                disabled={sending}
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => review(item, 'approved')}
              >
                {sending ? (
                  <ActivityIndicator color={colors.onDeep} />
                ) : (
                  <Text style={styles.approveText}>{t('recitation.approve') || 'Valider'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>{t('recitation.reviewTitle') || 'À valider'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎧</Text>
          <Text style={styles.emptyText}>
            {t('recitation.queueEmpty') || 'Aucune récitation en attente.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          onRefresh={load}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingBottom: 12, backgroundColor: c.primaryDark,
    },
    headerButton: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { color: c.onDeep, fontSize: 17, fontWeight: '700' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyText: { color: c.textSecondary, fontSize: 15, textAlign: 'center' },

    card: {
      backgroundColor: c.surface, borderRadius: 14, marginBottom: 12,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    cardInfo: { flex: 1 },
    student: { color: c.text, fontSize: 16, fontWeight: '700' },
    passage: { color: c.textSecondary, fontSize: 13, marginTop: 3 },
    kind: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    playButton: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary,
    },

    reviewBox: { padding: 14, borderTopWidth: 1, borderTopColor: c.divider },
    gradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    fieldLabel: { color: c.textSecondary, fontSize: 13, marginBottom: 6 },
    gradeInput: {
      width: 80, backgroundColor: c.backgroundAlt, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 8, color: c.text, fontSize: 16,
      borderWidth: 1, borderColor: c.border,
    },
    textArea: {
      backgroundColor: c.backgroundAlt, borderRadius: 8, borderWidth: 1, borderColor: c.border,
      padding: 12, color: c.text, minHeight: 64, marginBottom: 12,
      textAlignVertical: 'top',
    },

    actions: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
    rejectButton: { backgroundColor: c.errorSoft, borderWidth: 1, borderColor: c.error },
    rejectText: { color: c.error, fontWeight: '700' },
    approveButton: { backgroundColor: c.primary },
    approveText: { color: c.onDeep, fontWeight: '700' },
  });

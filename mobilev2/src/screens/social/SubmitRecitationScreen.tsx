/**
 * SubmitRecitationScreen — Salifz
 *
 * L'élève enregistre un passage et le soumet à sa halaqa pour validation.
 *
 * C'est la moitié manquante de l'apprentissage traditionnel : les Halaqat
 * existaient comme groupes de discussion, mais rien ne permettait de réciter
 * devant un enseignant et d'obtenir une validation. Sans cela, la
 * mémorisation restait auto-déclarée.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[SubmitRecitationScreen.tsx]';

export default function SubmitRecitationScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const halaqaId: string = route?.params?.halaqaId;
  const halaqaName: string = route?.params?.halaqaName ?? '';

  const [surahNumber, setSurahNumber] = useState<number>(route?.params?.surahNumber ?? 114);
  const [fromAyah, setFromAyah] = useState('1');
  const [toAyah, setToAyah] = useState('');
  const [kind, setKind] = useState<'hifz' | 'muraja'>('hifz');

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);

  const surah = SURAHS_COMPLETE.find((s) => s.id === surahNumber);

  useEffect(() => {
    if (!toAyah && surah) setToAyah(String(surah.ayahs));
  }, [surah, toAyah]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      // Un enregistrement laissé en cours garde le micro : on le libère.
      recording?.stopAndUnloadAsync().catch(() => {});
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('recitation.micDenied') || 'Micro refusé',
          t('recitation.micDeniedBody') || "L'enregistrement nécessite l'accès au micro."
        );
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(rec);
      setUri(null);
      setSeconds(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ enregistrement:`, e?.message);
      Alert.alert(t('errors.generic') || 'Erreur', e?.message ?? '');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (timer.current) clearInterval(timer.current);

    try {
      await recording.stopAndUnloadAsync();
      setUri(recording.getURI());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ arrêt:`, e?.message);
    } finally {
      setRecording(null);
    }
  };

  const submit = async () => {
    if (!uri) return;

    const from = parseInt(fromAyah, 10);
    const to = parseInt(toAyah, 10);

    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) {
      Alert.alert(t('recitation.rangeInvalid') || 'Intervalle de versets invalide');
      return;
    }
    if (surah && to > surah.ayahs) {
      Alert.alert(
        t('recitation.rangeTooLong') || 'Intervalle hors de la sourate',
        `${surah.nameEn} — ${surah.ayahs} ${t('quran.ayahs') || 'versets'}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('audio', {
        uri,
        name: `recitation-${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);
      form.append('halaqaId', halaqaId);
      form.append('surahNumber', String(surahNumber));
      form.append('fromAyah', String(from));
      form.append('toAyah', String(to));
      form.append('kind', kind);
      form.append('durationSeconds', String(seconds));

      await recitationsAPI.submit(form);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('recitation.submitted') || 'Récitation envoyée',
        t('recitation.submittedBody') || 'Votre enseignant sera prévenu.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ envoi:`, e?.message);
      Alert.alert(t('errors.generic') || 'Erreur', e?.response?.data?.error ?? e?.message ?? '');
    } finally {
      setSubmitting(false);
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

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
        <Text style={styles.headerTitle}>{t('recitation.submitTitle') || 'Réciter'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {!!halaqaName && <Text style={styles.halaqa}>{halaqaName}</Text>}

        {/* Passage */}
        <Text style={styles.label}>{t('recitation.passage') || 'Passage'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.surahRow}>
          {SURAHS_COMPLETE.map((s) => (
            <TouchableOpacity
              key={s.id}
              accessible
              accessibilityRole="button"
              accessibilityLabel={s.nameEn}
              accessibilityState={{ selected: s.id === surahNumber }}
              style={[styles.surahChip, s.id === surahNumber && styles.surahChipActive]}
              onPress={() => {
                setSurahNumber(s.id);
                setFromAyah('1');
                setToAyah(String(s.ayahs));
              }}
            >
              <Text style={[styles.surahChipText, s.id === surahNumber && styles.surahChipTextActive]}>
                {s.id}. {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>{t('recitation.fromAyah') || 'Du verset'}</Text>
            <TextInput
              style={styles.rangeInput}
              value={fromAyah}
              onChangeText={setFromAyah}
              keyboardType="number-pad"
              accessibilityLabel={t('recitation.fromAyah') || 'Du verset'}
            />
          </View>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>{t('recitation.toAyah') || 'Au verset'}</Text>
            <TextInput
              style={styles.rangeInput}
              value={toAyah}
              onChangeText={setToAyah}
              keyboardType="number-pad"
              accessibilityLabel={t('recitation.toAyah') || 'Au verset'}
            />
          </View>
        </View>

        {/* Nature de l'exercice */}
        <View style={styles.kindRow}>
          {(['hifz', 'muraja'] as const).map((k) => (
            <TouchableOpacity
              key={k}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected: kind === k }}
              style={[styles.kindChip, kind === k && styles.kindChipActive]}
              onPress={() => setKind(k)}
            >
              <Text style={[styles.kindText, kind === k && styles.kindTextActive]}>
                {k === 'hifz'
                  ? t('recitation.kindHifz') || 'Nouvelle mémorisation'
                  : t('recitation.kindMuraja') || 'Révision'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enregistrement */}
        <View style={styles.recordCard}>
          <Text style={styles.timer}>{mmss}</Text>

          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              recording
                ? t('recitation.stop') || 'Arrêter'
                : t('recitation.record') || 'Enregistrer'
            }
            accessibilityState={{ busy: !!recording }}
            style={[styles.recordButton, recording && styles.recordButtonActive]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Ionicons
              name={recording ? 'stop' : 'mic'}
              size={36}
              color={colors.onDeep}
            />
          </TouchableOpacity>

          <Text style={styles.recordHint}>
            {recording
              ? t('recitation.recording') || 'Enregistrement en cours…'
              : uri
              ? t('recitation.ready') || 'Prêt à envoyer'
              : t('recitation.recordHint') || 'Touchez pour réciter'}
          </Text>
        </View>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('recitation.send') || 'Envoyer à l’enseignant'}
          accessibilityState={{ disabled: !uri || submitting, busy: submitting }}
          disabled={!uri || submitting}
          style={[styles.submitButton, (!uri || submitting) && styles.submitDisabled]}
          onPress={submit}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onDeep} />
          ) : (
            <Text style={styles.submitText}>
              {t('recitation.send') || 'Envoyer à l’enseignant'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { color: c.onDeep, fontSize: 17, fontWeight: '700' },

    content: { padding: 16 },
    halaqa: { color: c.textSecondary, fontSize: 13, marginBottom: 16, textAlign: 'center' },

    label: { color: c.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },

    surahRow: { marginBottom: 16 },
    surahChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
      backgroundColor: c.surface, marginRight: 8,
      borderWidth: 1, borderColor: c.border,
    },
    surahChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    surahChipText: { color: c.text, fontSize: 14 },
    surahChipTextActive: { color: c.onDeep, fontWeight: '700' },

    rangeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    rangeField: { flex: 1 },
    rangeLabel: { color: c.textSecondary, fontSize: 12, marginBottom: 6 },
    rangeInput: {
      backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 10, color: c.text, fontSize: 16,
    },

    kindRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    kindChip: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    kindChipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    kindText: { color: c.textSecondary, fontSize: 13 },
    kindTextActive: { color: c.primaryDark, fontWeight: '700' },

    recordCard: {
      backgroundColor: c.surface, borderRadius: 16, padding: 24,
      alignItems: 'center', marginBottom: 24,
      borderWidth: 1, borderColor: c.border,
    },
    timer: { color: c.text, fontSize: 34, fontWeight: '700', marginBottom: 16 },
    recordButton: {
      width: 88, height: 88, borderRadius: 44,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.primary,
    },
    recordButtonActive: { backgroundColor: c.error },
    recordHint: { color: c.textSecondary, fontSize: 13, marginTop: 16 },

    submitButton: {
      backgroundColor: c.primary, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: c.onDeep, fontSize: 16, fontWeight: '700' },
  });

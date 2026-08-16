/**
 * WordByWordScreen — Salifz
 *
 * Traduction mot à mot d'un verset, avec l'audio de chaque mot.
 *
 * La fonctionnalité était annoncée au README, et `getWordByWord` existait dans
 * le service backend depuis le début — mais aucune route ne l'exposait et
 * aucun écran ne l'affichait. Elle était donc inatteignable.
 *
 * Elle compte pour la mémorisation : relier chaque mot à son sens ancre le
 * texte bien plus solidement qu'une traduction globale du verset, et c'est ce
 * qui permet de repérer les mots qu'on récite sans les comprendre.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SURAHS_COMPLETE } from './QuranData';
import { quranAPI } from '../../services/api';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[WordByWordScreen.tsx]';

// L'API renvoie un chemin relatif (`wbw/112_002_001.mp3`).
const WORD_AUDIO_CDN = 'https://audio.qurancdn.com';

interface Word {
  position: number;
  char_type_name: string;
  text_uthmani?: string;
  text?: string;
  audio_url?: string | null;
  translation?: { text?: string };
  transliteration?: { text?: string };
}

export default function WordByWordScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [surahNumber, setSurahNumber] = useState<number>(Number(route?.params?.surahNumber) || 1);
  const [ayahNumber, setAyahNumber] = useState<number>(Number(route?.params?.ayahNumber) || 1);

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  const surah = SURAHS_COMPLETE.find((s) => s.id === surahNumber);
  const totalAyahs = surah?.ayahs ?? 1;

  const load = useCallback(async (s: number, a: number) => {
    console.log(`${LOG_PREFIX} 🔤 ${s}:${a}`);
    setLoading(true);
    setError(null);
    try {
      const response: any = await quranAPI.getWordByWord(s, a);
      setWords(response?.data?.words ?? []);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌`, e?.message);
      setError(t('errors.generic'));
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(surahNumber, ayahNumber);
  }, [surahNumber, ayahNumber, load]);

  // Le son doit être libéré en quittant l'écran, sinon il continue de jouer.
  useEffect(() => () => { sound?.unloadAsync().catch(() => {}); }, [sound]);

  const playWord = async (word: Word) => {
    if (!word.audio_url) return;

    try {
      Haptics.selectionAsync();
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: created } = await Audio.Sound.createAsync(
        { uri: `${WORD_AUDIO_CDN}/${word.audio_url}` },
        { shouldPlay: true }
      );
      setSound(created);
      setPlaying(word.position);

      created.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) setPlaying(null);
      });
    } catch (e: any) {
      console.error(`${LOG_PREFIX} ❌ audio:`, e?.message);
      setPlaying(null);
    }
  };

  const step = (delta: number) => {
    const next = ayahNumber + delta;
    if (next < 1 || next > totalAyahs) return;
    Haptics.selectionAsync();
    setAyahNumber(next);
  };

  // Le rond de fin de verset porte le numéro : il n'a pas de sens à traduire.
  const actualWords = words.filter((w) => w.char_type_name !== 'end');

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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{surah?.name ?? ''}</Text>
          <Text style={styles.headerSub}>
            {t('quran.ayah') || 'Verset'} {ayahNumber} / {totalAyahs}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

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
            style={styles.retryButton}
            onPress={() => load(surahNumber, ayahNumber)}
          >
            <Text style={styles.retryText}>{t('common.retry') || 'Réessayer'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.hint}>
            {t('wordByWord.hint') || 'Touchez un mot pour l’entendre'}
          </Text>

          <View style={styles.grid}>
            {actualWords.map((word) => {
              const isPlaying = playing === word.position;
              const arabic = word.text_uthmani || word.text || '';
              const meaning = word.translation?.text;

              return (
                <TouchableOpacity
                  key={word.position}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={meaning ? `${arabic} — ${meaning}` : arabic}
                  accessibilityState={{ busy: isPlaying, disabled: !word.audio_url }}
                  style={[styles.wordCard, isPlaying && styles.wordCardActive]}
                  onPress={() => playWord(word)}
                  disabled={!word.audio_url}
                >
                  <Text style={styles.arabic}>{arabic}</Text>
                  {!!word.transliteration?.text && (
                    <Text style={styles.translit}>{word.transliteration.text}</Text>
                  )}
                  {!!meaning && <Text style={styles.meaning}>{meaning}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('wordByWord.previousAyah') || 'Verset précédent'}
          accessibilityState={{ disabled: ayahNumber <= 1 }}
          disabled={ayahNumber <= 1}
          style={[styles.navButton, ayahNumber <= 1 && styles.navDisabled]}
          onPress={() => step(-1)}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.counter}>{actualWords.length} {t('wordByWord.words') || 'mots'}</Text>

        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel={t('wordByWord.nextAyah') || 'Verset suivant'}
          accessibilityState={{ disabled: ayahNumber >= totalAyahs }}
          disabled={ayahNumber >= totalAyahs}
          style={[styles.navButton, ayahNumber >= totalAyahs && styles.navDisabled]}
          onPress={() => step(1)}
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
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: c.onDeep, fontSize: 18, fontWeight: '700' },
    headerSub: { color: c.onDeep, fontSize: 12, opacity: 0.85, marginTop: 2 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { color: c.textSecondary, marginBottom: 16 },
    retryButton: {
      paddingHorizontal: 20, paddingVertical: 10,
      borderRadius: 8, backgroundColor: c.primary,
    },
    retryText: { color: c.onDeep, fontWeight: '600' },

    content: { padding: 16 },
    hint: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 16 },

    // Les mots se lisent de droite à gauche : la grille suit le même sens.
    grid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: 10,
    },
    wordCard: {
      minWidth: 96,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
    },
    wordCardActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    arabic: { fontSize: 24, color: c.text, writingDirection: 'rtl' },
    translit: { fontSize: 11, color: c.textMuted, marginTop: 4, fontStyle: 'italic' },
    meaning: { fontSize: 13, color: c.textSecondary, marginTop: 4, textAlign: 'center' },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    navButton: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    navDisabled: { opacity: 0.35 },
    counter: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
  });

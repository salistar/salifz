/**
 * ============================================
 * 📱 LessonDetailScreen.tsx - Salifz v3
 * ============================================
 * ✅ FIXED: Audio URLs corrected (uses ayah number directly)
 * ✅ FIXED: TypeScript types
 * ✅ FIXED: Navigation stays on LessonsScreen after completion
 * ✅ FIXED: Uses real block exercises (5 ayat per block)
 * ✅ FIXED: Saves progress to backend after completion
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Dimensions, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useGamificationStore } from '../../stores';
import { progressAPI } from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { IconeCoeurs } from '../../components/common/Icones';

const LOG_PREFIX = '[LessonDetailScreen.tsx]';
const { width } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);

// Types
interface Surah {
  id: number;
  name: string;
  nameEn: string;
  ayahs: number;
  juz: number;
  hizb: number;
}

interface Block {
  id: string;
  surahId: number;
  start: number;
  end: number;
  count: number;
}

interface AyahData {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  audioUrl: string;
}

interface Exercise {
  type: string;
  ayah?: AyahData;
  ayahs?: AyahData[];
  ayahIndex?: number;
  instruction: string;
  question?: string;
  options?: string[];
  correct?: number;
  blankText?: string;
  answer?: string;
  xp: number;
}

export default function LessonDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering...`);
  console.log(`${LOG_PREFIX} 📥 Route params:`, JSON.stringify(route?.params || {}));

  const { surah, block, blocks } = route.params || {} as { surah: Surah; block: Block; blocks: Block[] };
  console.log(`${LOG_PREFIX} 📖 Surah: ${surah?.name}, Block: ${block?.id}`);
  console.log(`${LOG_PREFIX} 📦 Block details: ayahs ${block?.start}-${block?.end} (${block?.count} ayahs)`);
  console.log(`${LOG_PREFIX} 📚 Total blocks in surah: ${blocks?.length}`);

  const { hearts, useHeart, addXp } = useGamificationStore();
  console.log(`${LOG_PREFIX} ❤️ Hearts from store: ${hearts}`);

  // State
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(() => {
    const idx = blocks?.findIndex((b: Block) => b.id === block?.id) || 0;
    console.log(`${LOG_PREFIX} 📍 Current block index: ${idx}`);
    return idx;
  });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [ayahsData, setAyahsData] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [arrangedWords, setArrangedWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [xpEarned, setXpEarned] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentBlock: Block = blocks?.[currentBlockIndex] || block;

  // Load ayahs data from API
  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Loading ayahs for block`);
    loadAyahsData();

    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup - Unloading sound`);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentBlockIndex]);

  // Calculate global ayah number for audio
  const getGlobalAyahNumber = (surahId: number, ayahInSurah: number): number => {
    // Ayah numbers before each surah (cumulative)
    const ayahsBeforeSurah: { [key: number]: number } = {
      1: 0, 2: 7, 3: 293, 4: 493, 5: 669, 6: 789, 7: 954, 8: 1160, 9: 1235, 10: 1364,
      11: 1473, 12: 1596, 13: 1707, 14: 1750, 15: 1802, 16: 1901, 17: 2029, 18: 2140,
      19: 2250, 20: 2348, 21: 2483, 22: 2595, 23: 2673, 24: 2791, 25: 2855, 26: 2932,
      27: 3159, 28: 3252, 29: 3340, 30: 3409, 31: 3469, 32: 3503, 33: 3533, 34: 3606,
      35: 3660, 36: 3705, 37: 3788, 38: 3970, 39: 4058, 40: 4133, 41: 4218, 42: 4272,
      43: 4325, 44: 4414, 45: 4473, 46: 4510, 47: 4545, 48: 4583, 49: 4612, 50: 4630,
      51: 4675, 52: 4735, 53: 4784, 54: 4846, 55: 4901, 56: 4979, 57: 5075, 58: 5104,
      59: 5126, 60: 5150, 61: 5163, 62: 5177, 63: 5188, 64: 5199, 65: 5217, 66: 5229,
      67: 5241, 68: 5271, 69: 5323, 70: 5375, 71: 5419, 72: 5447, 73: 5475, 74: 5495,
      75: 5551, 76: 5591, 77: 5622, 78: 5672, 79: 5712, 80: 5758, 81: 5800, 82: 5829,
      83: 5848, 84: 5884, 85: 5909, 86: 5931, 87: 5948, 88: 5967, 89: 5993, 90: 6023,
      91: 6043, 92: 6058, 93: 6079, 94: 6090, 95: 6098, 96: 6106, 97: 6125, 98: 6130,
      99: 6138, 100: 6146, 101: 6157, 102: 6168, 103: 6176, 104: 6179, 105: 6188,
      106: 6193, 107: 6197, 108: 6204, 109: 6207, 110: 6213, 111: 6216, 112: 6221,
      113: 6225, 114: 6230,
    };

    const base = ayahsBeforeSurah[surahId] || 0;
    return base + ayahInSurah;
  };

  // Get audio URL for an ayah
  const getAudioUrl = (surahId: number, ayahInSurah: number): string => {
    // Method 1: Use global ayah number (1-6236)
    const globalAyah = getGlobalAyahNumber(surahId, ayahInSurah);
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyah}.mp3`;
    console.log(`${LOG_PREFIX} 🔊 Audio URL for ${surahId}:${ayahInSurah} = global ayah ${globalAyah}`);
    console.log(`${LOG_PREFIX} 🔊 URL: ${url}`);
    return url;
  };

  const loadAyahsData = async (): Promise<void> => {
    console.log(`${LOG_PREFIX} 📥 loadAyahsData() called`);
    console.log(`${LOG_PREFIX} 📖 Loading ayahs ${currentBlock.start}-${currentBlock.end} for surah ${surah.id}`);

    setLoading(true);

    try {
      console.log(`${LOG_PREFIX} 🌐 Fetching ayahs from Quran API`);

      const ayahs: AyahData[] = [];
      for (let i = currentBlock.start; i <= currentBlock.end; i++) {
        const ayahData: AyahData = {
          number: getGlobalAyahNumber(surah.id, i),
          numberInSurah: i,
          text: await fetchAyahText(surah.id, i),
          translation: await fetchAyahTranslation(surah.id, i),
          audioUrl: getAudioUrl(surah.id, i),
        };
        ayahs.push(ayahData);
        console.log(`${LOG_PREFIX} ✅ Loaded ayah ${i}: ${ayahData.text.substring(0, 30)}...`);
      }

      console.log(`${LOG_PREFIX} ✅ Loaded ${ayahs.length} ayahs`);
      setAyahsData(ayahs);

      // Generate exercises for this block
      generateExercises(ayahs);

    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ ERROR loading ayahs:`, error);
      // Fallback to mock data
      generateMockExercises();
    }

    setLoading(false);
  };

  const fetchAyahText = async (surahId: number, ayahNum: number): Promise<string> => {
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNum}`);
      const data = await response.json();
      return data.data?.text || t('lessonDetail.ayahFallback', { number: ayahNum });
    } catch {
      // Fallback texts for Al-Fatiha (texte coranique reste en arabe)
      const fatihaTexts: { [key: number]: string } = {
        1: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        2: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        3: 'الرَّحْمَٰنِ الرَّحِيمِ',
        4: 'مَالِكِ يَوْمِ الدِّينِ',
        5: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        6: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        7: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
      };
      return fatihaTexts[ayahNum] || t('lessonDetail.ayahFromSurah', { ayahNum, surahId });
    }
  };

  const fetchAyahTranslation = async (surahId: number, ayahNum: number): Promise<string> => {
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${ayahNum}/fr.hamidullah`);
      const data = await response.json();
      return data.data?.text || '';
    } catch {
      return '';
    }
  };

  const generateExercises = (ayahs: AyahData[]): void => {
    console.log(`${LOG_PREFIX} 🎯 generateExercises() for ${ayahs.length} ayahs`);

    const allExercises: Exercise[] = [];

    ayahs.forEach((ayah: AyahData, idx: number) => {
      // Exercise 1: Listen & Repeat
      allExercises.push({
        type: 'listen_repeat',
        ayah,
        ayahIndex: idx,
        instruction: t('lessonDetail.exercises.listenRepeat'),
        xp: 10,
      });

      // Exercise 2: Multiple Choice (meaning)
      allExercises.push({
        type: 'multiple_choice',
        ayah,
        ayahIndex: idx,
        instruction: t('lessonDetail.exercises.chooseCorrectMeaning'),
        question: t('lessonDetail.exercises.whatIsTheMeaning'),
        options: generateMeaningOptions(ayah),
        correct: 0,
        xp: 15,
      });

      // Exercise 3: Fill the Blank
      const fillBlankData = generateFillBlank(ayah.text);
      allExercises.push({
        type: 'fill_blank',
        ayah,
        ayahIndex: idx,
        instruction: t('lessonDetail.exercises.fillTheBlank'),
        blankText: fillBlankData.blankText,
        answer: fillBlankData.answer,
        options: fillBlankData.options,
        xp: 20,
      });
    });

    // Block-level exercise: Arrange all ayahs in order
    allExercises.push({
      type: 'arrange_ayahs',
      ayahs,
      instruction: t('lessonDetail.exercises.arrangeAyahs'),
      xp: 30,
    });

    // Final exercise: Recite without looking
    allExercises.push({
      type: 'recite_check',
      ayahs,
      instruction: t('lessonDetail.exercises.reciteFromMemory'),
      xp: 40,
    });

    console.log(`${LOG_PREFIX} ✅ Generated ${allExercises.length} exercises`);
    setExercises(allExercises);
  };

  const generateMockExercises = (): void => {
    console.log(`${LOG_PREFIX} ⚠️ Using mock exercises (fallback)`);

    const mockAyahs: AyahData[] = [
      { number: 1, numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'Au nom d\'Allah', audioUrl: getAudioUrl(1, 1) },
      { number: 2, numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'Louange à Allah', audioUrl: getAudioUrl(1, 2) },
      { number: 3, numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'Le Tout Miséricordieux', audioUrl: getAudioUrl(1, 3) },
      { number: 4, numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Maître du Jour', audioUrl: getAudioUrl(1, 4) },
      { number: 5, numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'C\'est Toi que nous adorons', audioUrl: getAudioUrl(1, 5) },
    ];

    setAyahsData(mockAyahs);
    generateExercises(mockAyahs.slice(0, currentBlock?.count || 5));
  };

  const generateMeaningOptions = (ayah: AyahData): string[] => {
    const correct = ayah.translation || t('lessonDetail.correctMeaning');
    const wrongs = [
      t('lessonDetail.wrongMeaning1'),
      t('lessonDetail.wrongMeaning2'),
      t('lessonDetail.wrongMeaning3'),
    ];
    return [correct, ...wrongs];
  };

  const generateFillBlank = (text: string): { blankText: string; answer: string; options: string[] } => {
    const words = text.split(' ');
    if (words.length < 2) {
      return { blankText: '___', answer: text, options: [text, t('lessonDetail.wrong'), t('lessonDetail.wrong')] };
    }

    const blankIndex = Math.floor(words.length / 2);
    const answer = words[blankIndex];
    const blankText = words.map((w: string, i: number) => i === blankIndex ? '___' : w).join(' ');

    const wrongOptions = words.filter((_: string, i: number) => i !== blankIndex).slice(0, 2);
    const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);

    return { blankText, answer, options };
  };

  // Update progress animation
  useEffect(() => {
    if (exercises.length === 0) return;

    const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;
    console.log(`${LOG_PREFIX} 📊 Progress: ${progress.toFixed(1)}%`);

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentExerciseIndex, exercises.length]);

  const playAudio = async (ayah?: AyahData): Promise<void> => {
    const targetAyah = ayah || ayahsData[0];
    if (!targetAyah) {
      console.error(`${LOG_PREFIX} ❌ No ayah to play`);
      return;
    }

    console.log(`${LOG_PREFIX} 🎵 playAudio() - Ayah ${targetAyah.numberInSurah} (global: ${targetAyah.number})`);
    console.log(`${LOG_PREFIX} 🔊 URL: ${targetAyah.audioUrl}`);

    setAudioLoading(true);

    try {
      // Unload previous sound
      if (sound) {
        console.log(`${LOG_PREFIX} 🔇 Unloading previous sound`);
        await sound.unloadAsync();
        setSound(null);
      }

      // Setup audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      console.log(`${LOG_PREFIX} 🌐 Loading audio from: ${targetAyah.audioUrl}`);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: targetAyah.audioUrl },
        { shouldPlay: true },
        (status: any) => {
          if (status.didJustFinish) {
            console.log(`${LOG_PREFIX} 🏁 Audio finished`);
            setIsPlaying(false);
          }
          if (status.isLoaded && status.isPlaying) {
            console.log(`${LOG_PREFIX} ▶️ Audio playing...`);
          }
          if (status.error) {
            console.error(`${LOG_PREFIX} ❌ Audio error:`, status.error);
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
      setAudioLoading(false);
      console.log(`${LOG_PREFIX} ✅ Audio started`);

    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Audio error:`, error);
      console.error(`${LOG_PREFIX} ❌ Error message:`, error.message);
      setIsPlaying(false);
      setAudioLoading(false);
      Alert.alert(
        t('lessonDetail.alerts.error'),
        t('lessonDetail.alerts.audioError')
      );
    }
  };

  const stopAudio = async (): Promise<void> => {
    if (sound) {
      console.log(`${LOG_PREFIX} ⏹️ Stopping audio`);
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const checkAnswer = (): void => {
    console.log(`${LOG_PREFIX} ✅ checkAnswer() called`);

    const exercise = exercises[currentExerciseIndex];
    console.log(`${LOG_PREFIX} 📊 Exercise type: ${exercise.type}`);

    let correct = false;

    switch (exercise.type) {
      case 'listen_repeat':
      case 'recite_check':
        correct = true; // Auto-pass for audio exercises
        break;

      case 'multiple_choice':
        console.log(`${LOG_PREFIX} 🔍 Selected: ${selectedAnswer}, Correct: ${exercise.correct}`);
        correct = selectedAnswer === exercise.correct;
        break;

      case 'fill_blank':
        if (exercise.options && exercise.answer) {
          const correctIdx = exercise.options.indexOf(exercise.answer);
          console.log(`${LOG_PREFIX} 🔍 Selected: ${selectedAnswer}, Correct index: ${correctIdx}`);
          correct = selectedAnswer === correctIdx;
        }
        break;

      case 'arrange_words':
      case 'arrange_ayahs':
        const userAnswer = arrangedWords.join(' ');
        const correctAnswer = exercise.ayah?.text || exercise.ayahs?.map((a: AyahData) => a.text).join(' ') || '';
        console.log(`${LOG_PREFIX} 🔍 User: "${userAnswer}"`);
        console.log(`${LOG_PREFIX} 🔍 Correct: "${correctAnswer}"`);
        correct = userAnswer === correctAnswer;
        break;
    }

    console.log(`${LOG_PREFIX} ${correct ? '✅' : '❌'} Answer is ${correct ? 'CORRECT' : 'WRONG'}`);
    setIsCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const earned = exercise.xp || 10;
      console.log(`${LOG_PREFIX} ⚡ Adding ${earned} XP`);
      setXpEarned((prev: number) => prev + earned);
      addXp(earned);

      setTimeout(() => nextExercise(), 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (!useHeart()) {
        console.log(`${LOG_PREFIX} ❌ No hearts left!`);
        Alert.alert(
          t('lessonDetail.alerts.noHeartsTitle'),
          t('lessonDetail.alerts.noHeartsMessage'),
          [
            { text: t('lessonDetail.alerts.shop'), onPress: () => navigation.navigate('Shop') },
            { text: t('lessonDetail.alerts.later'), style: 'cancel' }
          ]
        );
        return;
      }

      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        setIsCorrect(null);
        setSelectedAnswer(null);
        setArrangedWords([]);
      }, 1000);
    }
  };

  const nextExercise = async (): Promise<void> => {
    console.log(`${LOG_PREFIX} ⏭️ nextExercise() - Current: ${currentExerciseIndex}/${exercises.length}`);

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev: number) => prev + 1);
      setSelectedAnswer(null);
      setArrangedWords([]);
      setIsCorrect(null);
    } else {
      // Block completed!
      console.log(`${LOG_PREFIX} 🏁 Block ${currentBlock.id} completed!`);

      // Save progress to backend
      await saveProgress();

      // Check if there are more blocks
      if (currentBlockIndex < blocks.length - 1) {
        console.log(`${LOG_PREFIX} ➡️ More blocks available`);

        Alert.alert(
          t('lessonDetail.alerts.wellDone'),
          t('lessonDetail.alerts.completedAyahs', { start: currentBlock.start, end: currentBlock.end }),
          [
            {
              text: t('lessonDetail.alerts.continue'),
              onPress: () => {
                setCurrentBlockIndex((prev: number) => prev + 1);
                setCurrentExerciseIndex(0);
                setXpEarned(0);
                setSelectedAnswer(null);
                setArrangedWords([]);
                setIsCorrect(null);
              }
            },
            {
              text: t('lessonDetail.alerts.finish'),
              onPress: () => navigateToComplete(),
              style: 'cancel'
            }
          ]
        );
      } else {
        // All blocks in surah completed
        navigateToComplete();
      }
    }
  };

  const saveProgress = async (): Promise<void> => {
    console.log(`${LOG_PREFIX} 💾 saveProgress() - Saving block ${currentBlock.id}`);

    try {
      console.log(`${LOG_PREFIX} 🌐 BACKEND API CALL - progressAPI.saveBlockProgress()`);

      await progressAPI.saveBlockProgress(
        surah.id,
        currentBlock.id,
        currentBlock.start,
        currentBlock.end,
        xpEarned
      );

      console.log(`${LOG_PREFIX} ✅ All progress saved for block ${currentBlock.id}`);

    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ ERROR saving progress:`, error);
      // Continue anyway - don't block user
    }
  };

  const navigateToComplete = (): void => {
    console.log(`${LOG_PREFIX} 🧭 Navigating to LessonComplete`);
    navigation.replace('LessonComplete', {
      surah,
      xpEarned,
      exercisesCount: exercises.length,
      blocksCompleted: currentBlockIndex + 1,
      totalBlocks: blocks.length,
    });
  };

  const handleGoBack = (): void => {
    console.log(`${LOG_PREFIX} ⬅️ Back pressed`);
    Alert.alert(
      t('lessonDetail.alerts.leaveLesson'),
      t('lessonDetail.alerts.loseProgress'),
      [
        { text: t('lessonDetail.alerts.stay'), style: 'cancel' },
        { text: t('lessonDetail.alerts.leave'), onPress: () => navigation.goBack(), style: 'destructive' }
      ]
    );
  };

  // Render exercise based on type
  const renderExercise = (): React.ReactNode => {
    if (loading || exercises.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('lessonDetail.loadingLesson')}</Text>
        </View>
      );
    }

    const exercise = exercises[currentExerciseIndex];
    console.log(`${LOG_PREFIX} 🎨 Rendering: ${exercise.type}`);

    switch (exercise.type) {
      case 'listen_repeat':
        return (
          <View style={styles.exerciseContainer}>
            <Text style={styles.instruction}>{exercise.instruction}</Text>
            <Text style={styles.ayahText}>{exercise.ayah?.text}</Text>
            <Text style={styles.translationText}>{exercise.ayah?.translation}</Text>

            <TouchableOpacity accessible accessibilityRole="button"
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={() => isPlaying ? stopAudio() : playAudio(exercise.ayah)}
              disabled={audioLoading}
            >
              {audioLoading ? (
                <ActivityIndicator size="small" color={colors.infoStrong} />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={colors.infoStrong} />
              )}
              <Text style={styles.playText}>
                {audioLoading
                  ? t('lessonDetail.audioLoading')
                  : isPlaying
                    ? t('lessonDetail.stop')
                    : t('lessonDetail.listen')
                }
              </Text>
            </TouchableOpacity>

            <TouchableOpacity accessible accessibilityRole="button" style={styles.doneButton} onPress={checkAnswer}>
              <Text style={styles.doneText}>{t('lessonDetail.doneListening')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'multiple_choice':
        return (
          <View style={styles.exerciseContainer}>
            <Text style={styles.instruction}>{exercise.instruction}</Text>
            <Text style={styles.ayahText}>{exercise.ayah?.text}</Text>

            <View style={styles.optionsContainer}>
              {exercise.options?.map((option: string, index: number) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.optionSelected,
                    isCorrect !== null && index === exercise.correct && styles.optionCorrect,
                    isCorrect === false && selectedAnswer === index && styles.optionWrong
                  ]}
                  onPress={() => setSelectedAnswer(index)}
                  disabled={isCorrect !== null}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'fill_blank':
        return (
          <View style={styles.exerciseContainer}>
            <Text style={styles.instruction}>{exercise.instruction}</Text>
            <Text style={styles.ayahText}>{exercise.blankText}</Text>

            <View style={styles.optionsContainer}>
              {exercise.options?.map((option: string, index: number) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={index}
                  style={[styles.optionButton, selectedAnswer === index && styles.optionSelected]}
                  onPress={() => setSelectedAnswer(index)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'arrange_words':
      case 'arrange_ayahs':
        const words: string[] = exercise.ayah?.text.split(' ') || exercise.ayahs?.map((a: AyahData) => a.text) || [];
        const shuffled: string[] = [...words].sort(() => Math.random() - 0.5);

        return (
          <View style={styles.exerciseContainer}>
            <Text style={styles.instruction}>{exercise.instruction}</Text>

            <View style={styles.arrangeTarget}>
              {arrangedWords.map((word: string, index: number) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={index}
                  style={styles.arrangedWord}
                  onPress={() => setArrangedWords(arrangedWords.filter((_: string, i: number) => i !== index))}
                >
                  <Text style={styles.arrangedWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.wordsContainer}>
              {shuffled.filter((w: string) => !arrangedWords.includes(w)).map((word: string, index: number) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={index}
                  style={styles.wordButton}
                  onPress={() => setArrangedWords([...arrangedWords, word])}
                >
                  <Text style={styles.wordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'recite_check':
        return (
          <View style={styles.exerciseContainer}>
            <Text style={styles.instruction}>{exercise.instruction}</Text>
            <Text style={styles.subtitle}>{t('lessonDetail.tryReciteFromMemory')}</Text>

            <View style={styles.reciteContainer}>
              {exercise.ayahs?.map((ayah: AyahData, index: number) => (
                <View key={index} style={styles.reciteAyah}>
                  <Text style={styles.reciteNumber}>{ayah.numberInSurah}</Text>
                  <Text style={styles.reciteHint}>• • • • •</Text>
                  <TouchableOpacity accessible accessibilityRole="button" onPress={() => playAudio(ayah)} style={styles.recitePlay}>
                    <Ionicons name="volume-high" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity accessible accessibilityRole="button" style={styles.revealButton} onPress={() => {
              const ayahsText = exercise.ayahs?.map((a: AyahData) => `${a.numberInSurah}. ${a.text}`).join('\n\n') || '';
              Alert.alert(t('lessonDetail.theAyahs'), ayahsText);
            }}>
              <Text style={styles.revealText}>{t('lessonDetail.revealForReview')}</Text>
            </TouchableOpacity>

            <TouchableOpacity accessible accessibilityRole="button" style={styles.doneButton} onPress={checkAnswer}>
              <Text style={styles.doneText}>{t('lessonDetail.doneReading')}</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" onPress={handleGoBack}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }
            ]}
          />
        </View>

        <View style={styles.heartsDisplay}>
          <IconeCoeurs size={16} color={colors.error} />
          <Text style={styles.heartCount}>{hearts}</Text>
        </View>
      </View>

      {/* Block Info */}
      <View style={styles.blockInfo}>
        <Text style={styles.surahName}>{surah?.name}</Text>
        <Text style={styles.blockRange}>
          {t('lessonDetail.ayahsRange', { start: currentBlock?.start, end: currentBlock?.end })}
        </Text>
        <Text style={styles.blockProgress}>
          {t('lessonDetail.blockProgress', { current: currentBlockIndex + 1, total: blocks?.length })}
        </Text>
      </View>

      {/* Exercise Content */}
      <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnim }] }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderExercise()}
        </ScrollView>
      </Animated.View>

      {/* Check Button */}
      {exercises[currentExerciseIndex]?.type !== 'listen_repeat' &&
       exercises[currentExerciseIndex]?.type !== 'recite_check' && (
        <View style={styles.footer}>
          <TouchableOpacity accessible accessibilityRole="button"
            style={[
              styles.checkButton,
              (selectedAnswer === null && arrangedWords.length === 0) && styles.checkButtonDisabled
            ]}
            onPress={checkAnswer}
            disabled={selectedAnswer === null && arrangedWords.length === 0}
          >
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.checkGradient}>
              <Text style={styles.checkText}>{t('lessonDetail.check')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Feedback */}
      {isCorrect !== null && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          {/* Juste ou faux : la forme porte l'information, pas seulement
              la couleur — un daltonien ne distingue pas le vert du rouge. */}
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={44}
            color={isCorrect ? colors.success : colors.error}
          />
          <Text style={styles.feedbackText}>
            {isCorrect
              ? t('lessonDetail.feedback.correct', { xp: exercises[currentExerciseIndex]?.xp || 10 })
              : t('lessonDetail.feedback.tryAgain')
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15 },
  progressBar: { flex: 1, height: 10, backgroundColor: c.border, borderRadius: 5, marginHorizontal: 15, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 5 },
  heartsDisplay: { flexDirection: 'row', alignItems: 'center' },
  heartIcon: {},
  heartCount: { color: c.error, fontWeight: 'bold', marginLeft: 5 },

  blockInfo: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  surahName: { fontSize: 20, fontWeight: 'bold', color: c.text },
  blockRange: { fontSize: 14, color: c.primary, marginTop: 4 },
  blockProgress: { fontSize: 12, color: c.textMuted, marginTop: 2 },

  content: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: c.textSecondary, marginTop: 15 },

  exerciseContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  instruction: { fontSize: 18, color: c.textSecondary, marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 14, color: c.textMuted, marginBottom: 20 },
  ayahText: { fontSize: 26, color: c.text, textAlign: 'center', lineHeight: 50, marginBottom: 15, fontFamily: 'System' },
  translationText: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 30, fontStyle: 'italic' },

  playButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.infoSoft, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, marginBottom: 20, minWidth: 180, justifyContent: 'center' },
  playButtonActive: { backgroundColor: '#BBDEFB' },
  playText: { fontSize: 16, color: c.infoStrong, fontWeight: '600', marginLeft: 10 },

  doneButton: { backgroundColor: c.primary, paddingHorizontal: 50, paddingVertical: 15, borderRadius: 25 },
  doneText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },

  optionsContainer: { width: '100%' },
  optionButton: { backgroundColor: c.background, padding: 18, borderRadius: 15, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: c.primary, backgroundColor: c.primarySoft },
  optionCorrect: { borderColor: c.primary, backgroundColor: c.primarySoft },
  optionWrong: { borderColor: c.error, backgroundColor: c.errorSoft },
  optionText: { fontSize: 16, textAlign: 'center', color: c.text },

  arrangeTarget: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', minHeight: 60, backgroundColor: c.background, borderRadius: 15, padding: 10, marginBottom: 20, width: '100%' },
  arrangedWord: { backgroundColor: c.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, margin: 5 },
  arrangedWordText: { color: c.onDeep, fontSize: 16 },
  wordsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  wordButton: { backgroundColor: c.border, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, margin: 5 },
  wordText: { fontSize: 16, color: c.text },

  reciteContainer: { width: '100%', marginBottom: 20 },
  reciteAyah: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: c.background, borderRadius: 10, marginBottom: 10 },
  reciteNumber: { fontSize: 18, fontWeight: 'bold', color: c.primary, marginRight: 15, width: 30 },
  reciteHint: { flex: 1, fontSize: 24, color: c.textMuted, letterSpacing: 5 },
  recitePlay: { padding: 5 },
  revealButton: { padding: 15 },
  revealText: { color: c.textSecondary, fontSize: 14 },

  footer: { padding: 20 },
  checkButton: { borderRadius: 15, overflow: 'hidden' },
  checkButtonDisabled: { opacity: 0.5 },
  checkGradient: { paddingVertical: 18, alignItems: 'center' },
  checkText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },

  feedback: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20 },
  feedbackCorrect: { backgroundColor: c.primarySoft },
  feedbackWrong: { backgroundColor: c.errorSoft },
  feedbackIcon: { marginRight: 10 },
  feedbackText: { fontSize: 16, fontWeight: 'bold' },
});
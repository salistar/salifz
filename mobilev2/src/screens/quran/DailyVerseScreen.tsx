/**
 * ============================================
 * 📱 DailyVerseScreen.tsx - Salifz
 * ============================================
 * ✅ DEBUG VERSION: Console logs on every action
 * ✅ CONVERTED: i18n integration
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Share, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[DailyVerseScreen.tsx]';
const { width, height } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);
console.log(`${LOG_PREFIX} 📐 Screen dimensions - width: ${width}, height: ${height}`);

// Note: Les versets coraniques restent en arabe (contenu religieux)
// Les noms de sourates ont des clés i18n pour le nom en anglais
const DAILY_VERSES = [
  { surah: 2, ayah: 255, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translationKey: 'dailyVerse.verses.ayatulKursi', surahName: 'البقرة', surahNameEn: 'Al-Baqarah' },
  { surah: 112, ayah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translationKey: 'dailyVerse.verses.ikhlas1', surahName: 'الإخلاص', surahNameEn: 'Al-Ikhlas' },
  { surah: 1, ayah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translationKey: 'dailyVerse.verses.basmala', surahName: 'الفاتحة', surahNameEn: 'Al-Fatiha' },
  { surah: 94, ayah: 5, text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translationKey: 'dailyVerse.verses.sharh5', surahName: 'الشرح', surahNameEn: 'Ash-Sharh' },
  { surah: 13, ayah: 28, text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translationKey: 'dailyVerse.verses.raad28', surahName: 'الرعد', surahNameEn: 'Ar-Ra\'d' }
];

console.log(`${LOG_PREFIX} 📚 Daily verses configured: ${DAILY_VERSES.length} verses`);

export default function DailyVerseScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering...`);
  
  const [verse, setVerse] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log(`${LOG_PREFIX} 📊 Initial state - verse: ${verse ? 'loaded' : 'null'}, isPlaying: ${isPlaying}`);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect triggered - Component mounted`);
    
    const today = new Date();
    console.log(`${LOG_PREFIX} 📅 Today's date: ${today.toISOString()}`);
    
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / 86400000);
    
    console.log(`${LOG_PREFIX} 📆 Day of year: ${dayOfYear}`);
    
    const verseIndex = dayOfYear % DAILY_VERSES.length;
    console.log(`${LOG_PREFIX} 🔢 Verse index calculated: ${verseIndex}`);
    
    const selectedVerse = DAILY_VERSES[verseIndex];
    console.log(`${LOG_PREFIX} 📖 Selected verse:`, JSON.stringify(selectedVerse));
    console.log(`${LOG_PREFIX} 📖 Surah: ${selectedVerse.surahName} (${selectedVerse.surahNameEn})`);
    console.log(`${LOG_PREFIX} 📖 Ayah: ${selectedVerse.ayah}`);
    
    setVerse(selectedVerse);
    console.log(`${LOG_PREFIX} ✅ Verse state updated`);
    
    return () => { 
      console.log(`${LOG_PREFIX} 🧹 Cleanup - Component unmounting`);
      if (sound) {
        console.log(`${LOG_PREFIX} 🔇 Unloading sound on cleanup`);
        sound.unloadAsync(); 
      }
    };
  }, []);

  const playAudio = async () => {
    console.log(`${LOG_PREFIX} 🎵 playAudio() called`);
    
    if (!verse) {
      console.log(`${LOG_PREFIX} ⚠️ No verse loaded, cannot play audio`);
      return;
    }
    
    console.log(`${LOG_PREFIX} 📊 Current state - sound: ${sound ? 'exists' : 'null'}, isPlaying: ${isPlaying}`);
    
    try {
      // If sound exists, toggle play/pause
      if (sound) { 
        if (isPlaying) { 
          console.log(`${LOG_PREFIX} ⏸️ Pausing audio`);
          await sound.pauseAsync(); 
          setIsPlaying(false); 
          console.log(`${LOG_PREFIX} ⏸️ Audio paused`);
          return; 
        } else { 
          console.log(`${LOG_PREFIX} ▶️ Resuming audio`);
          await sound.playAsync(); 
          setIsPlaying(true); 
          console.log(`${LOG_PREFIX} ▶️ Audio resumed`);
          return; 
        } 
      }
      
      // Build audio URL
      const surahPadded = String(verse.surah).padStart(3, '0');
      const ayahPadded = String(verse.ayah).padStart(3, '0');
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahPadded}${ayahPadded}.mp3`;
      
      console.log(`${LOG_PREFIX} 🌐 BACKEND API CALL - Building audio URL`);
      console.log(`${LOG_PREFIX} 🔗 API Domain: cdn.islamic.network`);
      console.log(`${LOG_PREFIX} 📡 Audio URL: ${audioUrl}`);
      console.log(`${LOG_PREFIX} 📖 Surah: ${verse.surah} (${surahPadded}), Ayah: ${verse.ayah} (${ayahPadded})`);
      
      console.log(`${LOG_PREFIX} 🎵 Creating sound from URL...`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl }, 
        { shouldPlay: true }
      );
      
      console.log(`${LOG_PREFIX} ✅ Sound created successfully`);
      
      setSound(newSound);
      setIsPlaying(true);
      console.log(`${LOG_PREFIX} ▶️ isPlaying set to true`);
      
      newSound.setOnPlaybackStatusUpdate((status: any) => { 
        if (status.didJustFinish) {
          console.log(`${LOG_PREFIX} 🏁 Audio playback finished`);
          setIsPlaying(false); 
        }
      });
      
      console.log(`${LOG_PREFIX} 🎧 Playback status listener attached`);
      
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ ERROR in playAudio():`, error);
      console.error(`${LOG_PREFIX} ❌ Error details:`, JSON.stringify(error));
    }
  };

  const shareVerse = async () => {
    console.log(`${LOG_PREFIX} 📤 shareVerse() called`);
    
    if (!verse) {
      console.log(`${LOG_PREFIX} ⚠️ No verse loaded, cannot share`);
      return;
    }
    
    console.log(`${LOG_PREFIX} 📳 Triggering haptic feedback`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // ✅ AVANT: Message hardcodé avec 'الآية'
      const translatedTranslation = t(verse.translationKey);
      const ayahLabel = t('dailyVerse.ayahNumber', { number: verse.ayah });
      const shareMessage = `${verse.text}\n\n${translatedTranslation}\n\n- ${verse.surahName} (${verse.surahNameEn}), ${ayahLabel}\n\n#Salifz`;
      
      console.log(`${LOG_PREFIX} 📤 Share message prepared:`);
      console.log(`${LOG_PREFIX} 📝 Message: ${shareMessage.substring(0, 100)}...`);
      
      console.log(`${LOG_PREFIX} 📱 Opening share dialog`);
      const result = await Share.share({ message: shareMessage });
      
      console.log(`${LOG_PREFIX} ✅ Share dialog result:`, result);
      
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ ERROR in shareVerse():`, error);
      console.error(`${LOG_PREFIX} ❌ Share error details:`, JSON.stringify(error));
    }
  };

  const copyVerse = async () => {
    console.log(`${LOG_PREFIX} 📋 copyVerse() called`);
    
    if (!verse) {
      console.log(`${LOG_PREFIX} ⚠️ No verse loaded, cannot copy`);
      return;
    }
    
    try {
      // ✅ AVANT: Message hardcodé avec 'الآية'
      const translatedTranslation = t(verse.translationKey);
      const ayahLabel = t('dailyVerse.ayahNumber', { number: verse.ayah });
      const copyText = `${verse.text}\n\n${translatedTranslation}\n\n- ${verse.surahName} (${verse.surahNameEn}), ${ayahLabel}`;
      
      console.log(`${LOG_PREFIX} 📋 Copying text to clipboard`);
      console.log(`${LOG_PREFIX} 📝 Text: ${copyText.substring(0, 50)}...`);
      
      await Clipboard.setStringAsync(copyText);
      
      console.log(`${LOG_PREFIX} ✅ Text copied to clipboard`);
      console.log(`${LOG_PREFIX} 📳 Triggering haptic feedback`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ ERROR in copyVerse():`, error);
    }
  };

  const navigateToMemorize = () => {
    console.log(`${LOG_PREFIX} 📖 navigateToMemorize() called`);
    
    if (!verse) {
      console.log(`${LOG_PREFIX} ⚠️ No verse loaded, cannot navigate`);
      return;
    }
    
    const navParams = { 
      surah: { 
        id: verse.surah, 
        name: verse.surahName 
      } 
    };
    
    console.log(`${LOG_PREFIX} 🧭 Navigating to LessonDetail`);
    console.log(`${LOG_PREFIX} 📦 Navigation params:`, JSON.stringify(navParams));
    
    navigation.navigate('LessonDetail', navParams);
    
    console.log(`${LOG_PREFIX} ✅ Navigation triggered`);
  };

  const handleBackPress = () => {
    console.log(`${LOG_PREFIX} ⬅️ Back button pressed`);
    console.log(`${LOG_PREFIX} 🔙 Navigating back`);
    navigation.goBack();
  };

  // Loading state
  if (!verse) {
    console.log(`${LOG_PREFIX} ⏳ Rendering loading state - verse not yet loaded`);
    return (
      <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* ✅ AVANT: 'جاري التحميل...' */}
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </LinearGradient>
    );
  }

  console.log(`${LOG_PREFIX} 🎨 Rendering main UI`);
  console.log(`${LOG_PREFIX} 📊 Render state - verse: ${verse.surahName}, isPlaying: ${isPlaying}`);

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" onPress={handleBackPress}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        {/* ✅ AVANT: 'آية اليوم' */}
        <Text style={styles.headerTitle}>{t('dailyVerse.title')}</Text>
        <TouchableOpacity accessible accessibilityRole="button" onPress={shareVerse}>
          <Text style={styles.shareButton}>📤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Decoration - Basmala reste en arabe */}
        <View style={styles.decorTop}>
          <Text style={styles.decorText}>﷽</Text>
        </View>

        {/* Verse Container - Texte coranique reste en arabe */}
        <View style={styles.verseContainer}>
          <Text style={styles.arabicText}>{verse.text}</Text>
        </View>

        {/* Translation Container */}
        <View style={styles.translationContainer}>
          {/* ✅ AVANT: {verse.translation} hardcodé */}
          <Text style={styles.translationText}>{t(verse.translationKey)}</Text>
        </View>

        {/* Reference */}
        <View style={styles.referenceContainer}>
          {/* Nom de sourate en arabe reste */}
          <Text style={styles.surahName}>{verse.surahName}</Text>
          <Text style={styles.surahNameEn}>{verse.surahNameEn}</Text>
          {/* ✅ AVANT: 'الآية X' */}
          <Text style={styles.ayahRef}>{t('dailyVerse.ayahNumber', { number: verse.ayah })}</Text>
        </View>

        {/* Play Button */}
        <TouchableOpacity accessible accessibilityRole="button" style={styles.playButton} onPress={playAudio}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.playButtonGradient}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            {/* ✅ AVANT: 'إيقاف' / 'استمع' */}
            <Text style={styles.playText}>
              {isPlaying ? t('dailyVerse.stop') : t('dailyVerse.listen')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={shareVerse}>
            <Text style={styles.actionIcon}>📤</Text>
            {/* ✅ AVANT: 'مشاركة' */}
            <Text style={styles.actionText}>{t('dailyVerse.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={copyVerse}>
            <Text style={styles.actionIcon}>📋</Text>
            {/* ✅ AVANT: 'نسخ' */}
            <Text style={styles.actionText}>{t('dailyVerse.copy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={navigateToMemorize}>
            <Text style={styles.actionIcon}>📖</Text>
            {/* ✅ AVANT: 'احفظ' */}
            <Text style={styles.actionText}>{t('dailyVerse.memorize')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomDecor}>
        <Text style={styles.bottomText}>🌙</Text>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: c.onDeep, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { color: c.onDeep, fontSize: 28 },
  headerTitle: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  shareButton: { fontSize: 24 },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  decorTop: { marginBottom: 20 },
  decorText: { fontSize: 40, color: c.primary },
  verseContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  arabicText: { color: c.onDeep, fontSize: 28, textAlign: 'center', lineHeight: 55 },
  translationContainer: { paddingHorizontal: 10, marginBottom: 20 },
  translationText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 26, fontStyle: 'italic' },
  referenceContainer: { alignItems: 'center', marginBottom: 30 },
  surahName: { color: c.primary, fontSize: 20, fontWeight: 'bold' },
  surahNameEn: { color: '#aaa', fontSize: 14, marginTop: 2 },
  ayahRef: { color: c.textSecondary, marginTop: 5 },
  playButton: { marginBottom: 30 },
  playButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  playIcon: { fontSize: 24, marginRight: 10 },
  playText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center' },
  actionButton: { alignItems: 'center', marginHorizontal: 20, padding: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, minWidth: 80 },
  actionIcon: { fontSize: 24, marginBottom: 5 },
  actionText: { color: '#aaa', fontSize: 12 },
  bottomDecor: { alignItems: 'center', paddingBottom: 40 },
  bottomText: { fontSize: 40 }
});
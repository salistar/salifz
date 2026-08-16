/**
 * DailyVerseScreen - Salifz
 * ✅ DEBUG VERSION: Console logs on every action
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

const FILE_NAME = '[DailyVerseScreen]';
const { width, height } = Dimensions.get('window');

console.log(`${FILE_NAME} 📁 File loaded`);
console.log(`${FILE_NAME} 📐 Screen dimensions - width: ${width}, height: ${height}`);

const DAILY_VERSES = [
  { surah: 2, ayah: 255, text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence', surahName: 'البقرة', surahNameEn: 'Al-Baqarah' },
  { surah: 112, ayah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, He is Allah, the One', surahName: 'الإخلاص', surahNameEn: 'Al-Ikhlas' },
  { surah: 1, ayah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Gracious, the Most Merciful', surahName: 'الفاتحة', surahNameEn: 'Al-Fatiha' },
  { surah: 94, ayah: 5, text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship comes ease', surahName: 'الشرح', surahNameEn: 'Ash-Sharh' },
  { surah: 13, ayah: 28, text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest', surahName: 'الرعد', surahNameEn: 'Ar-Ra\'d' }
];

console.log(`${FILE_NAME} 📚 Daily verses configured: ${DAILY_VERSES.length} verses`);

export default function DailyVerseScreen({ navigation }: any) {
  console.log(`${FILE_NAME} 🚀 Component rendering...`);
  
  const [verse, setVerse] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log(`${FILE_NAME} 📊 Initial state - verse: ${verse ? 'loaded' : 'null'}, isPlaying: ${isPlaying}`);

  useEffect(() => {
    console.log(`${FILE_NAME} ⚡ useEffect triggered - Component mounted`);
    
    const today = new Date();
    console.log(`${FILE_NAME} 📅 Today's date: ${today.toISOString()}`);
    
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / 86400000);
    
    console.log(`${FILE_NAME} 📆 Day of year: ${dayOfYear}`);
    
    const verseIndex = dayOfYear % DAILY_VERSES.length;
    console.log(`${FILE_NAME} 🔢 Verse index calculated: ${verseIndex}`);
    
    const selectedVerse = DAILY_VERSES[verseIndex];
    console.log(`${FILE_NAME} 📖 Selected verse:`, JSON.stringify(selectedVerse));
    console.log(`${FILE_NAME} 📖 Surah: ${selectedVerse.surahName} (${selectedVerse.surahNameEn})`);
    console.log(`${FILE_NAME} 📖 Ayah: ${selectedVerse.ayah}`);
    
    setVerse(selectedVerse);
    console.log(`${FILE_NAME} ✅ Verse state updated`);
    
    return () => { 
      console.log(`${FILE_NAME} 🧹 Cleanup - Component unmounting`);
      if (sound) {
        console.log(`${FILE_NAME} 🔇 Unloading sound on cleanup`);
        sound.unloadAsync(); 
      }
    };
  }, []);

  const playAudio = async () => {
    console.log(`${FILE_NAME} 🎵 playAudio() called`);
    
    if (!verse) {
      console.log(`${FILE_NAME} ⚠️ No verse loaded, cannot play audio`);
      return;
    }
    
    console.log(`${FILE_NAME} 📊 Current state - sound: ${sound ? 'exists' : 'null'}, isPlaying: ${isPlaying}`);
    
    try {
      // If sound exists, toggle play/pause
      if (sound) { 
        if (isPlaying) { 
          console.log(`${FILE_NAME} ⏸️ Pausing audio`);
          await sound.pauseAsync(); 
          setIsPlaying(false); 
          console.log(`${FILE_NAME} ⏸️ Audio paused`);
          return; 
        } else { 
          console.log(`${FILE_NAME} ▶️ Resuming audio`);
          await sound.playAsync(); 
          setIsPlaying(true); 
          console.log(`${FILE_NAME} ▶️ Audio resumed`);
          return; 
        } 
      }
      
      // Build audio URL
      const surahPadded = String(verse.surah).padStart(3, '0');
      const ayahPadded = String(verse.ayah).padStart(3, '0');
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahPadded}${ayahPadded}.mp3`;
      
      console.log(`${FILE_NAME} 🌐 BACKEND API CALL - Building audio URL`);
      console.log(`${FILE_NAME} 🔗 API Domain: cdn.islamic.network`);
      console.log(`${FILE_NAME} 📡 Audio URL: ${audioUrl}`);
      console.log(`${FILE_NAME} 📖 Surah: ${verse.surah} (${surahPadded}), Ayah: ${verse.ayah} (${ayahPadded})`);
      
      console.log(`${FILE_NAME} 🎵 Creating sound from URL...`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl }, 
        { shouldPlay: true }
      );
      
      console.log(`${FILE_NAME} ✅ Sound created successfully`);
      
      setSound(newSound);
      setIsPlaying(true);
      console.log(`${FILE_NAME} ▶️ isPlaying set to true`);
      
      newSound.setOnPlaybackStatusUpdate((status: any) => { 
        if (status.didJustFinish) {
          console.log(`${FILE_NAME} 🏁 Audio playback finished`);
          setIsPlaying(false); 
        }
      });
      
      console.log(`${FILE_NAME} 🎧 Playback status listener attached`);
      
    } catch (error) { 
      console.error(`${FILE_NAME} ❌ ERROR in playAudio():`, error);
      console.error(`${FILE_NAME} ❌ Error details:`, JSON.stringify(error));
    }
  };

  const shareVerse = async () => {
    console.log(`${FILE_NAME} 📤 shareVerse() called`);
    
    if (!verse) {
      console.log(`${FILE_NAME} ⚠️ No verse loaded, cannot share`);
      return;
    }
    
    console.log(`${FILE_NAME} 📳 Triggering haptic feedback`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const shareMessage = `${verse.text}\n\n${verse.translation}\n\n- ${verse.surahName} (${verse.surahNameEn}), الآية ${verse.ayah}\n\n#Salifz`;
      
      console.log(`${FILE_NAME} 📤 Share message prepared:`);
      console.log(`${FILE_NAME} 📝 Message: ${shareMessage.substring(0, 100)}...`);
      
      console.log(`${FILE_NAME} 📱 Opening share dialog`);
      const result = await Share.share({ message: shareMessage });
      
      console.log(`${FILE_NAME} ✅ Share dialog result:`, result);
      
    } catch (error) { 
      console.error(`${FILE_NAME} ❌ ERROR in shareVerse():`, error);
      console.error(`${FILE_NAME} ❌ Share error details:`, JSON.stringify(error));
    }
  };

  const copyVerse = async () => {
    console.log(`${FILE_NAME} 📋 copyVerse() called`);
    
    if (!verse) {
      console.log(`${FILE_NAME} ⚠️ No verse loaded, cannot copy`);
      return;
    }
    
    try {
      const copyText = `${verse.text}\n\n${verse.translation}\n\n- ${verse.surahName} (${verse.surahNameEn}), الآية ${verse.ayah}`;
      
      console.log(`${FILE_NAME} 📋 Copying text to clipboard`);
      console.log(`${FILE_NAME} 📝 Text: ${copyText.substring(0, 50)}...`);
      
      await Clipboard.setStringAsync(copyText);
      
      console.log(`${FILE_NAME} ✅ Text copied to clipboard`);
      console.log(`${FILE_NAME} 📳 Triggering haptic feedback`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error(`${FILE_NAME} ❌ ERROR in copyVerse():`, error);
    }
  };

  const navigateToMemorize = () => {
    console.log(`${FILE_NAME} 📖 navigateToMemorize() called`);
    
    if (!verse) {
      console.log(`${FILE_NAME} ⚠️ No verse loaded, cannot navigate`);
      return;
    }
    
    const navParams = { 
      surah: { 
        id: verse.surah, 
        name: verse.surahName 
      } 
    };
    
    console.log(`${FILE_NAME} 🧭 Navigating to LessonDetail`);
    console.log(`${FILE_NAME} 📦 Navigation params:`, JSON.stringify(navParams));
    
    navigation.navigate('LessonDetail', navParams);
    
    console.log(`${FILE_NAME} ✅ Navigation triggered`);
  };

  const handleBackPress = () => {
    console.log(`${FILE_NAME} ⬅️ Back button pressed`);
    console.log(`${FILE_NAME} 🔙 Navigating back`);
    navigation.goBack();
  };

  // Loading state
  if (!verse) {
    console.log(`${FILE_NAME} ⏳ Rendering loading state - verse not yet loaded`);
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </LinearGradient>
    );
  }

  console.log(`${FILE_NAME} 🎨 Rendering main UI`);
  console.log(`${FILE_NAME} 📊 Render state - verse: ${verse.surahName}, isPlaying: ${isPlaying}`);

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>آية اليوم</Text>
        <TouchableOpacity onPress={shareVerse}>
          <Text style={styles.shareButton}>📤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.decorTop}>
          <Text style={styles.decorText}>﷽</Text>
        </View>

        <View style={styles.verseContainer}>
          <Text style={styles.arabicText}>{verse.text}</Text>
        </View>

        <View style={styles.translationContainer}>
          <Text style={styles.translationText}>{verse.translation}</Text>
        </View>

        <View style={styles.referenceContainer}>
          <Text style={styles.surahName}>{verse.surahName}</Text>
          <Text style={styles.surahNameEn}>{verse.surahNameEn}</Text>
          <Text style={styles.ayahRef}>الآية {verse.ayah}</Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={playAudio}>
          <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.playButtonGradient}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            <Text style={styles.playText}>{isPlaying ? 'إيقاف' : 'استمع'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={shareVerse}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>مشاركة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={copyVerse}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>نسخ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToMemorize}>
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionText}>احفظ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomDecor}>
        <Text style={styles.bottomText}>🌙</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { color: '#fff', fontSize: 28 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  shareButton: { fontSize: 24 },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  decorTop: { marginBottom: 20 },
  decorText: { fontSize: 40, color: COLORS.primary },
  verseContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  arabicText: { color: '#fff', fontSize: 28, textAlign: 'center', lineHeight: 55 },
  translationContainer: { paddingHorizontal: 10, marginBottom: 20 },
  translationText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 26, fontStyle: 'italic' },
  referenceContainer: { alignItems: 'center', marginBottom: 30 },
  surahName: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  surahNameEn: { color: '#aaa', fontSize: 14, marginTop: 2 },
  ayahRef: { color: '#666', marginTop: 5 },
  playButton: { marginBottom: 30 },
  playButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  playIcon: { fontSize: 24, marginRight: 10 },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center' },
  actionButton: { alignItems: 'center', marginHorizontal: 20, padding: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, minWidth: 80 },
  actionIcon: { fontSize: 24, marginBottom: 5 },
  actionText: { color: '#aaa', fontSize: 12 },
  bottomDecor: { alignItems: 'center', paddingBottom: 40 },
  bottomText: { fontSize: 40 }
});
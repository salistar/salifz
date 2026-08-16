/**
 * ============================================
 * 📱 AudioPlayerScreen.tsx - Salifz
 * ============================================
 * ✅ DEBUG VERSION: Console logs on every action
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettingsStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[AudioPlayerScreen.tsx]';
const { width } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);

// ✅ Reciters avec clés i18n pour les noms
const RECITERS = [
  { id: 'mishary', name: 'Mishary Alafasy', nameKey: 'audioPlayer.reciters.mishary' },
  { id: 'sudais', name: 'Abdul Rahman Al-Sudais', nameKey: 'audioPlayer.reciters.sudais' },
  { id: 'husary', name: 'Mahmoud Al-Husary', nameKey: 'audioPlayer.reciters.husary' }
];

console.log(`${LOG_PREFIX} 🎙️ Reciters configured:`, RECITERS.length);

export default function AudioPlayerScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering...`);
  console.log(`${LOG_PREFIX} 📥 Route params:`, JSON.stringify(route?.params || {}));
  
  const { surahId = 1, surahName = 'الفاتحة', ayahs = [] } = route.params || {};
  console.log(`${LOG_PREFIX} 📖 Surah ID: ${surahId}, Name: ${surahName}, Ayahs count: ${ayahs.length}`);
  
  const { reciter, setReciter } = useSettingsStore();
  console.log(`${LOG_PREFIX} 🎤 Current reciter from store: ${reciter}`);
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  
  console.log(`${LOG_PREFIX} 📊 Initial state - isPlaying: ${isPlaying}, currentAyah: ${currentAyah}, speed: ${playbackSpeed}, repeatMode: ${repeatMode}`);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect triggered - isPlaying changed to: ${isPlaying}`);
    
    if (isPlaying) {
      console.log(`${LOG_PREFIX} 🔄 Starting rotation animation`);
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })).start();
    } else {
      console.log(`${LOG_PREFIX} ⏹️ Stopping rotation animation`);
      rotateAnim.stopAnimation();
    }
    
    return () => { 
      console.log(`${LOG_PREFIX} 🧹 Cleanup - Unloading sound`);
      if (sound) {
        console.log(`${LOG_PREFIX} 🔇 Sound exists, calling unloadAsync()`);
        sound.unloadAsync(); 
      }
    };
  }, [isPlaying]);

  const playAyah = async (ayahIndex: number) => {
    console.log(`${LOG_PREFIX} ▶️ playAyah() called with index: ${ayahIndex}`);
    
    try {
      if (sound) {
        console.log(`${LOG_PREFIX} 🔇 Unloading previous sound`);
        await sound.unloadAsync();
      }
      
      setCurrentAyah(ayahIndex);
      console.log(`${LOG_PREFIX} 📍 Current ayah set to: ${ayahIndex}`);
      
      // Build audio URL
      const ayahNumber = String(ayahIndex + 1).padStart(3, '0');
      const surahNumber = String(surahId).padStart(3, '0');
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahNumber}${ayahNumber}.mp3`;
      
      console.log(`${LOG_PREFIX} 🌐 BACKEND API CALL - Audio URL: ${audioUrl}`);
      console.log(`${LOG_PREFIX} 🔗 API Domain: cdn.islamic.network`);
      console.log(`${LOG_PREFIX} 📡 Fetching audio for Surah: ${surahId}, Ayah: ${ayahIndex + 1}`);
      
      console.log(`${LOG_PREFIX} 🎵 Creating sound from URL...`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl }, 
        { shouldPlay: true, rate: playbackSpeed }
      );
      
      console.log(`${LOG_PREFIX} ✅ Sound created successfully`);
      console.log(`${LOG_PREFIX} 🎧 Playback speed: ${playbackSpeed}x`);
      
      setSound(newSound);
      setIsPlaying(true);
      console.log(`${LOG_PREFIX} ▶️ isPlaying set to true`);
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          
          if (status.didJustFinish) {
            console.log(`${LOG_PREFIX} 🏁 Ayah ${ayahIndex + 1} finished playing`);
            console.log(`${LOG_PREFIX} 🔄 Repeat mode: ${repeatMode}`);
            handleAyahFinished(ayahIndex);
          }
        }
      });
      
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ ERROR in playAyah():`, error);
      console.error(`${LOG_PREFIX} ❌ Error details:`, JSON.stringify(error));
    }
  };

  const handleAyahFinished = (ayahIndex: number) => {
    console.log(`${LOG_PREFIX} 🔚 handleAyahFinished() - Ayah index: ${ayahIndex}`);
    console.log(`${LOG_PREFIX} 📊 Current repeatMode: ${repeatMode}`);
    console.log(`${LOG_PREFIX} 📊 Total ayahs: ${ayahs.length || 7}`);
    
    if (repeatMode === 'one') {
      console.log(`${LOG_PREFIX} 🔂 Repeat ONE - Replaying same ayah`);
      playAyah(ayahIndex);
    } else if (ayahIndex < (ayahs.length || 7) - 1) {
      console.log(`${LOG_PREFIX} ⏭️ Playing next ayah: ${ayahIndex + 2}`);
      playAyah(ayahIndex + 1);
    } else if (repeatMode === 'all') {
      console.log(`${LOG_PREFIX} 🔁 Repeat ALL - Starting from beginning`);
      playAyah(0);
    } else {
      console.log(`${LOG_PREFIX} ⏹️ End of playlist - Stopping playback`);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    console.log(`${LOG_PREFIX} ⏯️ togglePlayPause() called`);
    console.log(`${LOG_PREFIX} 📊 Current state - sound: ${sound ? 'exists' : 'null'}, isPlaying: ${isPlaying}`);
    
    if (!sound) { 
      console.log(`${LOG_PREFIX} 🎵 No sound loaded, calling playAyah(${currentAyah})`);
      playAyah(currentAyah); 
      return; 
    }
    
    if (isPlaying) { 
      console.log(`${LOG_PREFIX} ⏸️ Pausing audio`);
      await sound.pauseAsync(); 
      setIsPlaying(false); 
      console.log(`${LOG_PREFIX} ⏸️ Audio paused`);
    } else { 
      console.log(`${LOG_PREFIX} ▶️ Resuming audio`);
      await sound.playAsync(); 
      setIsPlaying(true); 
      console.log(`${LOG_PREFIX} ▶️ Audio resumed`);
    }
  };

  const seekTo = async (value: number) => { 
    console.log(`${LOG_PREFIX} 🔍 seekTo() called with value: ${value}ms`);
    
    if (sound) { 
      console.log(`${LOG_PREFIX} ⏩ Setting position to: ${value}ms`);
      await sound.setPositionAsync(value); 
      setPosition(value); 
      console.log(`${LOG_PREFIX} ✅ Position updated`);
    } else {
      console.log(`${LOG_PREFIX} ⚠️ Cannot seek - no sound loaded`);
    }
  };

  const changeSpeed = async () => {
    console.log(`${LOG_PREFIX} ⚡ changeSpeed() called`);
    console.log(`${LOG_PREFIX} 📊 Current speed: ${playbackSpeed}x`);
    
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    console.log(`${LOG_PREFIX} 🔄 Changing speed from ${playbackSpeed}x to ${nextSpeed}x`);
    
    setPlaybackSpeed(nextSpeed);
    
    if (sound) {
      console.log(`${LOG_PREFIX} 🎚️ Applying new speed to sound`);
      await sound.setRateAsync(nextSpeed, true);
      console.log(`${LOG_PREFIX} ✅ Speed changed to ${nextSpeed}x`);
    }
  };

  const toggleRepeat = () => {
    console.log(`${LOG_PREFIX} 🔁 toggleRepeat() called`);
    console.log(`${LOG_PREFIX} 📊 Current repeatMode: ${repeatMode}`);
    
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    console.log(`${LOG_PREFIX} 🔄 Changing repeat mode from '${repeatMode}' to '${nextMode}'`);
    setRepeatMode(nextMode);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReciterChange = (reciterId: string) => {
    console.log(`${LOG_PREFIX} 🎤 handleReciterChange() called with: ${reciterId}`);
    console.log(`${LOG_PREFIX} 🔄 Previous reciter: ${reciter}`);
    
    setReciter(reciterId);
    setShowReciterPicker(false);
    
    console.log(`${LOG_PREFIX} ✅ Reciter changed to: ${reciterId}`);
    
    if (isPlaying) {
      console.log(`${LOG_PREFIX} 🔄 Was playing, restarting with new reciter`);
      playAyah(currentAyah);
    }
  };

  const handleAyahSelect = (index: number) => {
    console.log(`${LOG_PREFIX} 👆 Ayah selected from list: ${index + 1}`);
    playAyah(index);
  };

  const handleBackPress = () => {
    console.log(`${LOG_PREFIX} ⬅️ Back button pressed`);
    console.log(`${LOG_PREFIX} 🔙 Navigating back`);
    navigation.goBack();
  };

  const handleShowReciterPicker = () => {
    console.log(`${LOG_PREFIX} 🎤 Opening reciter picker`);
    setShowReciterPicker(true);
  };

  const handleCloseReciterPicker = () => {
    console.log(`${LOG_PREFIX} ❌ Closing reciter picker`);
    setShowReciterPicker(false);
  };

  const handlePreviousAyah = () => {
    console.log(`${LOG_PREFIX} ⏮️ Previous button pressed`);
    console.log(`${LOG_PREFIX} 📊 Current ayah: ${currentAyah + 1}`);
    
    if (currentAyah > 0) {
      console.log(`${LOG_PREFIX} ⏮️ Going to previous ayah: ${currentAyah}`);
      playAyah(currentAyah - 1);
    } else {
      console.log(`${LOG_PREFIX} ⚠️ Already at first ayah`);
    }
  };

  const handleNextAyah = () => {
    console.log(`${LOG_PREFIX} ⏭️ Next button pressed`);
    console.log(`${LOG_PREFIX} 📊 Current ayah: ${currentAyah + 1}`);
    console.log(`${LOG_PREFIX} ⏭️ Going to next ayah: ${currentAyah + 2}`);
    playAyah(currentAyah + 1);
  };

  // ✅ Helper pour obtenir le nom du reciter actuel
  const getCurrentReciterName = () => {
    const currentReciter = RECITERS.find(r => r.id === reciter);
    if (currentReciter) {
      return t(currentReciter.nameKey);
    }
    return t('audioPlayer.reciters.mishary'); // Default
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);
  console.log(`${LOG_PREFIX} 📊 Render state - isPlaying: ${isPlaying}, currentAyah: ${currentAyah + 1}, position: ${formatTime(position)}, duration: ${formatTime(duration)}`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.surahName}>{surahName}</Text>
          <TouchableOpacity accessible accessibilityRole="button" onPress={handleShowReciterPicker}>
            {/* ✅ AVANT: 'مشاري العفاسي' hardcodé */}
            <Text style={styles.reciterName}>{getCurrentReciterName()} ▼</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Vinyl Animation */}
      <View style={styles.vinylContainer}>
        <Animated.View style={[styles.vinyl, { transform: [{ rotate: spin }] }]}>
          <View style={styles.vinylInner}><Text style={styles.vinylText}>📖</Text></View>
        </Animated.View>
      </View>

      {/* Current Ayah Display */}
      <View style={styles.currentAyahContainer}>
        {/* ✅ AVANT: 'الآية X' */}
        <Text style={styles.currentAyahLabel}>{t('audioPlayer.ayahNumber', { number: currentAyah + 1 })}</Text>
        {/* Note: Le texte coranique reste en arabe */}
        <Text style={styles.currentAyahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      </View>

      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Slider 
          style={styles.slider} 
          value={position} 
          minimumValue={0} 
          maximumValue={duration || 1} 
          onSlidingComplete={(value) => {
            console.log(`${LOG_PREFIX} 🎚️ Slider changed to: ${value}ms`);
            seekTo(value);
          }} 
          minimumTrackTintColor={colors.primary} 
          maximumTrackTintColor="#444" 
          thumbTintColor={colors.primary} 
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.controlButton} onPress={changeSpeed}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.controlButton} onPress={handlePreviousAyah} disabled={currentAyah === 0}>
          <Text style={[styles.controlIcon, currentAyah === 0 && styles.controlDisabled]}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.playButton} onPress={togglePlayPause}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.playButtonGradient}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.controlButton} onPress={handleNextAyah}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.controlButton} onPress={toggleRepeat}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && styles.controlActive]}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ayahs List */}
      <View style={styles.listContainer}>
        {/* ✅ AVANT: 'قائمة الآيات' */}
        <Text style={styles.listTitle}>{t('audioPlayer.ayahsList')}</Text>
        <ScrollView style={styles.ayahsList}>
          {[1, 2, 3, 4, 5, 6, 7].map((num, index) => (
            <TouchableOpacity accessible accessibilityRole="button" 
              key={index} 
              style={[styles.ayahItem, currentAyah === index && styles.ayahItemActive]} 
              onPress={() => handleAyahSelect(index)}
            >
              <View style={styles.ayahNumber}>
                <Text style={styles.ayahNumberText}>{num}</Text>
              </View>
              {/* ✅ AVANT: 'آية X' */}
              <Text style={[styles.ayahItemText, currentAyah === index && styles.ayahItemTextActive]}>
                {t('audioPlayer.ayahX', { number: num })}
              </Text>
              {currentAyah === index && isPlaying && <Text style={styles.playingIndicator}>🔊</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reciter Picker Modal */}
      {showReciterPicker && (
        <TouchableOpacity accessible accessibilityRole="button" style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseReciterPicker}>
          <View style={styles.reciterPicker}>
            {/* ✅ AVANT: 'اختر القارئ' */}
            <Text style={styles.pickerTitle}>{t('audioPlayer.selectReciter')}</Text>
            {RECITERS.map((r) => (
              <TouchableOpacity accessible accessibilityRole="button" 
                key={r.id} 
                style={[styles.reciterOption, reciter === r.id && styles.reciterOptionActive]} 
                onPress={() => handleReciterChange(r.id)}
              >
                {/* ✅ AVANT: r.nameAr */}
                <Text style={styles.reciterOptionText}>{t(r.nameKey)}</Text>
                <Text style={styles.reciterOptionSubtext}>{r.name}</Text>
                {reciter === r.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.canvasDeep },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 15 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: c.onDeep, fontSize: 24 },
  headerCenter: { alignItems: 'center' },
  surahName: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  reciterName: { color: '#aaa', marginTop: 5 },
  vinylContainer: { alignItems: 'center', marginVertical: 20 },
  vinyl: { width: 150, height: 150, borderRadius: 75, backgroundColor: c.text, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444' },
  vinylInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.canvasDeep, justifyContent: 'center', alignItems: 'center' },
  vinylText: { fontSize: 25 },
  currentAyahContainer: { paddingHorizontal: 20, alignItems: 'center' },
  currentAyahLabel: { color: c.primary, marginBottom: 10 },
  currentAyahText: { color: c.onDeep, fontSize: 22, textAlign: 'center', lineHeight: 38 },
  progressContainer: { paddingHorizontal: 20, marginTop: 30 },
  slider: { width: '100%', height: 40 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#aaa', fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  controlButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  controlIcon: { fontSize: 24, color: c.onDeep },
  controlDisabled: { opacity: 0.3 },
  controlActive: { color: c.primary },
  speedText: { color: c.onDeep, fontWeight: 'bold' },
  playButton: { marginHorizontal: 20 },
  playButtonGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 30 },
  listContainer: { flex: 1, marginTop: 20, backgroundColor: c.canvasDeepAlt, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  listTitle: { color: c.onDeep, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  ayahsList: { flex: 1 },
  ayahItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: c.canvasDeep },
  ayahItemActive: { backgroundColor: c.primary + '30' },
  ayahNumber: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: c.text, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ayahNumberText: { color: c.onDeep, fontSize: 12 },
  ayahItemText: { flex: 1, color: c.textMuted, fontSize: 14, textAlign: 'right' },
  ayahItemTextActive: { color: c.onDeep },
  playingIndicator: { marginLeft: 10 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  reciterPicker: { backgroundColor: c.canvasDeep, borderRadius: 20, padding: 20, width: width - 60 },
  pickerTitle: { color: c.onDeep, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  reciterOption: { padding: 15, borderRadius: 10, marginBottom: 10, backgroundColor: c.canvasDeepAlt, flexDirection: 'row', alignItems: 'center' },
  reciterOptionActive: { backgroundColor: c.primary + '30', borderColor: c.primary, borderWidth: 1 },
  reciterOptionText: { color: c.onDeep, fontSize: 16, flex: 1 },
  reciterOptionSubtext: { color: '#aaa', fontSize: 12 },
  checkmark: { color: c.primary, fontSize: 20, fontWeight: 'bold' }
});
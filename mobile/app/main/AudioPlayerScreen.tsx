/**
 * AudioPlayerScreen - Salifz
 * ✅ DEBUG VERSION: Console logs on every action
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

const FILE_NAME = '[AudioPlayerScreen]';
const { width } = Dimensions.get('window');

console.log(`${FILE_NAME} 📁 File loaded`);

const RECITERS = [
  { id: 'mishary', name: 'Mishary Alafasy', nameAr: 'مشاري العفاسي' },
  { id: 'sudais', name: 'Abdul Rahman Al-Sudais', nameAr: 'عبدالرحمن السديس' },
  { id: 'husary', name: 'Mahmoud Al-Husary', nameAr: 'محمود الحصري' }
];

console.log(`${FILE_NAME} 🎙️ Reciters configured:`, RECITERS.length);

export default function AudioPlayerScreen({ route, navigation }: any) {
  console.log(`${FILE_NAME} 🚀 Component rendering...`);
  console.log(`${FILE_NAME} 📥 Route params:`, JSON.stringify(route?.params || {}));
  
  const { surahId = 1, surahName = 'الفاتحة', ayahs = [] } = route.params || {};
  console.log(`${FILE_NAME} 📖 Surah ID: ${surahId}, Name: ${surahName}, Ayahs count: ${ayahs.length}`);
  
  const { reciter, setReciter } = useSettingsStore();
  console.log(`${FILE_NAME} 🎤 Current reciter from store: ${reciter}`);
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  
  console.log(`${FILE_NAME} 📊 Initial state - isPlaying: ${isPlaying}, currentAyah: ${currentAyah}, speed: ${playbackSpeed}, repeatMode: ${repeatMode}`);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(`${FILE_NAME} ⚡ useEffect triggered - isPlaying changed to: ${isPlaying}`);
    
    if (isPlaying) {
      console.log(`${FILE_NAME} 🔄 Starting rotation animation`);
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })).start();
    } else {
      console.log(`${FILE_NAME} ⏹️ Stopping rotation animation`);
      rotateAnim.stopAnimation();
    }
    
    return () => { 
      console.log(`${FILE_NAME} 🧹 Cleanup - Unloading sound`);
      if (sound) {
        console.log(`${FILE_NAME} 🔇 Sound exists, calling unloadAsync()`);
        sound.unloadAsync(); 
      }
    };
  }, [isPlaying]);

  const playAyah = async (ayahIndex: number) => {
    console.log(`${FILE_NAME} ▶️ playAyah() called with index: ${ayahIndex}`);
    
    try {
      if (sound) {
        console.log(`${FILE_NAME} 🔇 Unloading previous sound`);
        await sound.unloadAsync();
      }
      
      setCurrentAyah(ayahIndex);
      console.log(`${FILE_NAME} 📍 Current ayah set to: ${ayahIndex}`);
      
      // Build audio URL
      const ayahNumber = String(ayahIndex + 1).padStart(3, '0');
      const surahNumber = String(surahId).padStart(3, '0');
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahNumber}${ayahNumber}.mp3`;
      
      console.log(`${FILE_NAME} 🌐 BACKEND API CALL - Audio URL: ${audioUrl}`);
      console.log(`${FILE_NAME} 🔗 API Domain: cdn.islamic.network`);
      console.log(`${FILE_NAME} 📡 Fetching audio for Surah: ${surahId}, Ayah: ${ayahIndex + 1}`);
      
      console.log(`${FILE_NAME} 🎵 Creating sound from URL...`);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl }, 
        { shouldPlay: true, rate: playbackSpeed }
      );
      
      console.log(`${FILE_NAME} ✅ Sound created successfully`);
      console.log(`${FILE_NAME} 🎧 Playback speed: ${playbackSpeed}x`);
      
      setSound(newSound);
      setIsPlaying(true);
      console.log(`${FILE_NAME} ▶️ isPlaying set to true`);
      
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          
          if (status.didJustFinish) {
            console.log(`${FILE_NAME} 🏁 Ayah ${ayahIndex + 1} finished playing`);
            console.log(`${FILE_NAME} 🔄 Repeat mode: ${repeatMode}`);
            handleAyahFinished(ayahIndex);
          }
        }
      });
      
    } catch (error) { 
      console.error(`${FILE_NAME} ❌ ERROR in playAyah():`, error);
      console.error(`${FILE_NAME} ❌ Error details:`, JSON.stringify(error));
    }
  };

  const handleAyahFinished = (ayahIndex: number) => {
    console.log(`${FILE_NAME} 🔚 handleAyahFinished() - Ayah index: ${ayahIndex}`);
    console.log(`${FILE_NAME} 📊 Current repeatMode: ${repeatMode}`);
    console.log(`${FILE_NAME} 📊 Total ayahs: ${ayahs.length || 7}`);
    
    if (repeatMode === 'one') {
      console.log(`${FILE_NAME} 🔂 Repeat ONE - Replaying same ayah`);
      playAyah(ayahIndex);
    } else if (ayahIndex < (ayahs.length || 7) - 1) {
      console.log(`${FILE_NAME} ⏭️ Playing next ayah: ${ayahIndex + 2}`);
      playAyah(ayahIndex + 1);
    } else if (repeatMode === 'all') {
      console.log(`${FILE_NAME} 🔁 Repeat ALL - Starting from beginning`);
      playAyah(0);
    } else {
      console.log(`${FILE_NAME} ⏹️ End of playlist - Stopping playback`);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    console.log(`${FILE_NAME} ⏯️ togglePlayPause() called`);
    console.log(`${FILE_NAME} 📊 Current state - sound: ${sound ? 'exists' : 'null'}, isPlaying: ${isPlaying}`);
    
    if (!sound) { 
      console.log(`${FILE_NAME} 🎵 No sound loaded, calling playAyah(${currentAyah})`);
      playAyah(currentAyah); 
      return; 
    }
    
    if (isPlaying) { 
      console.log(`${FILE_NAME} ⏸️ Pausing audio`);
      await sound.pauseAsync(); 
      setIsPlaying(false); 
      console.log(`${FILE_NAME} ⏸️ Audio paused`);
    } else { 
      console.log(`${FILE_NAME} ▶️ Resuming audio`);
      await sound.playAsync(); 
      setIsPlaying(true); 
      console.log(`${FILE_NAME} ▶️ Audio resumed`);
    }
  };

  const seekTo = async (value: number) => { 
    console.log(`${FILE_NAME} 🔍 seekTo() called with value: ${value}ms`);
    
    if (sound) { 
      console.log(`${FILE_NAME} ⏩ Setting position to: ${value}ms`);
      await sound.setPositionAsync(value); 
      setPosition(value); 
      console.log(`${FILE_NAME} ✅ Position updated`);
    } else {
      console.log(`${FILE_NAME} ⚠️ Cannot seek - no sound loaded`);
    }
  };

  const changeSpeed = async () => {
    console.log(`${FILE_NAME} ⚡ changeSpeed() called`);
    console.log(`${FILE_NAME} 📊 Current speed: ${playbackSpeed}x`);
    
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    console.log(`${FILE_NAME} 🔄 Changing speed from ${playbackSpeed}x to ${nextSpeed}x`);
    
    setPlaybackSpeed(nextSpeed);
    
    if (sound) {
      console.log(`${FILE_NAME} 🎚️ Applying new speed to sound`);
      await sound.setRateAsync(nextSpeed, true);
      console.log(`${FILE_NAME} ✅ Speed changed to ${nextSpeed}x`);
    }
  };

  const toggleRepeat = () => {
    console.log(`${FILE_NAME} 🔁 toggleRepeat() called`);
    console.log(`${FILE_NAME} 📊 Current repeatMode: ${repeatMode}`);
    
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    console.log(`${FILE_NAME} 🔄 Changing repeat mode from '${repeatMode}' to '${nextMode}'`);
    setRepeatMode(nextMode);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReciterChange = (reciterId: string) => {
    console.log(`${FILE_NAME} 🎤 handleReciterChange() called with: ${reciterId}`);
    console.log(`${FILE_NAME} 🔄 Previous reciter: ${reciter}`);
    
    setReciter(reciterId);
    setShowReciterPicker(false);
    
    console.log(`${FILE_NAME} ✅ Reciter changed to: ${reciterId}`);
    
    if (isPlaying) {
      console.log(`${FILE_NAME} 🔄 Was playing, restarting with new reciter`);
      playAyah(currentAyah);
    }
  };

  const handleAyahSelect = (index: number) => {
    console.log(`${FILE_NAME} 👆 Ayah selected from list: ${index + 1}`);
    playAyah(index);
  };

  const handleBackPress = () => {
    console.log(`${FILE_NAME} ⬅️ Back button pressed`);
    console.log(`${FILE_NAME} 🔙 Navigating back`);
    navigation.goBack();
  };

  const handleShowReciterPicker = () => {
    console.log(`${FILE_NAME} 🎤 Opening reciter picker`);
    setShowReciterPicker(true);
  };

  const handleCloseReciterPicker = () => {
    console.log(`${FILE_NAME} ❌ Closing reciter picker`);
    setShowReciterPicker(false);
  };

  const handlePreviousAyah = () => {
    console.log(`${FILE_NAME} ⏮️ Previous button pressed`);
    console.log(`${FILE_NAME} 📊 Current ayah: ${currentAyah + 1}`);
    
    if (currentAyah > 0) {
      console.log(`${FILE_NAME} ⏮️ Going to previous ayah: ${currentAyah}`);
      playAyah(currentAyah - 1);
    } else {
      console.log(`${FILE_NAME} ⚠️ Already at first ayah`);
    }
  };

  const handleNextAyah = () => {
    console.log(`${FILE_NAME} ⏭️ Next button pressed`);
    console.log(`${FILE_NAME} 📊 Current ayah: ${currentAyah + 1}`);
    console.log(`${FILE_NAME} ⏭️ Going to next ayah: ${currentAyah + 2}`);
    playAyah(currentAyah + 1);
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  console.log(`${FILE_NAME} 🎨 Rendering UI...`);
  console.log(`${FILE_NAME} 📊 Render state - isPlaying: ${isPlaying}, currentAyah: ${currentAyah + 1}, position: ${formatTime(position)}, duration: ${formatTime(duration)}`);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.surahName}>{surahName}</Text>
          <TouchableOpacity onPress={handleShowReciterPicker}>
            <Text style={styles.reciterName}>{RECITERS.find(r => r.id === reciter)?.nameAr || 'مشاري العفاسي'} ▼</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.vinylContainer}>
        <Animated.View style={[styles.vinyl, { transform: [{ rotate: spin }] }]}>
          <View style={styles.vinylInner}><Text style={styles.vinylText}>📖</Text></View>
        </Animated.View>
      </View>

      <View style={styles.currentAyahContainer}>
        <Text style={styles.currentAyahLabel}>الآية {currentAyah + 1}</Text>
        <Text style={styles.currentAyahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider 
          style={styles.slider} 
          value={position} 
          minimumValue={0} 
          maximumValue={duration || 1} 
          onSlidingComplete={(value) => {
            console.log(`${FILE_NAME} 🎚️ Slider changed to: ${value}ms`);
            seekTo(value);
          }} 
          minimumTrackTintColor={COLORS.primary} 
          maximumTrackTintColor="#444" 
          thumbTintColor={COLORS.primary} 
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={changeSpeed}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handlePreviousAyah} disabled={currentAyah === 0}>
          <Text style={[styles.controlIcon, currentAyah === 0 && styles.controlDisabled]}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.playButtonGradient}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleNextAyah}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleRepeat}>
          <Text style={[styles.controlIcon, repeatMode !== 'none' && styles.controlActive]}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>قائمة الآيات</Text>
        <ScrollView style={styles.ayahsList}>
          {[1, 2, 3, 4, 5, 6, 7].map((num, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.ayahItem, currentAyah === index && styles.ayahItemActive]} 
              onPress={() => handleAyahSelect(index)}
            >
              <View style={styles.ayahNumber}>
                <Text style={styles.ayahNumberText}>{num}</Text>
              </View>
              <Text style={[styles.ayahItemText, currentAyah === index && styles.ayahItemTextActive]}>
                آية {num}
              </Text>
              {currentAyah === index && isPlaying && <Text style={styles.playingIndicator}>🔊</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {showReciterPicker && (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseReciterPicker}>
          <View style={styles.reciterPicker}>
            <Text style={styles.pickerTitle}>اختر القارئ</Text>
            {RECITERS.map((r) => (
              <TouchableOpacity 
                key={r.id} 
                style={[styles.reciterOption, reciter === r.id && styles.reciterOptionActive]} 
                onPress={() => handleReciterChange(r.id)}
              >
                <Text style={styles.reciterOptionText}>{r.nameAr}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 15 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#fff', fontSize: 24 },
  headerCenter: { alignItems: 'center' },
  surahName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  reciterName: { color: '#aaa', marginTop: 5 },
  vinylContainer: { alignItems: 'center', marginVertical: 20 },
  vinyl: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444' },
  vinylInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  vinylText: { fontSize: 25 },
  currentAyahContainer: { paddingHorizontal: 20, alignItems: 'center' },
  currentAyahLabel: { color: COLORS.primary, marginBottom: 10 },
  currentAyahText: { color: '#fff', fontSize: 22, textAlign: 'center', lineHeight: 38 },
  progressContainer: { paddingHorizontal: 20, marginTop: 30 },
  slider: { width: '100%', height: 40 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: '#aaa', fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  controlButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  controlIcon: { fontSize: 24, color: '#fff' },
  controlDisabled: { opacity: 0.3 },
  controlActive: { color: COLORS.primary },
  speedText: { color: '#fff', fontWeight: 'bold' },
  playButton: { marginHorizontal: 20 },
  playButtonGradient: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 30 },
  listContainer: { flex: 1, marginTop: 20, backgroundColor: '#16213e', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  listTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  ayahsList: { flex: 1 },
  ayahItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#1a1a2e' },
  ayahItemActive: { backgroundColor: COLORS.primary + '30' },
  ayahNumber: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ayahNumberText: { color: '#fff', fontSize: 12 },
  ayahItemText: { flex: 1, color: '#ccc', fontSize: 14, textAlign: 'right' },
  ayahItemTextActive: { color: '#fff' },
  playingIndicator: { marginLeft: 10 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  reciterPicker: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, width: width - 60 },
  pickerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  reciterOption: { padding: 15, borderRadius: 10, marginBottom: 10, backgroundColor: '#16213e', flexDirection: 'row', alignItems: 'center' },
  reciterOptionActive: { backgroundColor: COLORS.primary + '30', borderColor: COLORS.primary, borderWidth: 1 },
  reciterOptionText: { color: '#fff', fontSize: 16, flex: 1 },
  reciterOptionSubtext: { color: '#aaa', fontSize: 12 },
  checkmark: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' }
});
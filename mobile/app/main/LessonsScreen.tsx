/**
 * LessonsScreen - Salifz v3
 * ✅ DUOLINGO STYLE: Path-based progression
 * ✅ FIXED: Progress API response handling
 * ✅ FIXED: Ajzae/Ahzab synchronization
 * ✅ 114 Surahs complets
 * ✅ Blocs de 5 ayat
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, RefreshControl, 
  Dimensions, FlatList, Modal, Alert, Animated, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { progressAPI } from '../../services/api';
import { useGamificationStore } from '../../stores';
import { COLORS } from '../../config';

const FILE_NAME = '[LessonsScreen]';
const { width, height } = Dimensions.get('window');
console.log(`${FILE_NAME} 📁 File loaded`);

// ═══════════════════════════════════════════════════════════════
// 114 SOURATES COMPLÈTES
// ═══════════════════════════════════════════════════════════════
export const SURAHS = [
  { id: 1, name: 'الفاتحة', nameEn: 'Al-Fatiha', ayahs: 7, juz: 1, hizb: 1 },
  { id: 2, name: 'البقرة', nameEn: 'Al-Baqarah', ayahs: 286, juz: 1, hizb: 1 },
  { id: 3, name: 'آل عمران', nameEn: 'Aal-Imran', ayahs: 200, juz: 3, hizb: 6 },
  { id: 4, name: 'النساء', nameEn: 'An-Nisa', ayahs: 176, juz: 4, hizb: 8 },
  { id: 5, name: 'المائدة', nameEn: 'Al-Maidah', ayahs: 120, juz: 6, hizb: 11 },
  { id: 6, name: 'الأنعام', nameEn: 'Al-Anam', ayahs: 165, juz: 7, hizb: 13 },
  { id: 7, name: 'الأعراف', nameEn: 'Al-Araf', ayahs: 206, juz: 8, hizb: 15 },
  { id: 8, name: 'الأنفال', nameEn: 'Al-Anfal', ayahs: 75, juz: 9, hizb: 18 },
  { id: 9, name: 'التوبة', nameEn: 'At-Tawbah', ayahs: 129, juz: 10, hizb: 19 },
  { id: 10, name: 'يونس', nameEn: 'Yunus', ayahs: 109, juz: 11, hizb: 21 },
  { id: 11, name: 'هود', nameEn: 'Hud', ayahs: 123, juz: 11, hizb: 22 },
  { id: 12, name: 'يوسف', nameEn: 'Yusuf', ayahs: 111, juz: 12, hizb: 24 },
  { id: 13, name: 'الرعد', nameEn: 'Ar-Rad', ayahs: 43, juz: 13, hizb: 25 },
  { id: 14, name: 'إبراهيم', nameEn: 'Ibrahim', ayahs: 52, juz: 13, hizb: 26 },
  { id: 15, name: 'الحجر', nameEn: 'Al-Hijr', ayahs: 99, juz: 14, hizb: 27 },
  { id: 16, name: 'النحل', nameEn: 'An-Nahl', ayahs: 128, juz: 14, hizb: 27 },
  { id: 17, name: 'الإسراء', nameEn: 'Al-Isra', ayahs: 111, juz: 15, hizb: 29 },
  { id: 18, name: 'الكهف', nameEn: 'Al-Kahf', ayahs: 110, juz: 15, hizb: 30 },
  { id: 19, name: 'مريم', nameEn: 'Maryam', ayahs: 98, juz: 16, hizb: 31 },
  { id: 20, name: 'طه', nameEn: 'Ta-Ha', ayahs: 135, juz: 16, hizb: 31 },
  { id: 21, name: 'الأنبياء', nameEn: 'Al-Anbiya', ayahs: 112, juz: 17, hizb: 33 },
  { id: 22, name: 'الحج', nameEn: 'Al-Hajj', ayahs: 78, juz: 17, hizb: 34 },
  { id: 23, name: 'المؤمنون', nameEn: 'Al-Muminun', ayahs: 118, juz: 18, hizb: 35 },
  { id: 24, name: 'النور', nameEn: 'An-Nur', ayahs: 64, juz: 18, hizb: 35 },
  { id: 25, name: 'الفرقان', nameEn: 'Al-Furqan', ayahs: 77, juz: 18, hizb: 36 },
  { id: 26, name: 'الشعراء', nameEn: 'Ash-Shuara', ayahs: 227, juz: 19, hizb: 37 },
  { id: 27, name: 'النمل', nameEn: 'An-Naml', ayahs: 93, juz: 19, hizb: 38 },
  { id: 28, name: 'القصص', nameEn: 'Al-Qasas', ayahs: 88, juz: 20, hizb: 39 },
  { id: 29, name: 'العنكبوت', nameEn: 'Al-Ankabut', ayahs: 69, juz: 20, hizb: 40 },
  { id: 30, name: 'الروم', nameEn: 'Ar-Rum', ayahs: 60, juz: 21, hizb: 41 },
  { id: 31, name: 'لقمان', nameEn: 'Luqman', ayahs: 34, juz: 21, hizb: 41 },
  { id: 32, name: 'السجدة', nameEn: 'As-Sajdah', ayahs: 30, juz: 21, hizb: 42 },
  { id: 33, name: 'الأحزاب', nameEn: 'Al-Ahzab', ayahs: 73, juz: 21, hizb: 42 },
  { id: 34, name: 'سبأ', nameEn: 'Saba', ayahs: 54, juz: 22, hizb: 43 },
  { id: 35, name: 'فاطر', nameEn: 'Fatir', ayahs: 45, juz: 22, hizb: 44 },
  { id: 36, name: 'يس', nameEn: 'Ya-Sin', ayahs: 83, juz: 22, hizb: 44 },
  { id: 37, name: 'الصافات', nameEn: 'As-Saffat', ayahs: 182, juz: 23, hizb: 45 },
  { id: 38, name: 'ص', nameEn: 'Sad', ayahs: 88, juz: 23, hizb: 46 },
  { id: 39, name: 'الزمر', nameEn: 'Az-Zumar', ayahs: 75, juz: 23, hizb: 46 },
  { id: 40, name: 'غافر', nameEn: 'Ghafir', ayahs: 85, juz: 24, hizb: 47 },
  { id: 41, name: 'فصلت', nameEn: 'Fussilat', ayahs: 54, juz: 24, hizb: 48 },
  { id: 42, name: 'الشورى', nameEn: 'Ash-Shura', ayahs: 53, juz: 25, hizb: 49 },
  { id: 43, name: 'الزخرف', nameEn: 'Az-Zukhruf', ayahs: 89, juz: 25, hizb: 49 },
  { id: 44, name: 'الدخان', nameEn: 'Ad-Dukhan', ayahs: 59, juz: 25, hizb: 50 },
  { id: 45, name: 'الجاثية', nameEn: 'Al-Jathiyah', ayahs: 37, juz: 25, hizb: 50 },
  { id: 46, name: 'الأحقاف', nameEn: 'Al-Ahqaf', ayahs: 35, juz: 26, hizb: 51 },
  { id: 47, name: 'محمد', nameEn: 'Muhammad', ayahs: 38, juz: 26, hizb: 51 },
  { id: 48, name: 'الفتح', nameEn: 'Al-Fath', ayahs: 29, juz: 26, hizb: 52 },
  { id: 49, name: 'الحجرات', nameEn: 'Al-Hujurat', ayahs: 18, juz: 26, hizb: 52 },
  { id: 50, name: 'ق', nameEn: 'Qaf', ayahs: 45, juz: 26, hizb: 52 },
  { id: 51, name: 'الذاريات', nameEn: 'Adh-Dhariyat', ayahs: 60, juz: 26, hizb: 52 },
  { id: 52, name: 'الطور', nameEn: 'At-Tur', ayahs: 49, juz: 27, hizb: 53 },
  { id: 53, name: 'النجم', nameEn: 'An-Najm', ayahs: 62, juz: 27, hizb: 53 },
  { id: 54, name: 'القمر', nameEn: 'Al-Qamar', ayahs: 55, juz: 27, hizb: 54 },
  { id: 55, name: 'الرحمن', nameEn: 'Ar-Rahman', ayahs: 78, juz: 27, hizb: 54 },
  { id: 56, name: 'الواقعة', nameEn: 'Al-Waqiah', ayahs: 96, juz: 27, hizb: 54 },
  { id: 57, name: 'الحديد', nameEn: 'Al-Hadid', ayahs: 29, juz: 27, hizb: 54 },
  { id: 58, name: 'المجادلة', nameEn: 'Al-Mujadila', ayahs: 22, juz: 28, hizb: 55 },
  { id: 59, name: 'الحشر', nameEn: 'Al-Hashr', ayahs: 24, juz: 28, hizb: 55 },
  { id: 60, name: 'الممتحنة', nameEn: 'Al-Mumtahina', ayahs: 13, juz: 28, hizb: 56 },
  { id: 61, name: 'الصف', nameEn: 'As-Saff', ayahs: 14, juz: 28, hizb: 56 },
  { id: 62, name: 'الجمعة', nameEn: 'Al-Jumuah', ayahs: 11, juz: 28, hizb: 56 },
  { id: 63, name: 'المنافقون', nameEn: 'Al-Munafiqun', ayahs: 11, juz: 28, hizb: 56 },
  { id: 64, name: 'التغابن', nameEn: 'At-Taghabun', ayahs: 18, juz: 28, hizb: 56 },
  { id: 65, name: 'الطلاق', nameEn: 'At-Talaq', ayahs: 12, juz: 28, hizb: 56 },
  { id: 66, name: 'التحريم', nameEn: 'At-Tahrim', ayahs: 12, juz: 28, hizb: 57 },
  { id: 67, name: 'الملك', nameEn: 'Al-Mulk', ayahs: 30, juz: 29, hizb: 57 },
  { id: 68, name: 'القلم', nameEn: 'Al-Qalam', ayahs: 52, juz: 29, hizb: 57 },
  { id: 69, name: 'الحاقة', nameEn: 'Al-Haqqah', ayahs: 52, juz: 29, hizb: 57 },
  { id: 70, name: 'المعارج', nameEn: 'Al-Maarij', ayahs: 44, juz: 29, hizb: 58 },
  { id: 71, name: 'نوح', nameEn: 'Nuh', ayahs: 28, juz: 29, hizb: 58 },
  { id: 72, name: 'الجن', nameEn: 'Al-Jinn', ayahs: 28, juz: 29, hizb: 58 },
  { id: 73, name: 'المزمل', nameEn: 'Al-Muzzammil', ayahs: 20, juz: 29, hizb: 58 },
  { id: 74, name: 'المدثر', nameEn: 'Al-Muddaththir', ayahs: 56, juz: 29, hizb: 58 },
  { id: 75, name: 'القيامة', nameEn: 'Al-Qiyamah', ayahs: 40, juz: 29, hizb: 58 },
  { id: 76, name: 'الإنسان', nameEn: 'Al-Insan', ayahs: 31, juz: 29, hizb: 58 },
  { id: 77, name: 'المرسلات', nameEn: 'Al-Mursalat', ayahs: 50, juz: 29, hizb: 58 },
  { id: 78, name: 'النبأ', nameEn: 'An-Naba', ayahs: 40, juz: 30, hizb: 59 },
  { id: 79, name: 'النازعات', nameEn: 'An-Naziat', ayahs: 46, juz: 30, hizb: 59 },
  { id: 80, name: 'عبس', nameEn: 'Abasa', ayahs: 42, juz: 30, hizb: 59 },
  { id: 81, name: 'التكوير', nameEn: 'At-Takwir', ayahs: 29, juz: 30, hizb: 59 },
  { id: 82, name: 'الانفطار', nameEn: 'Al-Infitar', ayahs: 19, juz: 30, hizb: 59 },
  { id: 83, name: 'المطففين', nameEn: 'Al-Mutaffifin', ayahs: 36, juz: 30, hizb: 59 },
  { id: 84, name: 'الانشقاق', nameEn: 'Al-Inshiqaq', ayahs: 25, juz: 30, hizb: 59 },
  { id: 85, name: 'البروج', nameEn: 'Al-Buruj', ayahs: 22, juz: 30, hizb: 59 },
  { id: 86, name: 'الطارق', nameEn: 'At-Tariq', ayahs: 17, juz: 30, hizb: 59 },
  { id: 87, name: 'الأعلى', nameEn: 'Al-Ala', ayahs: 19, juz: 30, hizb: 59 },
  { id: 88, name: 'الغاشية', nameEn: 'Al-Ghashiyah', ayahs: 26, juz: 30, hizb: 59 },
  { id: 89, name: 'الفجر', nameEn: 'Al-Fajr', ayahs: 30, juz: 30, hizb: 59 },
  { id: 90, name: 'البلد', nameEn: 'Al-Balad', ayahs: 20, juz: 30, hizb: 59 },
  { id: 91, name: 'الشمس', nameEn: 'Ash-Shams', ayahs: 15, juz: 30, hizb: 59 },
  { id: 92, name: 'الليل', nameEn: 'Al-Layl', ayahs: 21, juz: 30, hizb: 59 },
  { id: 93, name: 'الضحى', nameEn: 'Ad-Duha', ayahs: 11, juz: 30, hizb: 59 },
  { id: 94, name: 'الشرح', nameEn: 'Ash-Sharh', ayahs: 8, juz: 30, hizb: 59 },
  { id: 95, name: 'التين', nameEn: 'At-Tin', ayahs: 8, juz: 30, hizb: 59 },
  { id: 96, name: 'العلق', nameEn: 'Al-Alaq', ayahs: 19, juz: 30, hizb: 59 },
  { id: 97, name: 'القدر', nameEn: 'Al-Qadr', ayahs: 5, juz: 30, hizb: 59 },
  { id: 98, name: 'البينة', nameEn: 'Al-Bayyinah', ayahs: 8, juz: 30, hizb: 60 },
  { id: 99, name: 'الزلزلة', nameEn: 'Az-Zalzalah', ayahs: 8, juz: 30, hizb: 60 },
  { id: 100, name: 'العاديات', nameEn: 'Al-Adiyat', ayahs: 11, juz: 30, hizb: 60 },
  { id: 101, name: 'القارعة', nameEn: 'Al-Qariah', ayahs: 11, juz: 30, hizb: 60 },
  { id: 102, name: 'التكاثر', nameEn: 'At-Takathur', ayahs: 8, juz: 30, hizb: 60 },
  { id: 103, name: 'العصر', nameEn: 'Al-Asr', ayahs: 3, juz: 30, hizb: 60 },
  { id: 104, name: 'الهمزة', nameEn: 'Al-Humazah', ayahs: 9, juz: 30, hizb: 60 },
  { id: 105, name: 'الفيل', nameEn: 'Al-Fil', ayahs: 5, juz: 30, hizb: 60 },
  { id: 106, name: 'قريش', nameEn: 'Quraysh', ayahs: 4, juz: 30, hizb: 60 },
  { id: 107, name: 'الماعون', nameEn: 'Al-Maun', ayahs: 7, juz: 30, hizb: 60 },
  { id: 108, name: 'الكوثر', nameEn: 'Al-Kawthar', ayahs: 3, juz: 30, hizb: 60 },
  { id: 109, name: 'الكافرون', nameEn: 'Al-Kafirun', ayahs: 6, juz: 30, hizb: 60 },
  { id: 110, name: 'النصر', nameEn: 'An-Nasr', ayahs: 3, juz: 30, hizb: 60 },
  { id: 111, name: 'المسد', nameEn: 'Al-Masad', ayahs: 5, juz: 30, hizb: 60 },
  { id: 112, name: 'الإخلاص', nameEn: 'Al-Ikhlas', ayahs: 4, juz: 30, hizb: 60 },
  { id: 113, name: 'الفلق', nameEn: 'Al-Falaq', ayahs: 5, juz: 30, hizb: 60 },
  { id: 114, name: 'الناس', nameEn: 'An-Nas', ayahs: 6, juz: 30, hizb: 60 },
];

// Generate blocks (5 ayat each)
export const getBlocks = (surahId: number) => {
  const s = SURAHS.find(x => x.id === surahId);
  if (!s) return [];
  const blocks = [];
  for (let i = 1; i <= s.ayahs; i += 5) {
    const end = Math.min(i + 4, s.ayahs);
    blocks.push({ id: `${surahId}_${i}_${end}`, surahId, start: i, end, count: end - i + 1 });
  }
  return blocks;
};

// Duolingo-style colors
const DUOLINGO_COLORS = {
  green: '#58CC02',
  greenDark: '#46A302',
  gold: '#FFC800',
  goldDark: '#E5B000',
  blue: '#1CB0F6',
  purple: '#CE82FF',
  red: '#FF4B4B',
  gray: '#AFAFAF',
  grayLight: '#E5E5E5',
  background: '#131F24',
  cardBg: '#1A2C34',
};

export default function LessonsScreen({ navigation }: any) {
  console.log(`${FILE_NAME} 🚀 Render`);
  
  const { hearts, maxHearts, streak } = useGamificationStore();
  const [mode, setMode] = useState<'path' | 'juz' | 'hizb'>('path');
  const [progress, setProgress] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ayahs: 0, surahs: 0, current: 1, juz: 0, hizb: 0 });
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => { loadProgress(); }, []));

  const loadProgress = async () => {
    console.log(`${FILE_NAME} 📥 loadProgress()`);
    try {
      console.log(`${FILE_NAME} 🌐 BACKEND API: progressAPI.getProgress()`);
      const res: any = await progressAPI.getProgress();
      console.log(`${FILE_NAME} ✅ Response received`);
      
      const map: any = {};
      let totalAyahs = 0, completedSurahs = 0, currentSurah = 1;
      
      // ✅ FIXED: Handle different response formats
      let progressData: any[] = [];
      if (res?.progress && Array.isArray(res.progress)) {
        progressData = res.progress;
      } else if (Array.isArray(res)) {
        progressData = res;
      } else if (res?.data?.progress && Array.isArray(res.data.progress)) {
        progressData = res.data.progress;
      } else if (res?.data && Array.isArray(res.data)) {
        progressData = res.data;
      } else {
        console.log(`${FILE_NAME} ⚠️ No progress data, using empty array`);
      }
      
      console.log(`${FILE_NAME} 📊 Progress entries: ${progressData.length}`);
      
      progressData.forEach((p: any) => {
        const sid = p.surahId || p.surah_id || p.surah;
        if (!sid) return;
        if (!map[sid]) map[sid] = { done: 0, blocks: [] };
        map[sid].done++;
        if (p.blockId && !map[sid].blocks.includes(p.blockId)) {
          map[sid].blocks.push(p.blockId);
        }
        totalAyahs++;
      });
      
      SURAHS.forEach(s => {
        if (map[s.id]?.done >= s.ayahs) completedSurahs++;
        else if (map[s.id]?.done > 0 && currentSurah === 1) currentSurah = s.id;
      });
      
      // Calculate juz/hizb progress
      const juzProgress = Math.floor((totalAyahs / 6236) * 30);
      const hizbProgress = Math.floor((totalAyahs / 6236) * 60);
      
      setProgress(map);
      setStats({ ayahs: totalAyahs, surahs: completedSurahs, current: currentSurah, juz: juzProgress, hizb: hizbProgress });
      console.log(`${FILE_NAME} ✅ Stats: ${totalAyahs} ayahs, ${completedSurahs} surahs, juz ${juzProgress}/30`);
      console.log(`${FILE_NAME} 📦 Progress map:`, JSON.stringify(map));
      
    } catch (e: any) {
      console.error(`${FILE_NAME} ❌ ERROR:`, e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const getStatus = (surah: any, index: number) => {
    const p = progress[surah.id];
    const blocks = getBlocks(surah.id);
    
    // Debug logs
    if (index <= 2) {
      console.log(`${FILE_NAME} 🔍 getStatus(${surah.name}, index=${index})`);
      console.log(`${FILE_NAME} 📊 Progress for surah ${surah.id}:`, JSON.stringify(p));
    }
    
    if (p) {
      const pct = (p.done / surah.ayahs) * 100;
      console.log(`${FILE_NAME} 📊 Surah ${surah.id}: ${p.done}/${surah.ayahs} = ${pct.toFixed(1)}%`);
      if (pct >= 100) return { status: 'done', pct: 100, block: blocks[0], crown: getCrown(pct) };
      const nextBlock = blocks.find((b: any) => !p.blocks?.includes(b.id)) || blocks[0];
      return { status: 'prog', pct, block: nextBlock, crown: 0 };
    }
    if (index === 0) return { status: 'open', pct: 0, block: blocks[0], crown: 0 };
    
    const prev = SURAHS[index - 1];
    const pp = progress[prev.id];
    
    // Debug unlock check
    if (index <= 2) {
      console.log(`${FILE_NAME} 🔐 Checking unlock for ${surah.name}:`);
      console.log(`${FILE_NAME} 🔐 Previous surah (${prev.name}): ${pp?.done || 0}/${prev.ayahs} = ${pp ? ((pp.done / prev.ayahs) * 100).toFixed(1) : 0}%`);
      console.log(`${FILE_NAME} 🔐 Need 50% to unlock, has ${pp ? ((pp.done / prev.ayahs) * 100).toFixed(1) : 0}%`);
    }
    
    if (pp && (pp.done / prev.ayahs) >= 0.5) {
      console.log(`${FILE_NAME} ✅ UNLOCKED: ${surah.name}`);
      return { status: 'open', pct: 0, block: blocks[0], crown: 0 };
    }
    
    return { status: 'lock', pct: 0, block: null, crown: 0 };
  };

  const getCrown = (pct: number) => {
    if (pct >= 100) return 1; // Gold crown
    return 0;
  };

  const onNodePress = (surah: any, status: string, block: any) => {
    console.log(`${FILE_NAME} 👆 ${surah.name} [${status}]`);
    if (status === 'lock') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('🔒 مقفلة', 'أكمل 50% من السورة السابقة لفتح هذه السورة');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('LessonDetail', { surah, block, blocks: getBlocks(surah.id) });
  };

  // Duolingo-style path node
  const renderPathNode = (surah: any, index: number) => {
    const { status, pct, block, crown } = getStatus(surah, index);
    
    // Zigzag pattern
    const isLeft = index % 4 === 0 || index % 4 === 3;
    const offset = isLeft ? -40 : 40;
    
    // Node colors based on status
    let bgColor = DUOLINGO_COLORS.gray;
    let borderColor = DUOLINGO_COLORS.grayLight;
    let iconColor = '#fff';
    
    if (status === 'done') {
      bgColor = DUOLINGO_COLORS.gold;
      borderColor = DUOLINGO_COLORS.goldDark;
    } else if (status === 'prog') {
      bgColor = DUOLINGO_COLORS.blue;
      borderColor = '#0D8ECF';
    } else if (status === 'open') {
      bgColor = DUOLINGO_COLORS.green;
      borderColor = DUOLINGO_COLORS.greenDark;
    }
    
    return (
      <View key={surah.id} style={[styles.pathNodeContainer, { marginLeft: offset }]}>
        {/* Connection line */}
        {index > 0 && (
          <View style={[styles.pathLine, { backgroundColor: status === 'lock' ? DUOLINGO_COLORS.grayLight : DUOLINGO_COLORS.green }]} />
        )}
        
        <TouchableOpacity
          style={[
            styles.pathNode,
            { backgroundColor: bgColor, borderColor, borderWidth: 4 },
            status === 'lock' && styles.pathNodeLocked,
          ]}
          onPress={() => onNodePress(surah, status, block)}
          disabled={status === 'lock'}
        >
          {status === 'lock' ? (
            <Ionicons name="lock-closed" size={28} color="#666" />
          ) : status === 'done' ? (
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
          ) : (
            <Text style={styles.nodeNumber}>{surah.id}</Text>
          )}
          
          {/* Progress ring for in-progress */}
          {status === 'prog' && (
            <View style={styles.progressRing}>
              <View style={[styles.progressRingFill, { width: `${pct}%` }]} />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Surah name label */}
        <View style={[styles.nodeLabel, status === 'lock' && styles.nodeLabelLocked]}>
          <Text style={[styles.nodeLabelText, status === 'lock' && { color: '#666' }]}>{surah.name}</Text>
          {status === 'prog' && (
            <Text style={styles.nodeLabelPct}>{Math.round(pct)}%</Text>
          )}
        </View>
      </View>
    );
  };

  const renderJuzCard = (juz: number) => {
    const ss = SURAHS.filter(s => s.juz === juz);
    const total = ss.reduce((a, s) => a + s.ayahs, 0);
    const done = ss.reduce((a, s) => a + (progress[s.id]?.done || 0), 0);
    const pct = total ? (done / total) * 100 : 0;
    const isComplete = pct >= 100;
    
    return (
      <TouchableOpacity 
        key={juz} 
        style={[styles.juzCard, isComplete && styles.juzCardComplete]}
        onPress={() => setMode('path')}
      >
        <LinearGradient 
          colors={isComplete ? [DUOLINGO_COLORS.gold, DUOLINGO_COLORS.goldDark] : ['#2A3F4A', '#1A2C34']}
          style={styles.juzCardGradient}
        >
          <Text style={styles.juzNumber}>الجزء {juz}</Text>
          <View style={styles.juzProgressBar}>
            <View style={[styles.juzProgressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.juzPct}>{Math.round(pct)}%</Text>
          {isComplete && <Text style={styles.juzCrown}>👑</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHizbCard = (hizb: number) => {
    const ss = SURAHS.filter(s => s.hizb === hizb);
    const total = ss.reduce((a, s) => a + s.ayahs, 0);
    const done = ss.reduce((a, s) => a + (progress[s.id]?.done || 0), 0);
    const pct = total ? (done / total) * 100 : 0;
    
    return (
      <TouchableOpacity 
        key={hizb} 
        style={[styles.hizbCard, pct >= 100 && styles.hizbCardComplete]}
        onPress={() => setMode('path')}
      >
        <Text style={styles.hizbNumber}>{hizb}</Text>
        <View style={styles.hizbProgressBar}>
          <View style={[styles.hizbProgressFill, { width: `${pct}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>📖</Text>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerIcon}>
            <Text style={styles.flagEmoji}>🇸🇦</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gemsBadge}>
            <Text style={styles.gemsEmoji}>💎</Text>
            <Text style={styles.gemsText}>{stats.ayahs * 10}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.heartsBadge}>
            <Text style={styles.heartsEmoji}>❤️</Text>
            <Text style={styles.heartsText}>{hearts}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.ayahs}</Text>
            <Text style={styles.statLabel}>آية</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.surahs}/114</Text>
            <Text style={styles.statLabel}>سورة</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.juz}/30</Text>
            <Text style={styles.statLabel}>جزء</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.hizb}/60</Text>
            <Text style={styles.statLabel}>حزب</Text>
          </View>
        </View>
      </View>

      {/* Mode tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'path', label: 'المسار', icon: '🛤️' },
          { key: 'juz', label: 'الأجزاء', icon: '📚' },
          { key: 'hizb', label: 'الأحزاب', icon: '📖' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, mode === tab.key && styles.tabActive]}
            onPress={() => setMode(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, mode === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {mode === 'path' && (
        <ScrollView
          ref={scrollRef}
          style={styles.pathContainer}
          contentContainerStyle={styles.pathContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); loadProgress(); }}
              tintColor={DUOLINGO_COLORS.green}
            />
          }
        >
          {SURAHS.map((surah, index) => renderPathNode(surah, index))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {mode === 'juz' && (
        <ScrollView style={styles.gridContainer} contentContainerStyle={styles.gridContent}>
          <View style={styles.grid}>
            {Array.from({ length: 30 }, (_, i) => renderJuzCard(i + 1))}
          </View>
        </ScrollView>
      )}

      {mode === 'hizb' && (
        <ScrollView style={styles.gridContainer} contentContainerStyle={styles.gridContent}>
          <View style={styles.hizbGrid}>
            {Array.from({ length: 60 }, (_, i) => renderHizbCard(i + 1))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DUOLINGO_COLORS.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: { fontSize: 60, marginBottom: 20 },
  loadingText: { color: '#fff', fontSize: 18 },
  
  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: DUOLINGO_COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagEmoji: { fontSize: 24 },
  
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DUOLINGO_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakEmoji: { fontSize: 18, marginRight: 5 },
  streakText: { color: '#FF9600', fontWeight: 'bold', fontSize: 16 },
  
  gemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DUOLINGO_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  gemsEmoji: { fontSize: 18, marginRight: 5 },
  gemsText: { color: DUOLINGO_COLORS.blue, fontWeight: 'bold', fontSize: 16 },
  
  heartsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DUOLINGO_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heartsEmoji: { fontSize: 18, marginRight: 5 },
  heartsText: { color: DUOLINGO_COLORS.red, fontWeight: 'bold', fontSize: 16 },
  
  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: DUOLINGO_COLORS.cardBg,
    borderRadius: 15,
    padding: 15,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#8A9BA8', fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2A3F4A' },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: DUOLINGO_COLORS.cardBg,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: DUOLINGO_COLORS.green,
  },
  tabIcon: { fontSize: 16, marginRight: 6 },
  tabText: { color: '#8A9BA8', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  
  // Path
  pathContainer: { flex: 1 },
  pathContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  
  pathNodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  pathLine: {
    position: 'absolute',
    top: -20,
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  
  pathNode: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  pathNodeLocked: {
    opacity: 0.6,
  },
  
  nodeNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  crownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: { fontSize: 30 },
  
  progressRing: {
    position: 'absolute',
    bottom: -5,
    width: 60,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressRingFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  
  nodeLabel: {
    marginTop: 8,
    alignItems: 'center',
  },
  nodeLabelLocked: { opacity: 0.5 },
  nodeLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nodeLabelPct: {
    color: DUOLINGO_COLORS.blue,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  
  // Grid
  gridContainer: { flex: 1 },
  gridContent: { padding: 15, paddingBottom: 100 },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  juzCard: {
    width: (width - 50) / 3,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  juzCardComplete: {},
  juzCardGradient: {
    padding: 15,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  juzNumber: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  juzProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  juzProgressFill: { height: '100%', backgroundColor: DUOLINGO_COLORS.green },
  juzPct: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 5 },
  juzCrown: { fontSize: 20, marginTop: 5 },
  
  hizbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hizbCard: {
    width: (width - 60) / 4,
    backgroundColor: DUOLINGO_COLORS.cardBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  hizbCardComplete: { backgroundColor: DUOLINGO_COLORS.gold },
  hizbNumber: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  hizbProgressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  hizbProgressFill: { height: '100%', backgroundColor: DUOLINGO_COLORS.green },
});
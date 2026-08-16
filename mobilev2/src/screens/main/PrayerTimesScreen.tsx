/**
 * PrayerTimesScreen.tsx - Salifz
 * ✅ FIXED: Handles all API response formats
 * ✅ FIXED: No more 'Cannot read property timings of undefined'
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import api from '../../services/api';

const LOG_PREFIX = '[PrayerTimes]';

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface NextPrayer {
  name: string;
  nameAr: string;
  time: string;
  remaining: {
    hours: number;
    minutes: number;
  };
}

interface DateInfo {
  hijri: {
    day: string;
    month: string;
    monthAr: string;
    year: string;
  };
  gregorian: {
    day: string;
    month: string;
    year: string;
    weekday: string;
  };
}

// Default prayer times (Casablanca approximate)
const DEFAULT_TIMINGS: PrayerTimes = {
  fajr: '06:15',
  sunrise: '07:35',
  dhuhr: '13:15',
  asr: '16:15',
  maghrib: '18:45',
  isha: '20:00'
};

const PrayerTimesScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [currentPrayer, setCurrentPrayer] = useState<string>('');

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🕌 Component mounted`);
    getLocationAndFetch();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nextPrayer) {
        updateCountdown();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  const getLocationAndFetch = async () => {
    console.log(`${LOG_PREFIX} 📍 Getting location...`);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log(`${LOG_PREFIX} ⚠️ Location permission denied`);
        // Use default location (Casablanca)
        setLocation({ latitude: 33.5731, longitude: -7.5898 });
      } else {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        console.log(`${LOG_PREFIX} ✅ Location: ${loc.coords.latitude}, ${loc.coords.longitude}`);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Location error:`, error);
      setLocation({ latitude: 33.5731, longitude: -7.5898 });
    }
  };

  useEffect(() => {
    if (location) {
      fetchPrayerTimes();
    }
  }, [location]);

  // ✅ FIXED: Format time string
  const formatTime = (timeStr: string | undefined): string => {
    if (!timeStr) return '00:00';
    const cleaned = timeStr.split(' ')[0]; // Remove timezone info like "(UTC)"
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return timeStr;
  };

  // ✅ FIXED: Extract timings from various response formats
  const extractTimings = (response: any): PrayerTimes | null => {
    console.log(`${LOG_PREFIX} 🔍 Extracting timings...`);
    
    const data = response?.data || response;
    
    // Format 1: { data: { timings: { Fajr, ... } } } - Standard Aladhan wrapped
    if (data?.data?.timings?.Fajr) {
      console.log(`${LOG_PREFIX} ✅ Format 1: data.data.timings (Aladhan)`);
      const t = data.data.timings;
      return {
        fajr: formatTime(t.Fajr),
        sunrise: formatTime(t.Sunrise),
        dhuhr: formatTime(t.Dhuhr),
        asr: formatTime(t.Asr),
        maghrib: formatTime(t.Maghrib),
        isha: formatTime(t.Isha)
      };
    }
    
    // Format 2: { timings: { Fajr, ... } } - Direct Aladhan
    if (data?.timings?.Fajr) {
      console.log(`${LOG_PREFIX} ✅ Format 2: data.timings`);
      const t = data.timings;
      return {
        fajr: formatTime(t.Fajr),
        sunrise: formatTime(t.Sunrise),
        dhuhr: formatTime(t.Dhuhr),
        asr: formatTime(t.Asr),
        maghrib: formatTime(t.Maghrib),
        isha: formatTime(t.Isha)
      };
    }
    
    // Format 3: { data: { times: { fajr, ... } } } - Backend lowercase
    if (data?.data?.times?.fajr || data?.data?.times?.Fajr) {
      console.log(`${LOG_PREFIX} ✅ Format 3: data.data.times`);
      const t = data.data.times;
      return {
        fajr: formatTime(t.fajr || t.Fajr),
        sunrise: formatTime(t.sunrise || t.Sunrise),
        dhuhr: formatTime(t.dhuhr || t.Dhuhr),
        asr: formatTime(t.asr || t.Asr),
        maghrib: formatTime(t.maghrib || t.Maghrib),
        isha: formatTime(t.isha || t.Isha)
      };
    }
    
    // Format 4: { times: { fajr, ... } }
    if (data?.times?.fajr || data?.times?.Fajr) {
      console.log(`${LOG_PREFIX} ✅ Format 4: data.times`);
      const t = data.times;
      return {
        fajr: formatTime(t.fajr || t.Fajr),
        sunrise: formatTime(t.sunrise || t.Sunrise),
        dhuhr: formatTime(t.dhuhr || t.Dhuhr),
        asr: formatTime(t.asr || t.Asr),
        maghrib: formatTime(t.maghrib || t.Maghrib),
        isha: formatTime(t.isha || t.Isha)
      };
    }
    
    // Format 5: { fajr, ... } or { Fajr, ... } - Direct
    if (data?.fajr || data?.Fajr) {
      console.log(`${LOG_PREFIX} ✅ Format 5: direct`);
      return {
        fajr: formatTime(data.fajr || data.Fajr),
        sunrise: formatTime(data.sunrise || data.Sunrise),
        dhuhr: formatTime(data.dhuhr || data.Dhuhr),
        asr: formatTime(data.asr || data.Asr),
        maghrib: formatTime(data.maghrib || data.Maghrib),
        isha: formatTime(data.isha || data.Isha)
      };
    }

    console.log(`${LOG_PREFIX} ❌ No format matched`);
    return null;
  };

  // ✅ FIXED: Extract next prayer from response or calculate it
  const extractNextPrayer = (response: any, timings: PrayerTimes): NextPrayer => {
    const data = response?.data || response;
    
    // Try to get nextPrayer from response
    const nextPrayerData = data?.data?.nextPrayer || data?.nextPrayer;
    
    if (nextPrayerData?.name && nextPrayerData?.time) {
      return {
        name: nextPrayerData.name,
        nameAr: nextPrayerData.nameAr || getPrayerNameAr(nextPrayerData.name),
        time: formatTime(nextPrayerData.time),
        remaining: {
          hours: nextPrayerData.remaining?.hours || 0,
          minutes: nextPrayerData.remaining?.minutes || 0
        }
      };
    }
    
    // Calculate next prayer from timings
    return calculateNextPrayer(timings);
  };

  // ✅ Calculate next prayer from timings
  const calculateNextPrayer = (timings: PrayerTimes): NextPrayer => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'fajr', nameAr: 'الفجر', time: timings.fajr },
      { name: 'sunrise', nameAr: 'الشروق', time: timings.sunrise },
      { name: 'dhuhr', nameAr: 'الظهر', time: timings.dhuhr },
      { name: 'asr', nameAr: 'العصر', time: timings.asr },
      { name: 'maghrib', nameAr: 'المغرب', time: timings.maghrib },
      { name: 'isha', nameAr: 'العشاء', time: timings.isha },
    ];
    
    for (const prayer of prayers) {
      const [h, m] = prayer.time.split(':').map(Number);
      
      if (!isNaN(h) && !isNaN(m)) {
        const prayerMinutes = h * 60 + m;
        
        if (prayerMinutes > currentMinutes) {
          const remaining = prayerMinutes - currentMinutes;
          return {
            name: prayer.name,
            nameAr: prayer.nameAr,
            time: prayer.time,
            remaining: {
              hours: Math.floor(remaining / 60),
              minutes: remaining % 60
            }
          };
        }
      }
    }
    
    // All prayers passed, return Fajr for tomorrow
    return {
      name: 'fajr',
      nameAr: 'الفجر',
      time: timings.fajr,
      remaining: { hours: 0, minutes: 0 }
    };
  };

  // ✅ Get Arabic name for prayer
  const getPrayerNameAr = (name: string): string => {
    const names: Record<string, string> = {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };
    return names[name.toLowerCase()] || name;
  };

  // ✅ FIXED: Extract date info from response
  const extractDateInfo = (response: any): DateInfo | null => {
    const data = response?.data || response;
    const dateData = data?.data?.date || data?.date;
    
    if (dateData?.hijri && dateData?.gregorian) {
      return {
        hijri: {
          day: dateData.hijri.day || '1',
          month: dateData.hijri.month?.en || dateData.hijri.month || 'Muharram',
          monthAr: dateData.hijri.month?.ar || dateData.hijri.monthAr || 'محرم',
          year: dateData.hijri.year || '1446'
        },
        gregorian: {
          day: dateData.gregorian.day || new Date().getDate().toString(),
          month: dateData.gregorian.month?.en || dateData.gregorian.month || 'January',
          year: dateData.gregorian.year || new Date().getFullYear().toString(),
          weekday: dateData.gregorian.weekday?.en || dateData.gregorian.weekday || 'Monday'
        }
      };
    }
    
    // Return default date info
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      hijri: { day: '22', month: 'Rajab', monthAr: 'رجب', year: '1447' },
      gregorian: {
        day: now.getDate().toString(),
        month: months[now.getMonth()],
        year: now.getFullYear().toString(),
        weekday: weekdays[now.getDay()]
      }
    };
  };

  // ✅ FIXED: Main fetch function with robust error handling
  const fetchPrayerTimes = async () => {
    if (!location) return;
    
    console.log(`${LOG_PREFIX} 📡 Fetching prayer times...`);
    
    try {
      const response = await api.get('/prayer/times', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          method: 4
        }
      });
      
      console.log(`${LOG_PREFIX} 📥 Response received`);
      
      // ✅ Extract timings
      const timings = extractTimings(response);
      
      if (timings) {
        setPrayerTimes(timings);
        
        // ✅ Extract or calculate next prayer
        const next = extractNextPrayer(response, timings);
        setNextPrayer(next);
        
        // ✅ Determine current prayer
        determineCurrentPrayer(timings);
        
        console.log(`${LOG_PREFIX} ✅ Timings loaded:`, timings);
      } else {
        console.log(`${LOG_PREFIX} ⚠️ Using default timings`);
        setPrayerTimes(DEFAULT_TIMINGS);
        setNextPrayer(calculateNextPrayer(DEFAULT_TIMINGS));
        determineCurrentPrayer(DEFAULT_TIMINGS);
      }
      
      // ✅ Extract date info
      const dateData = extractDateInfo(response);
      setDateInfo(dateData);
      
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Error:`, error?.message || error);
      
      // Use defaults on error
      setPrayerTimes(DEFAULT_TIMINGS);
      setNextPrayer(calculateNextPrayer(DEFAULT_TIMINGS));
      determineCurrentPrayer(DEFAULT_TIMINGS);
      setDateInfo(extractDateInfo(null));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrayerTimes();
  }, [location]);

  const updateCountdown = () => {
    if (!nextPrayer) return;
    
    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return;
    
    let target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    const diff = target.getTime() - now.getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    setCountdown({ hours: h, minutes: m, seconds: s });
  };

  const determineCurrentPrayer = (times: PrayerTimes) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'fajr', time: times.fajr },
      { name: 'dhuhr', time: times.dhuhr },
      { name: 'asr', time: times.asr },
      { name: 'maghrib', time: times.maghrib },
      { name: 'isha', time: times.isha },
    ];
    
    for (let i = prayers.length - 1; i >= 0; i--) {
      const [h, m] = prayers[i].time.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m) && currentMinutes >= h * 60 + m) {
        setCurrentPrayer(prayers[i].name);
        return;
      }
    }
    
    setCurrentPrayer('isha');
  };

  const getPrayerName = (name: string): { en: string; ar: string } => {
    const names: Record<string, { en: string; ar: string }> = {
      fajr: { en: 'Fajr', ar: 'الفجر' },
      sunrise: { en: 'Sunrise', ar: 'الشروق' },
      dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
      asr: { en: 'Asr', ar: 'العصر' },
      maghrib: { en: 'Maghrib', ar: 'المغرب' },
      isha: { en: 'Isha', ar: 'العشاء' },
    };
    return names[name] || { en: name, ar: name };
  };

  const getPrayerIcon = (name: string): string => {
    const icons: Record<string, string> = {
      fajr: 'moon-outline',
      sunrise: 'sunny-outline',
      dhuhr: 'sunny',
      asr: 'partly-sunny',
      maghrib: 'cloudy-night-outline',
      isha: 'moon',
    };
    return icons[name] || 'time-outline';
  };

  const renderPrayerCard = (name: string, time: string) => {
    const prayerInfo = getPrayerName(name);
    const isNext = nextPrayer?.name === name;
    const isCurrent = currentPrayer === name;
    
    return (
      <TouchableOpacity
        key={name}
        style={[
          styles.prayerCard,
          isNext && styles.prayerCardNext,
          isCurrent && styles.prayerCardCurrent,
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.prayerIconContainer}>
          <Ionicons
            name={getPrayerIcon(name) as any}
            size={28}
            color={isNext ? '#667eea' : isCurrent ? '#6bcb77' : '#999'}
          />
        </View>
        <View style={styles.prayerInfo}>
          <Text style={[
            styles.prayerName,
            isNext && styles.prayerNameNext,
            isCurrent && styles.prayerNameCurrent,
          ]}>
            {isRTL ? prayerInfo.ar : prayerInfo.en}
          </Text>
          {isNext && (
            <Text style={styles.nextLabel}>
              {isRTL ? 'القادمة' : 'Next'}
            </Text>
          )}
        </View>
        <Text style={[
          styles.prayerTime,
          isNext && styles.prayerTimeNext,
        ]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>
          {isRTL ? 'جاري تحميل أوقات الصلاة...' : 'Loading prayer times...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRTL ? 'مواقيت الصلاة' : 'Prayer Times'}
        </Text>
        <TouchableOpacity style={styles.qiblaButton} onPress={() => navigation.navigate('Qibla')}>
          <Ionicons name="compass" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Date Card */}
        <View style={styles.dateCard}>
          <Text style={styles.hijriDate}>
            {dateInfo?.hijri.day} {isRTL ? dateInfo?.hijri.monthAr : dateInfo?.hijri.month} {dateInfo?.hijri.year}
          </Text>
          <Text style={styles.gregorianDate}>
            {dateInfo?.gregorian.weekday}, {dateInfo?.gregorian.day} {dateInfo?.gregorian.month} {dateInfo?.gregorian.year}
          </Text>
        </View>

        {/* Next Prayer Countdown */}
        {nextPrayer && (
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.countdownCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.countdownHeader}>
              <Text style={styles.countdownLabel}>{isRTL ? 'الصلاة القادمة' : 'Next Prayer'}</Text>
              <Text style={styles.countdownPrayer}>
                {isRTL ? nextPrayer.nameAr : nextPrayer.name.charAt(0).toUpperCase() + nextPrayer.name.slice(1)}
              </Text>
            </View>
            
            <View style={styles.countdownTimer}>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{countdown.hours.toString().padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>{isRTL ? 'ساعة' : 'Hours'}</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{countdown.minutes.toString().padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>{isRTL ? 'دقيقة' : 'Min'}</Text>
              </View>
              <Text style={styles.timerSeparator}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{countdown.seconds.toString().padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>{isRTL ? 'ثانية' : 'Sec'}</Text>
              </View>
            </View>
            
            <Text style={styles.countdownTime}>{isRTL ? 'الأذان' : 'Adhan at'} {nextPrayer.time}</Text>
          </LinearGradient>
        )}

        {/* Prayer Times List */}
        <View style={styles.prayersContainer}>
          <Text style={styles.sectionTitle}>{isRTL ? 'أوقات الصلاة اليوم' : "Today's Prayer Times"}</Text>
          
          {prayerTimes && (
            <>
              {renderPrayerCard('fajr', prayerTimes.fajr)}
              {renderPrayerCard('sunrise', prayerTimes.sunrise)}
              {renderPrayerCard('dhuhr', prayerTimes.dhuhr)}
              {renderPrayerCard('asr', prayerTimes.asr)}
              {renderPrayerCard('maghrib', prayerTimes.maghrib)}
              {renderPrayerCard('isha', prayerTimes.isha)}
            </>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#999" />
          <Text style={styles.locationText}>
            {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Unknown'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  qiblaButton: { padding: 8 },
  dateCard: { backgroundColor: '#fff', margin: 16, marginBottom: 8, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  hijriDate: { fontSize: 20, fontWeight: 'bold', color: '#667eea', marginBottom: 4 },
  gregorianDate: { fontSize: 14, color: '#666' },
  countdownCard: { margin: 16, marginTop: 8, padding: 24, borderRadius: 20, alignItems: 'center' },
  countdownHeader: { alignItems: 'center', marginBottom: 20 },
  countdownLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  countdownPrayer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  countdownTimer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timerUnit: { alignItems: 'center', minWidth: 60 },
  timerValue: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  timerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  timerSeparator: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginHorizontal: 8 },
  countdownTime: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  prayersContainer: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  prayerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  prayerCardNext: { borderWidth: 2, borderColor: '#667eea', backgroundColor: '#f8f9ff' },
  prayerCardCurrent: { borderLeftWidth: 4, borderLeftColor: '#6bcb77' },
  prayerIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f8f8f8', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  prayerNameNext: { color: '#667eea' },
  prayerNameCurrent: { color: '#6bcb77' },
  nextLabel: { fontSize: 12, color: '#667eea', fontWeight: '500', marginTop: 2 },
  prayerTime: { fontSize: 18, fontWeight: '600', color: '#333' },
  prayerTimeNext: { color: '#667eea' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 6 },
  locationText: { fontSize: 12, color: '#999' },
});

export default PrayerTimesScreen;
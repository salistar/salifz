/**
 * QiblaScreen.tsx - Salifz
 * ✅ FIXED: Handles all API response formats
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import api from '../../services/api';
import { TouchableOpacity } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;
const LOG_PREFIX = '[Qibla]';

const QiblaScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [compassDirection, setCompassDirection] = useState<number>(0);
  const [compassInfo, setCompassInfo] = useState<{ name: string; nameAr: string } | null>(null);
  const [distanceToMecca, setDistanceToMecca] = useState<number>(0);
  const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);
  
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const needleAnimation = useRef(new Animated.Value(0)).current;
  const magnetometerSubscription = useRef<any>(null);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🧭 Component mounted`);
    initializeQibla();
    
    return () => {
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
    };
  }, []);

  // ✅ FIXED: Extract direction from various response formats
  const extractDirection = (response: any, lat: number, lng: number): number => {
    const data = response?.data || response;
    
    // Format 1: { direction: 91.5 }
    if (typeof data?.direction === 'number') return data.direction;
    
    // Format 2: { data: { direction: 91.5 } }
    if (typeof data?.data?.direction === 'number') return data.data.direction;
    
    // Format 3: Direct number
    if (typeof data === 'number') return data;
    
    // Format 4: { qibla: 91.5 }
    if (typeof data?.qibla === 'number') return data.qibla;
    
    // Format 5: { data: { qibla: 91.5 } }
    if (typeof data?.data?.qibla === 'number') return data.data.qibla;

    // Fallback: Calculate manually
    console.log(`${LOG_PREFIX} ⚠️ Calculating direction manually`);
    return calculateQiblaDirection(lat, lng);
  };

  // ✅ Extract compass info from response
  const extractCompassInfo = (response: any): { name: string; nameAr: string } => {
    const data = response?.data || response;
    
    if (data?.compassDirection) return data.compassDirection;
    if (data?.data?.compassDirection) return data.data.compassDirection;
    
    // Default
    return { name: 'E', nameAr: 'شرق' };
  };

  // ✅ Extract distance from response
  const extractDistance = (response: any, lat: number, lng: number): number => {
    const data = response?.data || response;
    
    if (typeof data?.distanceToMecca === 'number') return data.distanceToMecca;
    if (typeof data?.data?.distanceToMecca === 'number') return data.data.distanceToMecca;
    if (typeof data?.distance === 'number') return data.distance;
    
    // Calculate manually
    return calculateDistance(lat, lng, 21.4225, 39.8262);
  };

  // Calculate Qibla direction
  const calculateQiblaDirection = (lat: number, lng: number): number => {
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const kaabaLatRad = (kaabaLat * Math.PI) / 180;
    const kaabaLngRad = (kaabaLng * Math.PI) / 180;
    
    const dLng = kaabaLngRad - lngRad;
    
    const x = Math.sin(dLng);
    const y = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
    
    let qibla = Math.atan2(x, y) * (180 / Math.PI);
    if (qibla < 0) qibla += 360;
    
    return Math.round(qibla * 100) / 100;
  };

  // Calculate distance to Mecca
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const initializeQibla = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocation({ latitude: 21.4225, longitude: 39.8262 });
        setLoading(false);
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      
      setLocation(coords);
      console.log(`${LOG_PREFIX} 📍 Location:`, coords);
      
      // Fetch Qibla direction from API
      try {
        const response = await api.get('/prayer/qibla', {
          params: { latitude: coords.latitude, longitude: coords.longitude }
        });
        
        console.log(`${LOG_PREFIX} 📥 Response:`, JSON.stringify(response).slice(0, 200));
        
        // ✅ Extract using helpers
        const direction = extractDirection(response, coords.latitude, coords.longitude);
        const compassData = extractCompassInfo(response);
        const distance = extractDistance(response, coords.latitude, coords.longitude);
        
        setQiblaDirection(direction);
        setCompassInfo(compassData);
        setDistanceToMecca(distance);
        
        console.log(`${LOG_PREFIX} 🕋 Direction: ${direction}°`);
        
      } catch (apiError) {
        console.error(`${LOG_PREFIX} ❌ API error, using calculated values`);
        // Use calculated values
        const direction = calculateQiblaDirection(coords.latitude, coords.longitude);
        setQiblaDirection(direction);
        setCompassInfo({ name: 'E', nameAr: 'شرق' });
        setDistanceToMecca(calculateDistance(coords.latitude, coords.longitude, 21.4225, 39.8262));
      }
      
      // Initialize magnetometer
      initializeMagnetometer();
      
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error:`, error);
      // Use defaults
      setQiblaDirection(91);
      setDistanceToMecca(5000);
    } finally {
      setLoading(false);
    }
  };

  const initializeMagnetometer = async () => {
    try {
      const available = await Magnetometer.isAvailableAsync();
      
      if (!available) {
        console.log(`${LOG_PREFIX} ⚠️ Magnetometer not available`);
        setMagnetometerAvailable(false);
        return;
      }
      
      Magnetometer.setUpdateInterval(100);
      
      magnetometerSubscription.current = Magnetometer.addListener((data) => {
        let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        angle = (angle + 360) % 360;
        
        setCompassDirection(angle);
        
        Animated.timing(rotateAnimation, {
          toValue: -angle,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start();
        
        const qiblaAngle = (qiblaDirection - angle + 360) % 360;
        Animated.timing(needleAnimation, {
          toValue: qiblaAngle,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start();
      });
      
      console.log(`${LOG_PREFIX} 🧭 Magnetometer initialized`);
      
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Magnetometer error:`, error);
      setMagnetometerAvailable(false);
    }
  };

  const compassRotation = rotateAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const needleRotation = needleAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const qiblaAngle = (qiblaDirection - compassDirection + 360) % 360;
  const isFacingQibla = qiblaAngle < 10 || qiblaAngle > 350;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>
          {isRTL ? 'جاري تحديد اتجاه القبلة...' : 'Finding Qibla direction...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt, colors.canvasDeepAlt]} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.onDeep} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isRTL ? 'اتجاه القبلة' : 'Qibla Direction'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Kaaba Icon */}
        <View style={styles.kaabaContainer}>
          <Text style={styles.kaabaEmoji}>🕋</Text>
          <Text style={styles.meccaText}>{isRTL ? 'مكة المكرمة' : 'Mecca'}</Text>
        </View>

        {/* Compass */}
        <View style={styles.compassContainer}>
          <Animated.View style={[styles.compassOuter, { transform: [{ rotate: compassRotation }] }]}>
            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, index) => {
              const rotation = index * 45;
              const isMain = ['N', 'E', 'S', 'W'].includes(dir);
              
              return (
                <View key={dir} style={[styles.directionMarker, { transform: [{ rotate: `${rotation}deg` }] }]}>
                  <Text style={[styles.directionText, isMain && styles.directionTextMain, dir === 'N' && styles.directionTextNorth]}>
                    {dir === 'N' ? (isRTL ? 'ش' : 'N') :
                     dir === 'E' ? (isRTL ? 'ق' : 'E') :
                     dir === 'S' ? (isRTL ? 'ج' : 'S') :
                     dir === 'W' ? (isRTL ? 'غ' : 'W') : ''}
                  </Text>
                </View>
              );
            })}
            
            {[...Array(72)].map((_, i) => (
              <View key={i} style={[styles.degreeMark, { transform: [{ rotate: `${i * 5}deg` }] }, i % 6 === 0 && styles.degreeMarkMajor]} />
            ))}
          </Animated.View>

          {/* Qibla Needle */}
          <Animated.View style={[styles.needleContainer, { transform: [{ rotate: needleRotation }] }]}>
            <LinearGradient colors={isFacingQibla ? [colors.primaryLight, '#4ade80'] : [fixedColors.gold, '#f59e0b']} style={styles.needle}>
              <View style={styles.needleArrow} />
            </LinearGradient>
            <View style={styles.kaabaIcon}>
              <Text style={{ fontSize: 24 }}>🕋</Text>
            </View>
          </Animated.View>

          {/* Center circle */}
          <View style={styles.centerCircle}>
            <Text style={[styles.degreeText, isFacingQibla && styles.degreeTextGreen]}>{Math.round(qiblaAngle)}°</Text>
          </View>
        </View>

        {/* Status */}
        {isFacingQibla && (
          <View style={styles.facingQibla}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primaryLight} />
            <Text style={styles.facingText}>{isRTL ? 'أنت تواجه القبلة!' : "You're facing Qibla!"}</Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{isRTL ? 'اتجاه القبلة' : 'Qibla Direction'}</Text>
              <Text style={styles.infoValue}>{Math.round(qiblaDirection)}° {compassInfo?.name}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{isRTL ? 'المسافة إلى مكة' : 'Distance to Mecca'}</Text>
              <Text style={styles.infoValue}>{distanceToMecca.toLocaleString()} km</Text>
            </View>
          </View>
        </View>

        {/* Calibration notice */}
        {!magnetometerAvailable && (
          <View style={styles.notice}>
            <Ionicons name="warning" size={20} color={fixedColors.gold} />
            <Text style={styles.noticeText}>
              {isRTL ? 'البوصلة غير متاحة. الاتجاه تقريبي.' : 'Compass not available. Direction is approximate.'}
            </Text>
          </View>
        )}

        {/* Location info */}
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.locationText}>
            {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Unknown'}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.canvasDeep },
  loadingText: { marginTop: 16, fontSize: 16, color: c.onDeep },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: c.onDeep },
  kaabaContainer: { alignItems: 'center', marginTop: 10 },
  kaabaEmoji: { fontSize: 40 },
  meccaText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  compassContainer: { width: COMPASS_SIZE, height: COMPASS_SIZE, alignSelf: 'center', marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  compassOuter: { width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  directionMarker: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center' },
  directionText: { position: 'absolute', top: 15, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  directionTextMain: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
  directionTextNorth: { color: '#ff6b6b' },
  degreeMark: { position: 'absolute', top: 0, width: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  degreeMarkMajor: { height: 14, backgroundColor: 'rgba(255,255,255,0.4)' },
  needleContainer: { position: 'absolute', width: COMPASS_SIZE, height: COMPASS_SIZE, alignItems: 'center' },
  needle: { position: 'absolute', top: 20, width: 8, height: COMPASS_SIZE / 2 - 60, borderRadius: 4, alignItems: 'center' },
  needleArrow: { position: 'absolute', top: -10, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: fixedColors.gold },
  kaabaIcon: { position: 'absolute', top: 35 },
  centerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  degreeText: { fontSize: 24, fontWeight: 'bold', color: c.onDeep },
  degreeTextGreen: { color: c.primaryLight },
  facingQibla: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  facingText: { fontSize: 18, fontWeight: '600', color: c.primaryLight },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 24, marginTop: 30, borderRadius: 16, padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: c.onDeep },
  infoDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingHorizontal: 24, gap: 8 },
  noticeText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});

export default QiblaScreen;
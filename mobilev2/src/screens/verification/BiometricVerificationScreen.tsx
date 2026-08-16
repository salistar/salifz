/**
 * ============================================
 * 📱 BiometricVerificationScreen.tsx - Salifz
 * ============================================
 * Face ID / Touch ID / Fingerprint
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const LOG_PREFIX = '[BiometricVerificationScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export default function BiometricVerificationScreen({ route, navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { mode = 'verify', onSuccess, fallbackToPIN = true } = route.params || {};
  
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { 
    console.log(`${LOG_PREFIX} ⚡ useEffect - checkBiometricSupport`);
    checkBiometricSupport(); 
    startPulseAnimation(); 
  }, []);
  
  useEffect(() => { 
    if (isSupported && mode === 'unlock') {
      console.log(`${LOG_PREFIX} 🔓 Auto-authenticate for unlock mode`);
      setTimeout(authenticate, 500); 
    }
  }, [isSupported]);

  const checkBiometricSupport = async () => {
    console.log(`${LOG_PREFIX} 🔍 checkBiometricSupport()`);
    
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsSupported(compatible && enrolled);
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('facial');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
      }
      
      console.log(`${LOG_PREFIX} ✅ Biometric type: ${biometricType}, supported: ${compatible && enrolled}`);
      
      if (!compatible) {
        // ✅ AVANT: Alert.alert('غير مدعوم', 'جهازك لا يدعم المصادقة البيومترية', [...])
        Alert.alert(
          t('biometric.errors.notSupported'), 
          t('biometric.errors.deviceNotSupported'), 
          [{ text: t('common.ok'), onPress: () => handleFallback() }]
        );
      } else if (!enrolled) {
        // ✅ AVANT: Alert.alert('غير مُعد', 'لم يتم إعداد المصادقة البيومترية على جهازك.', [...])
        Alert.alert(
          t('biometric.errors.notSetup'), 
          t('biometric.errors.notEnrolled'), 
          [{ text: t('common.ok'), onPress: () => handleFallback() }]
        );
      }
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ Biometric check error:`, error); 
    }
  };

  const authenticate = async () => {
    if (isLocked || isAuthenticating) return;
    
    console.log(`${LOG_PREFIX} 🔐 authenticate()`);
    setIsAuthenticating(true);
    startScanAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: getBiometricPrompt(),
        // ✅ AVANT: 'إلغاء'
        cancelLabel: t('common.cancel'),
        // ✅ AVANT: 'استخدام رمز PIN'
        fallbackLabel: t('biometric.usePIN'),
        disableDeviceFallback: !fallbackToPIN,
      });
      
      if (result.success) {
        console.log(`${LOG_PREFIX} ✅ Authentication successful`);
        await handleSuccess();
      } else {
        console.log(`${LOG_PREFIX} ❌ Authentication failed: ${result.error}`);
        await handleFailure(result.error);
      }
    } catch (error: any) { 
      console.error(`${LOG_PREFIX} ❌ Authentication error:`, error);
      handleFailure(error.message); 
    } finally { 
      setIsAuthenticating(false); 
    }
  };

  // ✅ Helper pour le prompt biométrique avec i18n
  const getBiometricPrompt = () => {
    switch (biometricType) {
      // ✅ AVANT: 'استخدم Face ID للمتابعة'
      case 'facial': return t('biometric.prompts.facial');
      // ✅ AVANT: 'استخدم بصمة الإصبع للمتابعة'
      case 'fingerprint': return t('biometric.prompts.fingerprint');
      // ✅ AVANT: 'تحقق من هويتك للمتابعة'
      default: return t('biometric.prompts.default');
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'facial': return '👤';
      case 'fingerprint': return '👆';
      default: return '🔐';
    }
  };

  // ✅ Helper pour le nom biométrique avec i18n
  const getBiometricName = () => {
    switch (biometricType) {
      case 'facial': 
        // ✅ AVANT: Platform.OS === 'ios' ? 'Face ID' : 'التعرف على الوجه'
        return Platform.OS === 'ios' ? 'Face ID' : t('biometric.names.facial');
      case 'fingerprint': 
        // ✅ AVANT: Platform.OS === 'ios' ? 'Touch ID' : 'بصمة الإصبع'
        return Platform.OS === 'ios' ? 'Touch ID' : t('biometric.names.fingerprint');
      // ✅ AVANT: 'المصادقة البيومترية'
      default: return t('biometric.names.default');
    }
  };

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }), 
      { iterations: 2 }
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSuccess = async () => {
    console.log(`${LOG_PREFIX} ✅ handleSuccess()`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (mode === 'setup') {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      // ✅ AVANT: Alert.alert('✅ تم الإعداد', 'تم تفعيل المصادقة البيومترية بنجاح!', [...])
      Alert.alert(
        t('biometric.setup.success'), 
        t('biometric.setup.successMessage'), 
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } else {
      if (onSuccess) onSuccess();
      else navigation.replace('Main');
    }
  };

  const handleFailure = (error?: string) => {
    console.log(`${LOG_PREFIX} ❌ handleFailure() - error: ${error}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerShake();
    
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      setIsLocked(true);
      // ✅ AVANT: Alert.alert('🔒 تم القفل', 'تم تجاوز عدد المحاولات المسموحة.', [...])
      Alert.alert(
        t('biometric.locked.title'), 
        t('biometric.locked.message'), 
        [{ text: t('common.ok'), onPress: () => handleFallback() }]
      );
    } else if (error !== 'user_cancel') {
      // ✅ AVANT: Alert.alert('فشلت المصادقة', `المحاولة ${newAttempts} من 3`, [...])
      Alert.alert(
        t('biometric.failed.title'), 
        t('biometric.failed.attempt', { current: newAttempts, max: 3 }), 
        [{ text: t('biometric.failed.retry'), onPress: authenticate }]
      );
    }
  };

  const handleFallback = () => {
    console.log(`${LOG_PREFIX} 🔄 handleFallback()`);
    if (fallbackToPIN) {
      navigation.navigate('PINVerification', { mode, onSuccess });
    } else {
      navigation.goBack();
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
          <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.iconGradient}>
            <Text style={styles.icon}>{getBiometricIcon()}</Text>
            {isAuthenticating && (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] }) }] }]} />
            )}
          </LinearGradient>
        </Animated.View>
        
        <Text style={styles.title}>{getBiometricName()}</Text>
        {/* ✅ AVANT: mode === 'setup' ? 'اضغط للتفعيل والإعداد' : 'اضغط للتحقق من هويتك' */}
        <Text style={styles.subtitle}>
          {mode === 'setup' ? t('biometric.subtitle.setup') : t('biometric.subtitle.verify')}
        </Text>
        
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedIcon}>🔒</Text>
            {/* ✅ AVANT: 'تم القفل - استخدم رمز PIN' */}
            <Text style={styles.lockedText}>{t('biometric.locked.usePIN')}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.authButton, isLocked && styles.authButtonDisabled]} 
          onPress={authenticate} 
          disabled={isLocked || isAuthenticating}
        >
          <LinearGradient 
            colors={isLocked ? ['#666', '#444'] : [COLORS.primary, '#2E7D32']} 
            style={styles.authButtonGradient}
          >
            <Text style={styles.authButtonIcon}>{getBiometricIcon()}</Text>
            {/* ✅ AVANT: isAuthenticating ? 'جاري التحقق...' : 'ابدأ المصادقة' */}
            <Text style={styles.authButtonText}>
              {isAuthenticating ? t('biometric.authenticating') : t('biometric.startAuth')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {fallbackToPIN && (
          <TouchableOpacity style={styles.fallbackButton} onPress={handleFallback}>
            {/* ✅ AVANT: 'استخدام رمز PIN بدلاً من ذلك' */}
            <Text style={styles.fallbackText}>{t('biometric.usePINInstead')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgDecor1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(76, 175, 80, 0.05)', top: -100, right: -100 },
  bgDecor2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(76, 175, 80, 0.05)', bottom: -50, left: -50 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  backIcon: { color: '#fff', fontSize: 28 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconContainer: { marginBottom: 30 },
  iconGradient: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  icon: { fontSize: 70 },
  scanLine: { position: 'absolute', width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.8)' },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244, 67, 54, 0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20 },
  lockedIcon: { fontSize: 18, marginRight: 8 },
  lockedText: { color: '#F44336', fontSize: 14 },
  authButton: { width: '100%', borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  authButtonDisabled: { opacity: 0.5 },
  authButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  authButtonIcon: { fontSize: 24, marginRight: 10 },
  authButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  fallbackButton: { padding: 15 },
  fallbackText: { color: COLORS.primary, fontSize: 14 },
});
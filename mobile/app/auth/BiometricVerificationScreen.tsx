/**
 * Biometric Verification Screen - Salifz
 * Face ID / Touch ID / Fingerprint
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config';

type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export default function BiometricVerificationScreen({ route, navigation }: any) {
  const { mode = 'verify', onSuccess, fallbackToPIN = true } = route.params || {};
  
  const [isSupported, setIsSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { checkBiometricSupport(); startPulseAnimation(); }, []);
  useEffect(() => { if (isSupported && mode === 'unlock') setTimeout(authenticate, 500); }, [isSupported]);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setIsSupported(compatible && enrolled);
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) setBiometricType('facial');
      else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) setBiometricType('fingerprint');
      else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) setBiometricType('iris');
      if (!compatible) Alert.alert('غير مدعوم', 'جهازك لا يدعم المصادقة البيومترية', [{ text: 'حسناً', onPress: () => handleFallback() }]);
      else if (!enrolled) Alert.alert('غير مُعد', 'لم يتم إعداد المصادقة البيومترية على جهازك.', [{ text: 'حسناً', onPress: () => handleFallback() }]);
    } catch (error) { console.error('Biometric check error:', error); }
  };

  const authenticate = async () => {
    if (isLocked || isAuthenticating) return;
    setIsAuthenticating(true);
    startScanAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: getBiometricPrompt(),
        cancelLabel: 'إلغاء',
        fallbackLabel: 'استخدام رمز PIN',
        disableDeviceFallback: !fallbackToPIN,
      });
      if (result.success) await handleSuccess();
      else await handleFailure(result.error);
    } catch (error: any) { handleFailure(error.message); }
    finally { setIsAuthenticating(false); }
  };

  const getBiometricPrompt = () => {
    switch (biometricType) {
      case 'facial': return 'استخدم Face ID للمتابعة';
      case 'fingerprint': return 'استخدم بصمة الإصبع للمتابعة';
      default: return 'تحقق من هويتك للمتابعة';
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'facial': return '👤';
      case 'fingerprint': return '👆';
      default: return '🔐';
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'facial': return Platform.OS === 'ios' ? 'Face ID' : 'التعرف على الوجه';
      case 'fingerprint': return Platform.OS === 'ios' ? 'Touch ID' : 'بصمة الإصبع';
      default: return 'المصادقة البيومترية';
    }
  };

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }), { iterations: 2 }).start();
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === 'setup') {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      Alert.alert('✅ تم الإعداد', 'تم تفعيل المصادقة البيومترية بنجاح!', [{ text: 'حسناً', onPress: () => navigation.goBack() }]);
    } else {
      if (onSuccess) onSuccess();
      else navigation.replace('Main');
    }
  };

  const handleFailure = (error?: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerShake();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= 3) {
      setIsLocked(true);
      Alert.alert('🔒 تم القفل', 'تم تجاوز عدد المحاولات المسموحة.', [{ text: 'حسناً', onPress: () => handleFallback() }]);
    } else if (error !== 'user_cancel') {
      Alert.alert('فشلت المصادقة', `المحاولة ${newAttempts} من 3`, [{ text: 'إعادة المحاولة', onPress: authenticate }]);
    }
  };

  const handleFallback = () => {
    if (fallbackToPIN) navigation.navigate('PINVerification', { mode, onSuccess });
    else navigation.goBack();
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
        <Text style={styles.subtitle}>{mode === 'setup' ? 'اضغط للتفعيل والإعداد' : 'اضغط للتحقق من هويتك'}</Text>
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedText}>تم القفل - استخدم رمز PIN</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.authButton, isLocked && styles.authButtonDisabled]} onPress={authenticate} disabled={isLocked || isAuthenticating}>
          <LinearGradient colors={isLocked ? ['#666', '#444'] : [COLORS.primary, '#2E7D32']} style={styles.authButtonGradient}>
            <Text style={styles.authButtonIcon}>{getBiometricIcon()}</Text>
            <Text style={styles.authButtonText}>{isAuthenticating ? 'جاري التحقق...' : 'ابدأ المصادقة'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        {fallbackToPIN && (
          <TouchableOpacity style={styles.fallbackButton} onPress={handleFallback}>
            <Text style={styles.fallbackText}>استخدام رمز PIN بدلاً من ذلك</Text>
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
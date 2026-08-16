/**
 * ============================================
 * 📱 PhoneVerificationScreen.tsx - Salifz
 * ============================================
 * SMS OTP verification with simulation
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[PhoneVerificationScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function PhoneVerificationScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { phoneNumber, isSimulation = true } = route.params || {};
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Initial setup`);
    
    if (isSimulation) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(generatedOtp);
      console.log(`${LOG_PREFIX} 🔢 Generated OTP: ${generatedOtp}`);
      // ✅ AVANT: Alert.alert('🔐 رمز التحقق (للتجربة)', `رمز التحقق الخاص بك هو: ${generatedOtp}`)
      Alert.alert(
        t('phoneVerification.simulation.title'), 
        t('phoneVerification.simulation.message', { code: generatedOtp })
      );
    }
    startResendTimer();
  }, []);

  const startResendTimer = () => {
    console.log(`${LOG_PREFIX} ⏱️ startResendTimer()`);
    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { 
          clearInterval(interval); 
          setCanResend(true); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => { if (i < OTP_LENGTH) newOtp[i] = digit; });
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedOtp.length - 1, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (value && index === OTP_LENGTH - 1) {
      const completeOtp = [...newOtp.slice(0, -1), value].join('');
      if (completeOtp.length === OTP_LENGTH) verifyOtp(completeOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode: string) => {
    console.log(`${LOG_PREFIX} 🔐 verifyOtp()`);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isSimulation) {
        if (otpCode === simulatedOtp) {
          console.log(`${LOG_PREFIX} ✅ OTP verified successfully`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // ✅ AVANT: Alert.alert('✅ تم التحقق', 'تم التحقق من رقم الهاتف بنجاح!', [...])
          Alert.alert(
            t('phoneVerification.success.title'), 
            t('phoneVerification.success.message'), 
            [{ text: t('common.continue'), onPress: () => navigation.navigate('Main') }]
          );
        } else {
          // ✅ AVANT: throw new Error('رمز التحقق غير صحيح')
          throw new Error(t('phoneVerification.errors.invalidCode'));
        }
      } else {
        navigation.navigate('Main');
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Verification error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: Alert.alert('خطأ', error.message || 'رمز التحقق غير صحيح')
      Alert.alert(
        t('common.error'), 
        error.message || t('phoneVerification.errors.invalidCode')
      );
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { 
      setIsLoading(false); 
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    
    console.log(`${LOG_PREFIX} 📤 resendOtp()`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(newOtp);
    console.log(`${LOG_PREFIX} 🔢 New OTP generated: ${newOtp}`);
    // ✅ AVANT: Alert.alert('📱 رمز جديد', `رمز التحقق الجديد: ${newOtp}`)
    Alert.alert(
      t('phoneVerification.resend.newCodeTitle'), 
      t('phoneVerification.resend.newCodeMessage', { code: newOtp })
    );
    startResendTimer();
  };

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>
          
          {/* ✅ AVANT: 'التحقق من رقم الهاتف' */}
          <Text style={styles.title}>{t('phoneVerification.title')}</Text>
          
          <Text style={styles.subtitle}>
            {/* ✅ AVANT: 'أدخل رمز التحقق المرسل إلى' */}
            {t('phoneVerification.subtitle')}
            {'\n'}
            <Text style={styles.phoneNumber}>{phoneNumber || '+xxx xxxx xxxx'}</Text>
          </Text>
          
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { if (ref) inputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit.length > 0 && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                selectTextOnFocus
              />
            ))}
          </View>
          
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.verifyButton} 
            onPress={() => verifyOtp(otp.join(''))} 
            disabled={isLoading || otp.some(d => !d)}
          >
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.verifyGradient}>
              {isLoading ? (
                <ActivityIndicator color={colors.onDeep} />
              ) : (
                // ✅ AVANT: 'تحقق'
                <Text style={styles.verifyText}>{t('phoneVerification.verify')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity accessible accessibilityRole="button" onPress={resendOtp}>
                {/* ✅ AVANT: 'إعادة إرسال الرمز' */}
                <Text style={styles.resendLink}>{t('phoneVerification.resend.code')}</Text>
              </TouchableOpacity>
            ) : (
              // ✅ AVANT: 'إعادة الإرسال بعد X ثانية'
              <Text style={styles.resendText}>
                {t('phoneVerification.resend.timer', { seconds: resendTimer })}
              </Text>
            )}
          </View>
          
          {isSimulation && (
            <View style={styles.simulationBadge}>
              <Text style={styles.simulationIcon}>🧪</Text>
              {/* ✅ AVANT: 'وضع التجربة - الرمز: X' */}
              <Text style={styles.simulationText}>
                {t('phoneVerification.simulation.badge', { code: simulatedOtp })}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  backIcon: { color: c.onDeep, fontSize: 28 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  icon: { fontSize: 50 },
  title: { color: c.onDeep, fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  phoneNumber: { color: c.primary, fontWeight: 'bold' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 40 },
  otpInput: { width: 45, height: 55, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 5, textAlign: 'center', color: c.onDeep, fontSize: 24, fontWeight: 'bold', borderWidth: 2, borderColor: 'transparent' },
  otpInputFilled: { borderColor: c.primary, backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  verifyButton: { width: '100%', borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  verifyGradient: { paddingVertical: 16, alignItems: 'center' },
  verifyText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  resendContainer: { marginTop: 10 },
  resendText: { color: c.textSecondary, fontSize: 14 },
  resendLink: { color: c.primary, fontSize: 14, fontWeight: 'bold' },
  simulationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginTop: 30 },
  simulationIcon: { fontSize: 16, marginRight: 8 },
  simulationText: { color: c.warning, fontSize: 12 },
});
/**
 * ============================================
 * 📱 EmailVerificationScreen.tsx - Salifz
 * ============================================
 * Email Verification Screen
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

const LOG_PREFIX = '[EmailVerificationScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function EmailVerificationScreen({ route, navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { email, verificationType = 'otp', isSimulation = true } = route.params || {};
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Initial setup`);
    
    if (isSimulation && verificationType === 'otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(generatedOtp);
      console.log(`${LOG_PREFIX} 🔢 Generated OTP: ${generatedOtp}`);
      // ✅ AVANT: Alert.alert('📧 رمز التحقق (للتجربة)', `رمز التحقق المرسل إلى بريدك الإلكتروني:\n\n${generatedOtp}`)
      Alert.alert(
        t('emailVerification.simulation.title'), 
        t('emailVerification.simulation.message', { code: generatedOtp })
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
          setIsVerified(true);
          setTimeout(() => navigation.navigate('Main'), 2000);
        } else {
          // ✅ AVANT: throw new Error('رمز التحقق غير صحيح')
          throw new Error(t('emailVerification.errors.invalidCode'));
        }
      } else {
        navigation.navigate('Main');
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Verification error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: Alert.alert('خطأ', error.message)
      Alert.alert(t('common.error'), error.message);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { 
      setIsLoading(false); 
    }
  };

  const resendEmail = async () => {
    if (!canResend) return;
    
    console.log(`${LOG_PREFIX} 📤 resendEmail()`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (verificationType === 'otp') {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(newOtp);
      console.log(`${LOG_PREFIX} 🔢 New OTP generated: ${newOtp}`);
      // ✅ AVANT: Alert.alert('📧 رمز جديد', `رمز التحقق الجديد: ${newOtp}`)
      Alert.alert(
        t('emailVerification.resend.newCodeTitle'), 
        t('emailVerification.resend.newCodeMessage', { code: newOtp })
      );
    } else {
      // ✅ AVANT: Alert.alert('📧 تم الإرسال', 'تم إرسال رابط التحقق إلى بريدك الإلكتروني')
      Alert.alert(
        t('emailVerification.resend.linkSentTitle'), 
        t('emailVerification.resend.linkSentMessage')
      );
    }
    startResendTimer();
  };

  // ✅ Success screen
  if (isVerified) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          {/* ✅ AVANT: 'تم التحقق بنجاح!' */}
          <Text style={styles.successTitle}>{t('emailVerification.success.title')}</Text>
          {/* ✅ AVANT: 'جاري نقلك إلى الصفحة الرئيسية...' */}
          <Text style={styles.successSubtitle}>{t('emailVerification.success.redirecting')}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📧</Text>
          </View>
          
          {/* ✅ AVANT: 'التحقق من البريد الإلكتروني' */}
          <Text style={styles.title}>{t('emailVerification.title')}</Text>
          
          <Text style={styles.subtitle}>
            {/* ✅ AVANT: verificationType === 'otp' ? `أدخل رمز التحقق المرسل إلى\n` : `تم إرسال رابط التحقق إلى\n` */}
            {verificationType === 'otp' 
              ? t('emailVerification.subtitle.otp') 
              : t('emailVerification.subtitle.link')}
            {'\n'}
            <Text style={styles.email}>{email || 'example@email.com'}</Text>
          </Text>
          
          {verificationType === 'otp' && (
            <>
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
              
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={() => verifyOtp(otp.join(''))} 
                disabled={isLoading || otp.some(d => !d)}
              >
                <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.verifyGradient}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    // ✅ AVANT: 'تحقق'
                    <Text style={styles.verifyText}>{t('emailVerification.verify')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={resendEmail}>
                {/* ✅ AVANT: verificationType === 'otp' ? 'إعادة إرسال الرمز' : 'إعادة إرسال الرابط' */}
                <Text style={styles.resendLink}>
                  {verificationType === 'otp' 
                    ? t('emailVerification.resend.code') 
                    : t('emailVerification.resend.link')}
                </Text>
              </TouchableOpacity>
            ) : (
              // ✅ AVANT: 'إعادة الإرسال بعد X ثانية'
              <Text style={styles.resendText}>
                {t('emailVerification.resend.timer', { seconds: resendTimer })}
              </Text>
            )}
          </View>
          
          {isSimulation && verificationType === 'otp' && (
            <View style={styles.simulationBadge}>
              <Text style={styles.simulationIcon}>🧪</Text>
              {/* ✅ AVANT: 'وضع التجربة - الرمز: X' */}
              <Text style={styles.simulationText}>
                {t('emailVerification.simulation.badge', { code: simulatedOtp })}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  backIcon: { color: '#fff', fontSize: 28 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  icon: { fontSize: 50 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  email: { color: COLORS.primary, fontWeight: 'bold' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 40 },
  otpInput: { width: 45, height: 55, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 5, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold', borderWidth: 2, borderColor: 'transparent' },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  verifyButton: { width: '100%', borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  verifyGradient: { paddingVertical: 16, alignItems: 'center' },
  verifyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendContainer: { marginTop: 20 },
  resendText: { color: '#666', fontSize: 14 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  simulationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginTop: 20 },
  simulationIcon: { fontSize: 16, marginRight: 8 },
  simulationText: { color: '#FFC107', fontSize: 12 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  successEmoji: { fontSize: 60 },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  successSubtitle: { color: '#aaa', fontSize: 16 },
});
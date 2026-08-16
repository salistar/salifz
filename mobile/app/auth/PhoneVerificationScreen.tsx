/**
 * Phone Verification Screen - Salifz
 * SMS OTP verification with simulation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../config';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function PhoneVerificationScreen({ route, navigation }: any) {
  const { phoneNumber, isSimulation = true } = route.params || {};
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (isSimulation) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(generatedOtp);
      Alert.alert('🔐 رمز التحقق (للتجربة)', `رمز التحقق الخاص بك هو: ${generatedOtp}`);
    }
    startResendTimer();
  }, []);

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
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
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const verifyOtp = async (otpCode: string) => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (isSimulation) {
        if (otpCode === simulatedOtp) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('✅ تم التحقق', 'تم التحقق من رقم الهاتف بنجاح!', [{ text: 'متابعة', onPress: () => navigation.navigate('Main') }]);
        } else throw new Error('رمز التحقق غير صحيح');
      } else navigation.navigate('Main');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', error.message || 'رمز التحقق غير صحيح');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setIsLoading(false); }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(newOtp);
    Alert.alert('📱 رمز جديد', `رمز التحقق الجديد: ${newOtp}`);
    startResendTimer();
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.iconContainer}><Text style={styles.icon}>📱</Text></View>
          <Text style={styles.title}>التحقق من رقم الهاتف</Text>
          <Text style={styles.subtitle}>أدخل رمز التحقق المرسل إلى{'\n'}<Text style={styles.phoneNumber}>{phoneNumber || '+xxx xxxx xxxx'}</Text></Text>
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
          <TouchableOpacity style={styles.verifyButton} onPress={() => verifyOtp(otp.join(''))} disabled={isLoading || otp.some(d => !d)}>
            <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.verifyGradient}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>تحقق</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={resendOtp}><Text style={styles.resendLink}>إعادة إرسال الرمز</Text></TouchableOpacity>
            ) : (<Text style={styles.resendText}>إعادة الإرسال بعد {resendTimer} ثانية</Text>)}
          </View>
          {isSimulation && (
            <View style={styles.simulationBadge}>
              <Text style={styles.simulationIcon}>🧪</Text>
              <Text style={styles.simulationText}>وضع التجربة - الرمز: {simulatedOtp}</Text>
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
  phoneNumber: { color: COLORS.primary, fontWeight: 'bold' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 40 },
  otpInput: { width: 45, height: 55, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 5, textAlign: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold', borderWidth: 2, borderColor: 'transparent' },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  verifyButton: { width: '100%', borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  verifyGradient: { paddingVertical: 16, alignItems: 'center' },
  verifyText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resendContainer: { marginTop: 10 },
  resendText: { color: '#666', fontSize: 14 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  simulationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginTop: 30 },
  simulationIcon: { fontSize: 16, marginRight: 8 },
  simulationText: { color: '#FFC107', fontSize: 12 },
});
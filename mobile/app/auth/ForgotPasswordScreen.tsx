import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { authAPI } from '../../services/api';
import { COLORS } from '../../config';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('البريد الإلكتروني مطلوب'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('البريد الإلكتروني غير صحيح'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setIsLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSent(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'حدث خطأ، حاول مرة أخرى');
    }
    setIsLoading(false);
  };

  if (isSent) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Text style={styles.successEmoji}>✉️</Text></View>
          <Text style={styles.successTitle}>تم الإرسال!</Text>
          <Text style={styles.successText}>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني</Text>
          <Text style={styles.emailText}>{email}</Text>
          <TouchableOpacity style={styles.backToLoginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backToLoginText}>العودة لتسجيل الدخول</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendButton} onPress={() => { setIsSent(false); handleSubmit(); }}>
            <Text style={styles.resendText}>إعادة الإرسال</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <View style={styles.iconContainer}><Text style={styles.headerEmoji}>🔑</Text></View>
            <Text style={styles.title}>نسيت كلمة المرور؟</Text>
            <Text style={styles.subtitle}>لا تقلق! أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={[styles.inputWrapper, error ? styles.inputError : undefined]}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput style={styles.input} placeholder="example@email.com" placeholderTextColor="#666" value={email} onChangeText={(text) => { setEmail(text); if (error) setError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoFocus />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
              <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.submitButtonGradient}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>إرسال الرابط</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>← العودة لتسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 50 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 28 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  headerEmoji: { fontSize: 50 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { color: '#aaa', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 25 },
  inputLabel: { color: '#fff', marginBottom: 10, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: '#F44336' },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 8 },
  submitButton: { borderRadius: 15, overflow: 'hidden', marginTop: 25 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 30 },
  loginLinkText: { color: '#4CAF50', fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  successEmoji: { fontSize: 60 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  successText: { color: '#aaa', textAlign: 'center', lineHeight: 24, marginBottom: 10 },
  emailText: { color: '#4CAF50', fontWeight: 'bold', marginBottom: 40 },
  backToLoginButton: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, marginBottom: 15 },
  backToLoginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resendButton: { padding: 10 },
  resendText: { color: '#aaa' }
});
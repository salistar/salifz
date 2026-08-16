/**
 * ============================================
 * 📱 ForgotPasswordScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { authAPI } from '../../services/api';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ForgotPasswordScreen.tsx]';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    console.log(`${LOG_PREFIX} 🔄 ========== FORGOT PASSWORD START ==========`);
    console.log(`${LOG_PREFIX} 📧 Email: ${email}`);
    
    // ✅ AVANT: 'البريد الإلكتروني مطلوب'
    if (!email.trim()) { 
      console.log(`${LOG_PREFIX} ❌ Validation failed: email required`);
      setError(t('validation.emailRequired')); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); 
      return; 
    }
    
    // ✅ AVANT: 'البريد الإلكتروني غير صحيح'
    if (!/\S+@\S+\.\S+/.test(email)) { 
      console.log(`${LOG_PREFIX} ❌ Validation failed: email invalid`);
      setError(t('validation.emailInvalid')); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); 
      return; 
    }
    
    console.log(`${LOG_PREFIX} ✅ Validation passed`);
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`${LOG_PREFIX} 📤 Calling forgotPassword API...`);
      await authAPI.forgotPassword(email.trim().toLowerCase());
      console.log(`${LOG_PREFIX} ✅ Reset email sent successfully!`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSent(true);
    } catch (err: any) {
      console.log(`${LOG_PREFIX} ❌ API error:`, err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: 'حدث خطأ، حاول مرة أخرى'
      setError(err.message || t('errors.generic'));
    }
    
    setIsLoading(false);
    console.log(`${LOG_PREFIX} 🔄 ========== FORGOT PASSWORD END ==========`);
  };

  // ✅ Success Screen (email sent)
  if (isSent) {
    console.log(`${LOG_PREFIX} 🎨 Rendering SUCCESS UI...`);
    return (
      <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✉️</Text>
          </View>
          {/* ✅ AVANT: 'تم الإرسال!' */}
          <Text style={styles.successTitle}>{t('forgotPassword.sent')}</Text>
          {/* ✅ AVANT: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' */}
          <Text style={styles.successText}>{t('forgotPassword.sentDescription')}</Text>
          <Text style={styles.emailText}>{email}</Text>
          
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.backToLoginButton} 
            onPress={() => {
              console.log(`${LOG_PREFIX} 🔗 Navigate to Login`);
              navigation.navigate('Login');
            }}
          >
            {/* ✅ AVANT: 'العودة لتسجيل الدخول' */}
            <Text style={styles.backToLoginText}>{t('forgotPassword.backToLogin')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.resendButton} 
            onPress={() => { 
              console.log(`${LOG_PREFIX} 🔄 Resend button pressed`);
              setIsSent(false); 
              handleSubmit(); 
            }}
          >
            {/* ✅ AVANT: 'إعادة الإرسال' */}
            <Text style={styles.resendText}>{t('forgotPassword.resend')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  console.log(`${LOG_PREFIX} 🎨 Rendering FORM UI...`);

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.backButton} 
            onPress={() => {
              console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
              navigation.goBack();
            }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.headerEmoji}>🔑</Text>
            </View>
            {/* ✅ AVANT: 'نسيت كلمة المرور؟' */}
            <Text style={styles.title}>{t('forgotPassword.title')}</Text>
            {/* ✅ AVANT: 'لا تقلق! أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين' */}
            <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            {/* ✅ AVANT: 'البريد الإلكتروني' */}
            <Text style={styles.inputLabel}>{t('auth.email')}</Text>
            <View style={[styles.inputWrapper, error ? styles.inputError : undefined]}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput 
                style={styles.input} 
                placeholder="example@email.com" 
                placeholderTextColor={colors.textSecondary} 
                value={email} 
                onChangeText={(text) => { 
                  console.log(`${LOG_PREFIX} 📝 Email changed: ${text}`);
                  setEmail(text); 
                  if (error) setError(''); 
                }} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                autoCorrect={false} 
                autoFocus 
              />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {/* Submit Button */}
            <TouchableOpacity accessible accessibilityRole="button" 
              style={styles.submitButton} 
              onPress={handleSubmit} 
              disabled={isLoading}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitButtonGradient}>
                {isLoading ? (
                  <ActivityIndicator color={colors.onDeep} />
                ) : (
                  // ✅ AVANT: 'إرسال الرابط'
                  <Text style={styles.submitButtonText}>{t('forgotPassword.sendLink')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Back to Login Link */}
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.loginLink} 
            onPress={() => {
              console.log(`${LOG_PREFIX} 🔗 Navigate to Login`);
              navigation.navigate('Login');
            }}
          >
            {/* ✅ AVANT: '← العودة لتسجيل الدخول' */}
            <Text style={styles.loginLinkText}>← {t('forgotPassword.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 50 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: c.onDeep, fontSize: 28 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  iconContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(76, 175, 80, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerEmoji: { fontSize: 50 },
  title: { fontSize: 26, fontWeight: 'bold', color: c.onDeep, marginBottom: 10 },
  subtitle: { color: '#aaa', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 25 },
  inputLabel: { color: c.onDeep, marginBottom: 10, fontWeight: '600' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  inputError: { borderColor: c.error },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: c.onDeep, paddingVertical: 15, fontSize: 16 },
  errorText: { color: c.error, fontSize: 12, marginTop: 8 },
  submitButton: { borderRadius: 15, overflow: 'hidden', marginTop: 25 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 30 },
  loginLinkText: { color: c.primary, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  successIcon: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: 'rgba(76, 175, 80, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  successEmoji: { fontSize: 60 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: c.onDeep, marginBottom: 15 },
  successText: { color: '#aaa', textAlign: 'center', lineHeight: 24, marginBottom: 10 },
  emailText: { color: c.primary, fontWeight: 'bold', marginBottom: 40 },
  backToLoginButton: { 
    backgroundColor: c.primary, 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 25, 
    marginBottom: 15 
  },
  backToLoginText: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 },
  resendButton: { padding: 10 },
  resendText: { color: '#aaa' }
});
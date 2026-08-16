/**
 * ============================================
 * 📱 RegisterScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[RegisterScreen.tsx]';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const updateField = (field: string, value: string) => {
    console.log(`${LOG_PREFIX} 📝 Field updated: ${field} = ${field === 'password' || field === 'confirmPassword' ? '******' : value}`);
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validate = () => {
    console.log(`${LOG_PREFIX} 🔍 Validating form...`);
    const newErrors: Record<string, string> = {};
    
    // ✅ AVANT: 'اسم المستخدم مطلوب'
    // ✅ APRÈS:
    if (!formData.username.trim()) {
      newErrors.username = t('validation.usernameRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: username required`);
    } else if (formData.username.length < 3) {
      newErrors.username = t('validation.usernameTooShort');
      console.log(`${LOG_PREFIX} ❌ Validation failed: username too short`);
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: email required`);
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
      console.log(`${LOG_PREFIX} ❌ Validation failed: email invalid`);
    }
    
    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: password required`);
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.passwordTooShort');
      console.log(`${LOG_PREFIX} ❌ Validation failed: password too short`);
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
      console.log(`${LOG_PREFIX} ❌ Validation failed: passwords don't match`);
    }
    
    if (!agreeTerms) {
      newErrors.terms = t('validation.termsRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: terms not accepted`);
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`${LOG_PREFIX} ${isValid ? '✅' : '❌'} Validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
    return isValid;
  };

  const handleRegister = async () => {
    console.log(`${LOG_PREFIX} 🔄 ========== REGISTER START ==========`);
    console.log(`${LOG_PREFIX} 📋 Form data: username=${formData.username}, email=${formData.email}`);
    
    if (!validate()) {
      console.log(`${LOG_PREFIX} ❌ Validation failed, aborting registration`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    try {
      console.log(`${LOG_PREFIX} 📤 Calling register API...`);
      await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      console.log(`${LOG_PREFIX} ✅ Registration successful!`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log(`${LOG_PREFIX} ❌ Registration error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: Alert.alert('خطأ في التسجيل', error.message || 'حدث خطأ أثناء إنشاء الحساب');
      // ✅ APRÈS:
      Alert.alert(t('auth.registerError'), error.message || t('errors.generic'));
    }
    
    console.log(`${LOG_PREFIX} 🔄 ========== REGISTER END ==========`);
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { level: 0, text: '', color: colors.textSecondary };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // ✅ AVANT: 'ضعيفة', 'متوسطة', 'قوية'
    // ✅ APRÈS:
    if (strength <= 2) return { level: strength, text: t('password.weak'), color: colors.error };
    if (strength <= 3) return { level: strength, text: t('password.medium'), color: colors.warning };
    return { level: strength, text: t('password.strong'), color: colors.primary };
  };

  const passwordStrength = getPasswordStrength();

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity accessible accessibilityRole="button" 
              style={styles.backButton} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
                navigation.goBack();
              }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerEmoji}>📖</Text>
              {/* ✅ AVANT: 'إنشاء حساب جديد' */}
              <Text style={styles.headerTitle}>{t('auth.createAccount')}</Text>
              {/* ✅ AVANT: 'انضم إلينا وابدأ رحلة الحفظ' */}
              <Text style={styles.headerSubtitle}>{t('auth.joinUsSubtitle')}</Text>
            </View>
          </View>

          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputContainer}>
              {/* ✅ AVANT: 'اسم المستخدم' */}
              <Text style={styles.inputLabel}>{t('auth.username')}</Text>
              <View style={[styles.inputWrapper, errors.username ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t('auth.usernamePlaceholder')} 
                  placeholderTextColor={colors.textSecondary} 
                  value={formData.username} 
                  onChangeText={(text) => updateField('username', text)} 
                  autoCapitalize="none" 
                  autoCorrect={false} 
                />
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              {/* ✅ AVANT: 'البريد الإلكتروني' */}
              <Text style={styles.inputLabel}>{t('auth.email')}</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="example@email.com" 
                  placeholderTextColor={colors.textSecondary} 
                  value={formData.email} 
                  onChangeText={(text) => updateField('email', text)} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                  autoCorrect={false} 
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              {/* ✅ AVANT: 'كلمة المرور' */}
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  placeholderTextColor={colors.textSecondary} 
                  value={formData.password} 
                  onChangeText={(text) => updateField('password', text)} 
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity accessible accessibilityRole="button" onPress={() => {
                  console.log(`${LOG_PREFIX} 👁️ Toggle password visibility: ${!showPassword}`);
                  setShowPassword(!showPassword);
                }}>
                  <Text style={styles.showIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              {formData.password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View key={level} style={[styles.strengthBar, { backgroundColor: level <= passwordStrength.level ? passwordStrength.color : colors.text }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.text}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              {/* ✅ AVANT: 'تأكيد كلمة المرور' */}
              <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  placeholderTextColor={colors.textSecondary} 
                  value={formData.confirmPassword} 
                  onChangeText={(text) => updateField('confirmPassword', text)} 
                  secureTextEntry={!showPassword} 
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && <Text style={styles.matchIcon}>✓</Text>}
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity accessible accessibilityRole="button" 
              style={styles.termsContainer} 
              onPress={() => {
                console.log(`${LOG_PREFIX} ☑️ Terms checkbox toggled: ${!agreeTerms}`);
                setAgreeTerms(!agreeTerms);
              }}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkboxIcon}>✓</Text>}
              </View>
              {/* ✅ AVANT: 'أوافق على الشروط والأحكام و سياسة الخصوصية' */}
              <Text style={styles.termsText}>
                {t('auth.agreeToTerms')} <Text style={styles.termsLink}>{t('auth.termsAndConditions')}</Text> {t('common.and')} <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            {/* Register Button */}
            <TouchableOpacity accessible accessibilityRole="button" 
              style={styles.registerButton} 
              onPress={handleRegister} 
              disabled={isLoading}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.registerButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? (
                  <ActivityIndicator color={colors.onDeep} />
                ) : (
                  // ✅ AVANT: 'إنشاء الحساب'
                  <Text style={styles.registerButtonText}>{t('auth.createAccountButton')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              {/* ✅ AVANT: 'أو سجل باستخدام' */}
              <Text style={styles.dividerText}>{t('auth.orRegisterWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity accessible accessibilityRole="button" 
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 🍎 Apple login pressed`)}
              >
                <Text style={styles.socialIcon}>🍎</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button" 
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 🔵 Google login pressed`)}
              >
                <Text style={styles.socialIcon}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button" 
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 📘 Facebook login pressed`)}
              >
                <Text style={styles.socialIcon}>f</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Section */}
          <View style={styles.loginSection}>
            {/* ✅ AVANT: 'لديك حساب بالفعل؟' */}
            <Text style={styles.loginText}>{t('auth.hasAccount')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={() => {
              console.log(`${LOG_PREFIX} 🔗 Navigate to Login`);
              navigation.navigate('Login');
            }}>
              {/* ✅ AVANT: 'تسجيل الدخول' */}
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 50, paddingBottom: 30 },
  header: { marginBottom: 30 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: c.onDeep, fontSize: 28 },
  headerCenter: { alignItems: 'center', marginTop: 10 },
  headerEmoji: { fontSize: 50, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: c.onDeep },
  headerSubtitle: { color: '#aaa', marginTop: 5 },
  form: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 25, marginBottom: 20 },
  inputContainer: { marginBottom: 18 },
  inputLabel: { color: c.onDeep, marginBottom: 8, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: c.error },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: c.onDeep, paddingVertical: 15, fontSize: 16 },
  showIcon: { fontSize: 18, padding: 5 },
  matchIcon: { color: c.primary, fontSize: 18, fontWeight: 'bold' },
  errorText: { color: c.error, fontSize: 12, marginTop: 5, marginLeft: 5 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  strengthBars: { flexDirection: 'row', flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, marginRight: 3 },
  strengthText: { fontSize: 12, marginLeft: 10, fontWeight: '600' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.textSecondary, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  checkboxIcon: { color: c.onDeep, fontSize: 14, fontWeight: 'bold' },
  termsText: { flex: 1, color: '#aaa', fontSize: 13 },
  termsLink: { color: c.primary },
  registerButton: { borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  registerButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  registerButtonText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: c.textSecondary, marginHorizontal: 15, fontSize: 13 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center' },
  socialButton: { width: 55, height: 55, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  socialIcon: { fontSize: 22 },
  loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: '#aaa' },
  loginLink: { color: c.primary, fontWeight: 'bold', marginLeft: 5 }
});
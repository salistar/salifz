/**
 * ============================================
 * 📱 LoginScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: Wait for login to complete before navigation
 * ✅ FIXED: Debug auth state after login
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
import { initializeToken, debugAuth } from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { IconeMushaf, IconeProfil, IconeReglages } from '../../components/common/Icones';

const { width, height } = Dimensions.get('window');

const LOG_PREFIX = '[LoginScreen.tsx]';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  console.log(`${LOG_PREFIX} 📐 Screen dimensions: ${width}x${height}`);

  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    console.log(`${LOG_PREFIX} 🔍 Validating form...`);
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: email required`);
    }

    if (!password) {
      newErrors.password = t('validation.passwordRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: password required`);
    } else if (password.length < 6) {
      newErrors.password = t('validation.passwordTooShort');
      console.log(`${LOG_PREFIX} ❌ Validation failed: password too short`);
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`${LOG_PREFIX} ${isValid ? '✅' : '❌'} Validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
    return isValid;
  };

  const handleLogin = async () => {
    console.log(`${LOG_PREFIX} 🔄 ========== LOGIN START ==========`);
    console.log(`${LOG_PREFIX} 📧 Email: ${email}`);

    if (!validate()) {
      console.log(`${LOG_PREFIX} ❌ Validation failed, aborting login`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isSubmitting) {
      console.log(`${LOG_PREFIX} ⚠️ Already submitting, ignoring...`);
      return;
    }
    setIsSubmitting(true);
    console.log(`${LOG_PREFIX} 🔒 isSubmitting set to true`);

    try {
      console.log(`${LOG_PREFIX} 📤 Calling login API...`);

      const success = await login(email.trim().toLowerCase(), password);

      console.log(`${LOG_PREFIX} 📥 Login API result: ${success}`);

      if (success) {
        console.log(`${LOG_PREFIX} ✅ Login successful!`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        console.log(`${LOG_PREFIX} 🔑 Checking auth state...`);
        debugAuth();

        console.log(`${LOG_PREFIX} ⏱️ Waiting 500ms for token sync...`);
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`${LOG_PREFIX} 🔄 Reinitializing token...`);
        await initializeToken();

        console.log(`${LOG_PREFIX} 🔑 After sync - checking auth state again:`);
        debugAuth();

        console.log(`${LOG_PREFIX} 🚀 Navigating to Main screen...`);
        navigation.replace('Main');
        console.log(`${LOG_PREFIX} ✅ Navigation triggered`);
      } else {
        console.log(`${LOG_PREFIX} ❌ Login failed - invalid credentials`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t('auth.loginError'), t('auth.invalidCredentials'));
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Login error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('auth.loginError'), error?.message || t('errors.generic'));
    } finally {
      setIsSubmitting(false);
      console.log(`${LOG_PREFIX} 🔓 isSubmitting set to false`);
      console.log(`${LOG_PREFIX} 🔄 ========== LOGIN END ==========`);
    }
  };

  const fillTestCredentials = () => {
    console.log(`${LOG_PREFIX} 🧪 Filling test credentials...`);
    // `test123` ne passe plus la politique de mot de passe (10 caractères
    // minimum, majuscule, minuscule, chiffre). Ces identifiants correspondent
    // au compte semé par backendv2/scripts/seed-test-user.js.
    setEmail('test@salifz.com');
    setPassword('Salifz2026');
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <IconeMushaf size={54} color={colors.onDeep} />
            </View>
            <Text style={styles.appName}>{t('common.appName')}</Text>
            <Text style={styles.appSlogan}>{t('onboarding.slogan')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitleText}>{t('auth.loginToContinue')}</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.emailOrUsername')}</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                <IconeProfil size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    console.log(`${LOG_PREFIX} 📝 Email changed: ${text}`);
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <IconeReglages size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    console.log(`${LOG_PREFIX} 📝 Password changed: ******`);
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity accessible accessibilityRole="button" onPress={() => {
                  console.log(`${LOG_PREFIX} 👁️ Toggle password visibility: ${!showPassword}`);
                  setShowPassword(!showPassword);
                }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.forgotButton}
              onPress={() => {
                console.log(`${LOG_PREFIX} 🔗 Navigate to ForgotPassword`);
                navigation.navigate('ForgotPassword');
              }}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity accessible accessibilityRole="button"
              style={[styles.loginButton, (isLoading || isSubmitting) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || isSubmitting}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {(isLoading || isSubmitting) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.onDeep} size="small" />
                    <Text style={styles.loadingText}>{t('auth.loggingIn')}</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>{t('auth.loginButton')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 🍎 Apple login pressed`)}
              >
                <Ionicons name="logo-apple" size={22} color={colors.text} />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 🔵 Google login pressed`)}
              >
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Section */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={() => {
              console.log(`${LOG_PREFIX} 🔗 Navigate to Register`);
              navigation.navigate('Register');
            }}>
              <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <View style={styles.devSection}>
              <TouchableOpacity accessible accessibilityRole="button" style={styles.devButton} onPress={fillTestCredentials}>
                <Text style={styles.devButtonText}>Test User</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 60, paddingBottom: 30 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  logoEmoji: {},
  appName: { fontSize: 32, fontWeight: 'bold', color: c.onDeep },
  appSlogan: { color: '#aaa', marginTop: 5 },
  formSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20
  },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: c.onDeep, textAlign: 'center' },
  subtitleText: { color: '#aaa', textAlign: 'center', marginTop: 5, marginBottom: 25 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: c.onDeep, marginBottom: 8, fontWeight: '600' },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: c.onDeep, paddingVertical: 15, fontSize: 16 },
  showIcon: { padding: 5 },
  errorText: { color: c.error, fontSize: 12, marginTop: 5, marginLeft: 5 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: c.primary, fontWeight: '600' },
  loginButton: { borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  loginButtonText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { color: c.onDeep, fontSize: 16, marginLeft: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: c.textSecondary, marginHorizontal: 15 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5
  },
  socialIcon: { marginRight: 8 },
  socialText: { color: c.onDeep, fontWeight: '600' },
  registerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: '#aaa' },
  registerLink: { color: c.primary, fontWeight: 'bold', marginLeft: 5 },
  // Dev section
  devSection: {
    marginTop: 20,
    alignItems: 'center'
  },
  devButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.5)'
  },
  devButtonText: { color: c.warning, fontWeight: '600' }
});
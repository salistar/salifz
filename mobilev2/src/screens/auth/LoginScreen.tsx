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
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width, height } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[LoginScreen.tsx]';

export default function LoginScreen({ navigation }: any) {
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
    
    // ✅ AVANT: 'البريد الإلكتروني مطلوب'
    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: email required`);
    }
    
    // ✅ AVANT: 'كلمة المرور مطلوبة'
    if (!password) {
      newErrors.password = t('validation.passwordRequired');
      console.log(`${LOG_PREFIX} ❌ Validation failed: password required`);
    } else if (password.length < 6) {
      // ✅ AVANT: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
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
      
      // ✅ Appeler login et attendre le résultat
      const success = await login(email.trim().toLowerCase(), password);
      
      console.log(`${LOG_PREFIX} 📥 Login API result: ${success}`);
      
      if (success) {
        console.log(`${LOG_PREFIX} ✅ Login successful!`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // ✅ Debug l'état du token
        console.log(`${LOG_PREFIX} 🔑 Checking auth state...`);
        debugAuth();
        
        // ✅ Attendre que le token soit bien synchronisé
        console.log(`${LOG_PREFIX} ⏱️ Waiting 500ms for token sync...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ Réinitialiser le token pour s'assurer qu'il est dans les headers
        console.log(`${LOG_PREFIX} 🔄 Reinitializing token...`);
        await initializeToken();
        
        // ✅ Debug à nouveau
        console.log(`${LOG_PREFIX} 🔑 After sync - checking auth state again:`);
        debugAuth();
        
        // ✅ Naviguer vers Main
        console.log(`${LOG_PREFIX} 🚀 Navigating to Main screen...`);
        navigation.replace('Main');
        console.log(`${LOG_PREFIX} ✅ Navigation triggered`);
      } else {
        console.log(`${LOG_PREFIX} ❌ Login failed - invalid credentials`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // ✅ AVANT: Alert.alert('خطأ في تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        Alert.alert(t('auth.loginError'), t('auth.invalidCredentials'));
      }
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Login error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: Alert.alert('خطأ في تسجيل الدخول', error?.message || 'حدث خطأ أثناء تسجيل الدخول');
      Alert.alert(t('auth.loginError'), error?.message || t('errors.generic'));
    } finally {
      setIsSubmitting(false);
      console.log(`${LOG_PREFIX} 🔓 isSubmitting set to false`);
      console.log(`${LOG_PREFIX} 🔄 ========== LOGIN END ==========`);
    }
  };

  // ✅ Dev helper pour remplir les champs de test
  const fillTestCredentials = () => {
    console.log(`${LOG_PREFIX} 🧪 Filling test credentials...`);
    setEmail('test@salifz.com');
    setPassword('test123');
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>📖</Text>
            </View>
            {/* ✅ AVANT: 'Salifz' */}
            <Text style={styles.appName}>{t('common.appName')}</Text>
            {/* ✅ AVANT: 'احفظ القرآن بطريقة ممتعة' */}
            <Text style={styles.appSlogan}>{t('onboarding.slogan')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* ✅ AVANT: 'مرحباً بعودتك! 👋' */}
            <Text style={styles.welcomeText}>{t('auth.welcomeBack')}</Text>
            {/* ✅ AVANT: 'سجل دخولك للمتابعة' */}
            <Text style={styles.subtitleText}>{t('auth.loginToContinue')}</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              {/* ✅ AVANT: 'البريد الإلكتروني أو اسم المستخدم' */}
              <Text style={styles.inputLabel}>{t('auth.emailOrUsername')}</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  // ✅ AVANT: 'example@email.com أو username'
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#666"
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
              {/* ✅ AVANT: 'كلمة المرور' */}
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={(text) => { 
                    console.log(`${LOG_PREFIX} 📝 Password changed: ******`);
                    setPassword(text); 
                    if (errors.password) setErrors({ ...errors, password: undefined }); 
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => {
                  console.log(`${LOG_PREFIX} 👁️ Toggle password visibility: ${!showPassword}`);
                  setShowPassword(!showPassword);
                }}>
                  <Text style={styles.showIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotButton} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 🔗 Navigate to ForgotPassword`);
                navigation.navigate('ForgotPassword');
              }}
            >
              {/* ✅ AVANT: 'نسيت كلمة المرور؟' */}
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, (isLoading || isSubmitting) && styles.loginButtonDisabled]} 
              onPress={handleLogin} 
              disabled={isLoading || isSubmitting}
            >
              <LinearGradient 
                colors={[COLORS.primary, '#2E7D32']} 
                style={styles.loginButtonGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
              >
                {(isLoading || isSubmitting) ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    {/* ✅ AVANT: 'جاري تسجيل الدخول...' */}
                    <Text style={styles.loadingText}>{t('auth.loggingIn')}</Text>
                  </View>
                ) : (
                  // ✅ AVANT: 'تسجيل الدخول'
                  <Text style={styles.loginButtonText}>{t('auth.loginButton')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              {/* ✅ AVANT: 'أو' */}
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => console.log(`${LOG_PREFIX} 🍎 Apple login pressed`)}
              >
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity 
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
            {/* ✅ AVANT: 'ليس لديك حساب؟' */}
            <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
            <TouchableOpacity onPress={() => {
              console.log(`${LOG_PREFIX} 🔗 Navigate to Register`);
              navigation.navigate('Register');
            }}>
              {/* ✅ AVANT: 'سجل الآن' */}
              <Text style={styles.registerLink}>{t('auth.registerNow')}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Dev Helper - Only in development */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <TouchableOpacity style={styles.devButton} onPress={fillTestCredentials}>
                <Text style={styles.devButtonText}>🧪 Test User</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  logoEmoji: { fontSize: 50 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  appSlogan: { color: '#aaa', marginTop: 5 },
  formSection: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 25, 
    padding: 25, 
    marginBottom: 20 
  },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitleText: { color: '#aaa', textAlign: 'center', marginTop: 5, marginBottom: 25 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: '#fff', marginBottom: 8, fontWeight: '600' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  inputError: { borderColor: '#F44336' },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 },
  showIcon: { fontSize: 18, padding: 5 },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 5, marginLeft: 5 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#4CAF50', fontWeight: '600' },
  loginButton: { borderRadius: 15, overflow: 'hidden', marginBottom: 20 },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, marginLeft: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: '#666', marginHorizontal: 15 },
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
  socialIcon: { fontSize: 18, marginRight: 8 },
  socialText: { color: '#fff', fontWeight: '600' },
  registerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { color: '#aaa' },
  registerLink: { color: '#4CAF50', fontWeight: 'bold', marginLeft: 5 },
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
  devButtonText: { color: '#FF9800', fontWeight: '600' }
});
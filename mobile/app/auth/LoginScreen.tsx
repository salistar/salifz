/**
 * Login Screen - Salifz
 * ✅ FIXED: Wait for login to complete before navigation
 * ✅ FIXED: Debug auth state after login
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

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      console.log('[LOGIN] Starting login...');
      
      // ✅ Appeler login et attendre le résultat
      const success = await login(email.trim().toLowerCase(), password);
      
      console.log('[LOGIN] Login result:', success);
      
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // ✅ Debug l'état du token
        console.log('[LOGIN] Checking auth state...');
        debugAuth();
        
        // ✅ Attendre que le token soit bien synchronisé
        console.log('[LOGIN] Waiting for token sync...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ Réinitialiser le token pour s'assurer qu'il est dans les headers
        await initializeToken();
        
        // ✅ Debug à nouveau
        console.log('[LOGIN] After sync:');
        debugAuth();
        
        // ✅ Naviguer vers Main
        console.log('[LOGIN] Navigating to Main...');
        navigation.replace('Main');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('خطأ في تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch (error: any) {
      console.error('[LOGIN] Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ في تسجيل الدخول', error?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Dev helper pour remplir les champs de test
  const fillTestCredentials = () => {
    setEmail('test@salifz.com');
    setPassword('test123');
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>📖</Text>
            </View>
            <Text style={styles.appName}>Salifz</Text>
            <Text style={styles.appSlogan}>احفظ القرآن بطريقة ممتعة</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>مرحباً بعودتك! 👋</Text>
            <Text style={styles.subtitleText}>سجل دخولك للمتابعة</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني أو اسم المستخدم</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com أو username"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>

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
                    <Text style={styles.loadingText}>جاري تسجيل الدخول...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.registerSection}>
            <Text style={styles.registerText}>ليس لديك حساب؟</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>سجل الآن</Text>
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
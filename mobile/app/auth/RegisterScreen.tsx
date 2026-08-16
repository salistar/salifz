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

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }: any) {
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    else if (formData.username.length < 3) newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    if (!agreeTerms) newErrors.terms = 'يجب الموافقة على الشروط والأحكام';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ في التسجيل', error.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { level: 0, text: '', color: '#666' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (strength <= 2) return { level: strength, text: 'ضعيفة', color: '#F44336' };
    if (strength <= 3) return { level: strength, text: 'متوسطة', color: '#FF9800' };
    return { level: strength, text: 'قوية', color: '#4CAF50' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerEmoji}>📖</Text>
              <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
              <Text style={styles.headerSubtitle}>انضم إلينا وابدأ رحلة الحفظ</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اسم المستخدم</Text>
              <View style={[styles.inputWrapper, errors.username ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput style={styles.input} placeholder="username" placeholderTextColor="#666" value={formData.username} onChangeText={(text) => updateField('username', text)} autoCapitalize="none" autoCorrect={false} />
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <View style={[styles.inputWrapper, errors.email ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput style={styles.input} placeholder="example@email.com" placeholderTextColor="#666" value={formData.email} onChangeText={(text) => updateField('email', text)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={[styles.inputWrapper, errors.password ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#666" value={formData.password} onChangeText={(text) => updateField('password', text)} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              {formData.password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View key={level} style={[styles.strengthBar, { backgroundColor: level <= passwordStrength.level ? passwordStrength.color : '#333' }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.text}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : undefined]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#666" value={formData.confirmPassword} onChangeText={(text) => updateField('confirmPassword', text)} secureTextEntry={!showPassword} />
                {formData.confirmPassword && formData.password === formData.confirmPassword && <Text style={styles.matchIcon}>✓</Text>}
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity style={styles.termsContainer} onPress={() => setAgreeTerms(!agreeTerms)}>
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkboxIcon}>✓</Text>}
              </View>
              <Text style={styles.termsText}>أوافق على <Text style={styles.termsLink}>الشروط والأحكام</Text> و <Text style={styles.termsLink}>سياسة الخصوصية</Text></Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
              <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.registerButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>إنشاء الحساب</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو سجل باستخدام</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}><Text style={styles.socialIcon}>🍎</Text></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><Text style={styles.socialIcon}>G</Text></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><Text style={styles.socialIcon}>f</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 50, paddingBottom: 30 },
  header: { marginBottom: 30 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 28 },
  headerCenter: { alignItems: 'center', marginTop: 10 },
  headerEmoji: { fontSize: 50, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { color: '#aaa', marginTop: 5 },
  form: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, padding: 25, marginBottom: 20 },
  inputContainer: { marginBottom: 18 },
  inputLabel: { color: '#fff', marginBottom: 8, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: '#F44336' },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 },
  showIcon: { fontSize: 18, padding: 5 },
  matchIcon: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 5, marginLeft: 5 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  strengthBars: { flexDirection: 'row', flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, marginRight: 3 },
  strengthText: { fontSize: 12, marginLeft: 10, fontWeight: '600' },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#666', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkboxIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  termsText: { flex: 1, color: '#aaa', fontSize: 13 },
  termsLink: { color: '#4CAF50' },
  registerButton: { borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  registerButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: '#666', marginHorizontal: 15, fontSize: 13 },
  socialButtons: { flexDirection: 'row', justifyContent: 'center' },
  socialButton: { width: 55, height: 55, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  socialIcon: { fontSize: 22 },
  loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: '#aaa' },
  loginLink: { color: '#4CAF50', fontWeight: 'bold', marginLeft: 5 }
});
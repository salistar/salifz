import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import settingsStore from '../../stores/settingsStore';
import { COLORS } from '../../config';

const LANGUAGES = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
];

const RECITERS = [
  { id: 'mishary', name: 'Mishary Alafasy', nameAr: 'مشاري العفاسي' },
  { id: 'sudais', name: 'Abdul Rahman Al-Sudais', nameAr: 'عبدالرحمن السديس' },
  { id: 'husary', name: 'Mahmoud Al-Husary', nameAr: 'محمود الحصري' }
];

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  rtl: boolean;
}

interface ThemeOption {
  id: string;
  label: string;
  icon: string;
}

interface ReciterOption {
  id: string;
  name: string;
  nameAr: string;
}

export default function SettingsScreen({ navigation }: any) {
  const { theme, language, reciter, setTheme, setLanguage, setReciter } = settingsStore();
  const { user, updateUser } = useAuthStore();

  const [notifications, setNotifications] = useState({
    dailyReminder: user?.profile?.notificationsEnabled ?? true,
    streakReminder: true,
    leagueUpdates: true,
    friendActivity: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications({ ...notifications, [key]: value });
    if (key === 'dailyReminder') {
      updateUser({
        profile: {
          ...user?.profile,
          notificationsEnabled: value
        }
      } as any);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(langCode as 'ar' | 'en' | 'fr');
  };

  const handleThemeChange = (newTheme: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(newTheme as 'light' | 'dark' | 'auto');
  };

  const handleReciterChange = (reciterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (setReciter as (id: string) => void)(reciterId);
  };

  const getActiveStyle = (isActive: boolean, activeStyle: ViewStyle): ViewStyle | undefined => {
    return isActive ? activeStyle : undefined;
  };

  const getCurrentReciterId = (): string => {
    if (typeof reciter === 'string') return reciter;
    if (reciter && typeof reciter === 'object' && 'id' in reciter) return (reciter as any).id;
    return 'mishary';
  };

  const currentReciterId = getCurrentReciterId();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#607D8B', '#455A64']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ الإعدادات</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 اللغة</Text>
          <View style={styles.optionsRow}>
            {LANGUAGES.map((lang: LanguageOption) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.optionButton,
                  getActiveStyle(language === lang.code, styles.optionButtonActive)
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.optionText,
                  language === lang.code && styles.optionTextActive
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 المظهر</Text>
          <View style={styles.optionsRow}>
            {([
              { id: 'light', label: 'فاتح', icon: '☀️' },
              { id: 'dark', label: 'داكن', icon: '🌙' },
              { id: 'auto', label: 'تلقائي', icon: '🔄' }
            ] as ThemeOption[]).map((themeOption: ThemeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={[
                  styles.optionButton,
                  getActiveStyle(theme === themeOption.id, styles.optionButtonActive)
                ]}
                onPress={() => handleThemeChange(themeOption.id)}
              >
                <Text style={styles.optionIcon}>{themeOption.icon}</Text>
                <Text style={[
                  styles.optionText,
                  theme === themeOption.id && styles.optionTextActive
                ]}>
                  {themeOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎧 القارئ</Text>
          {RECITERS.map((reciterOption: ReciterOption) => (
            <TouchableOpacity
              key={reciterOption.id}
              style={[
                styles.reciterItem,
                getActiveStyle(currentReciterId === reciterOption.id, styles.reciterItemActive)
              ]}
              onPress={() => handleReciterChange(reciterOption.id)}
            >
              <View>
                <Text style={styles.reciterName}>{reciterOption.nameAr}</Text>
                <Text style={styles.reciterNameEn}>{reciterOption.name}</Text>
              </View>
              {currentReciterId === reciterOption.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 الإشعارات</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>تذكير يومي</Text>
              <Switch
                value={notifications.dailyReminder}
                onValueChange={(value) => handleNotificationChange('dailyReminder', value)}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary + '80' }}
                thumbColor={notifications.dailyReminder ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>تذكير السلسلة</Text>
              <Switch
                value={notifications.streakReminder}
                onValueChange={(value) => handleNotificationChange('streakReminder', value)}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary + '80' }}
                thumbColor={notifications.streakReminder ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>تحديثات الدوري</Text>
              <Switch
                value={notifications.leagueUpdates}
                onValueChange={(value) => handleNotificationChange('leagueUpdates', value)}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary + '80' }}
                thumbColor={notifications.leagueUpdates ? COLORS.primary : '#f4f3f4'}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>نشاط الأصدقاء</Text>
              <Switch
                value={notifications.friendActivity}
                onValueChange={(value) => handleNotificationChange('friendActivity', value)}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary + '80' }}
                thumbColor={notifications.friendActivity ? COLORS.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 الحساب</Text>
          <TouchableOpacity style={styles.accountItem}>
            <Text style={styles.accountIcon}>✏️</Text>
            <Text style={styles.accountLabel}>تعديل الملف الشخصي</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountItem}>
            <Text style={styles.accountIcon}>🔒</Text>
            <Text style={styles.accountLabel}>تغيير كلمة المرور</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountItem}>
            <Text style={styles.accountIcon}>⭐</Text>
            <Text style={styles.accountLabel}>الاشتراك</Text>
            <Text style={styles.subscriptionBadge}>{user?.subscription?.plan || 'مجاني'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountItem, styles.dangerItem]}>
            <Text style={styles.accountIcon}>🗑️</Text>
            <Text style={styles.dangerLabel}>حذف الحساب</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Salifz v3.0.0</Text>
          <Text style={styles.footerCopyright}>© 2024 Salifz. جميع الحقوق محفوظة</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#fff', fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  optionButton: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#f5f5f5', marginHorizontal: 5 },
  optionButtonActive: { backgroundColor: COLORS.primary + '20', borderWidth: 2, borderColor: COLORS.primary },
  optionFlag: { fontSize: 24, marginBottom: 5 },
  optionIcon: { fontSize: 24, marginBottom: 5 },
  optionText: { color: '#666', fontSize: 12 },
  optionTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  reciterItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 10 },
  reciterItemActive: { backgroundColor: COLORS.primary + '20', borderWidth: 2, borderColor: COLORS.primary },
  reciterName: { fontSize: 16, fontWeight: '600', color: '#333' },
  reciterNameEn: { color: '#666', fontSize: 12, marginTop: 2 },
  checkmark: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' },
  settingsList: {},
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingLabel: { fontSize: 16, color: '#333' },
  accountItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  accountIcon: { fontSize: 20, marginRight: 15 },
  accountLabel: { flex: 1, fontSize: 16, color: '#333' },
  accountArrow: { fontSize: 20, color: '#ccc' },
  subscriptionBadge: { backgroundColor: '#E8F5E9', color: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  dangerItem: { borderBottomWidth: 0 },
  dangerLabel: { flex: 1, fontSize: 16, color: '#F44336' },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: '#999', fontSize: 14 },
  footerCopyright: { color: '#ccc', fontSize: 12, marginTop: 5 }
});
/**
 * ============================================
 * 📱 SettingsScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import settingsStore from '../../stores/settingsStore';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t, changeLanguage } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[SettingsScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

// ✅ Les noms de langues restent dans leur langue native (convention UX standard)
const LANGUAGES = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
];

// ✅ Les noms de récitateurs restent en arabe/anglais (noms propres)
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
  labelKey: string; // ✅ Clé i18n
  icon: string;
}

interface ReciterOption {
  id: string;
  name: string;
  nameAr: string;
}

// ✅ Options de thème avec clés i18n
const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', labelKey: 'settings.theme.light', icon: '☀️' },
  { id: 'dark', labelKey: 'settings.theme.dark', icon: '🌙' },
  { id: 'auto', labelKey: 'settings.theme.auto', icon: '🔄' }
];

export default function SettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { theme, language, reciter, setTheme, setLanguage, setReciter } = settingsStore();
  const { user, updateUser } = useAuthStore();

  const [notifications, setNotifications] = useState({
    dailyReminder: user?.profile?.notificationsEnabled ?? true,
    streakReminder: true,
    leagueUpdates: true,
    friendActivity: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    console.log(`${LOG_PREFIX} 🔔 Notification changed: ${key} = ${value}`);
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

  const handleLanguageChange = async (langCode: string) => {
    console.log(`${LOG_PREFIX} 🌐 Language changing to: ${langCode}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(langCode as 'ar' | 'en' | 'fr');
    // ✅ Changer aussi la langue i18n
    await changeLanguage(langCode);
    console.log(`${LOG_PREFIX} ✅ Language changed to: ${langCode}`);
  };

  const handleThemeChange = (newTheme: string) => {
    console.log(`${LOG_PREFIX} 🎨 Theme changing to: ${newTheme}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(newTheme as 'light' | 'dark' | 'auto');
  };

  const handleReciterChange = (reciterId: string) => {
    console.log(`${LOG_PREFIX} 🎧 Reciter changing to: ${reciterId}`);
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
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => {
          console.log(`${LOG_PREFIX} ◀️ Back button pressed`);
          navigation.goBack();
        }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {/* ✅ AVANT: '⚙️ الإعدادات' */}
        <Text style={styles.headerTitle}>⚙️ {t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Language Section */}
        <View style={styles.section}>
          {/* ✅ AVANT: '🌐 اللغة' */}
          <Text style={styles.sectionTitle}>🌐 {t('settings.language')}</Text>
          <View style={styles.optionsRow}>
            {LANGUAGES.map((lang: LanguageOption) => (
              <TouchableOpacity accessible accessibilityRole="button"
                key={lang.code}
                style={[
                  styles.optionButton,
                  getActiveStyle(language === lang.code, styles.optionButtonActive)
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                {/* Les noms de langues restent dans leur langue native */}
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

        {/* Theme Section */}
        <View style={styles.section}>
          {/* ✅ AVANT: '🎨 المظهر' */}
          <Text style={styles.sectionTitle}>🎨 {t('settings.appearance')}</Text>
          <View style={styles.optionsRow}>
            {THEME_OPTIONS.map((themeOption: ThemeOption) => (
              <TouchableOpacity accessible accessibilityRole="button"
                key={themeOption.id}
                style={[
                  styles.optionButton,
                  getActiveStyle(theme === themeOption.id, styles.optionButtonActive)
                ]}
                onPress={() => handleThemeChange(themeOption.id)}
              >
                <Text style={styles.optionIcon}>{themeOption.icon}</Text>
                {/* ✅ AVANT: themeOption.label hardcodé */}
                <Text style={[
                  styles.optionText,
                  theme === themeOption.id && styles.optionTextActive
                ]}>
                  {t(themeOption.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reciter Section */}
        <View style={styles.section}>
          {/* ✅ AVANT: '🎧 القارئ' */}
          <Text style={styles.sectionTitle}>🎧 {t('settings.reciter')}</Text>
          {RECITERS.map((reciterOption: ReciterOption) => (
            <TouchableOpacity accessible accessibilityRole="button"
              key={reciterOption.id}
              style={[
                styles.reciterItem,
                getActiveStyle(currentReciterId === reciterOption.id, styles.reciterItemActive)
              ]}
              onPress={() => handleReciterChange(reciterOption.id)}
            >
              <View>
                {/* Les noms de récitateurs sont des noms propres - restent inchangés */}
                <Text style={styles.reciterName}>{reciterOption.nameAr}</Text>
                <Text style={styles.reciterNameEn}>{reciterOption.name}</Text>
              </View>
              {currentReciterId === reciterOption.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          {/* ✅ AVANT: '🔔 الإشعارات' */}
          <Text style={styles.sectionTitle}>🔔 {t('settings.notifications.title')}</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              {/* ✅ AVANT: 'تذكير يومي' */}
              <Text style={styles.settingLabel}>{t('settings.notifications.dailyReminder')}</Text>
              <Switch
                value={notifications.dailyReminder}
                onValueChange={(value) => handleNotificationChange('dailyReminder', value)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notifications.dailyReminder ? colors.primary : colors.backgroundAlt}
              />
            </View>
            <View style={styles.settingItem}>
              {/* ✅ AVANT: 'تذكير السلسلة' */}
              <Text style={styles.settingLabel}>{t('settings.notifications.streakReminder')}</Text>
              <Switch
                value={notifications.streakReminder}
                onValueChange={(value) => handleNotificationChange('streakReminder', value)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notifications.streakReminder ? colors.primary : colors.backgroundAlt}
              />
            </View>
            <View style={styles.settingItem}>
              {/* ✅ AVANT: 'تحديثات الدوري' */}
              <Text style={styles.settingLabel}>{t('settings.notifications.leagueUpdates')}</Text>
              <Switch
                value={notifications.leagueUpdates}
                onValueChange={(value) => handleNotificationChange('leagueUpdates', value)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notifications.leagueUpdates ? colors.primary : colors.backgroundAlt}
              />
            </View>
            <View style={styles.settingItem}>
              {/* ✅ AVANT: 'نشاط الأصدقاء' */}
              <Text style={styles.settingLabel}>{t('settings.notifications.friendActivity')}</Text>
              <Switch
                value={notifications.friendActivity}
                onValueChange={(value) => handleNotificationChange('friendActivity', value)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notifications.friendActivity ? colors.primary : colors.backgroundAlt}
              />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          {/* ✅ AVANT: '👤 الحساب' */}
          <Text style={styles.sectionTitle}>👤 {t('settings.account.title')}</Text>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.accountItem} onPress={() => {
            console.log(`${LOG_PREFIX} 👆 Edit profile pressed`);
          }}>
            <Text style={styles.accountIcon}>✏️</Text>
            {/* ✅ AVANT: 'تعديل الملف الشخصي' */}
            <Text style={styles.accountLabel}>{t('settings.account.editProfile')}</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.accountItem} onPress={() => {
            console.log(`${LOG_PREFIX} 👆 Change password pressed`);
          }}>
            <Text style={styles.accountIcon}>🔒</Text>
            {/* ✅ AVANT: 'تغيير كلمة المرور' */}
            <Text style={styles.accountLabel}>{t('settings.account.changePassword')}</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.accountItem} onPress={() => {
            console.log(`${LOG_PREFIX} 👆 Subscription pressed`);
          }}>
            <Text style={styles.accountIcon}>⭐</Text>
            {/* ✅ AVANT: 'الاشتراك' */}
            <Text style={styles.accountLabel}>{t('settings.account.subscription')}</Text>
            {/* ✅ AVANT: 'مجاني' */}
            <Text style={styles.subscriptionBadge}>
              {user?.subscription?.plan || t('settings.account.free')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={[styles.accountItem, styles.dangerItem]} onPress={() => {
            console.log(`${LOG_PREFIX} 👆 Delete account pressed`);
          }}>
            <Text style={styles.accountIcon}>🗑️</Text>
            {/* ✅ AVANT: 'حذف الحساب' */}
            <Text style={styles.dangerLabel}>{t('settings.account.deleteAccount')}</Text>
            <Text style={styles.accountArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Salifz v3.0.0</Text>
          {/* ✅ AVANT: '© 2024 Salifz. جميع الحقوق محفوظة' */}
          <Text style={styles.footerCopyright}>{t('settings.footer.copyright')}</Text>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: c.onDeep, fontSize: 24 },
  headerTitle: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { backgroundColor: c.surface, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  optionButton: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: c.background, marginHorizontal: 5 },
  optionButtonActive: { backgroundColor: c.primary + '20', borderWidth: 2, borderColor: c.primary },
  optionFlag: { fontSize: 24, marginBottom: 5 },
  optionIcon: { fontSize: 24, marginBottom: 5 },
  optionText: { color: c.textSecondary, fontSize: 12 },
  optionTextActive: { color: c.primary, fontWeight: 'bold' },
  reciterItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, backgroundColor: c.background, marginBottom: 10 },
  reciterItemActive: { backgroundColor: c.primary + '20', borderWidth: 2, borderColor: c.primary },
  reciterName: { fontSize: 16, fontWeight: '600', color: c.text },
  reciterNameEn: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  checkmark: { color: c.primary, fontSize: 20, fontWeight: 'bold' },
  settingsList: {},
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  settingLabel: { fontSize: 16, color: c.text },
  accountItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  accountIcon: { fontSize: 20, marginRight: 15 },
  accountLabel: { flex: 1, fontSize: 16, color: c.text },
  accountArrow: { fontSize: 20, color: c.textMuted },
  subscriptionBadge: { backgroundColor: c.primarySoft, color: c.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  dangerItem: { borderBottomWidth: 0 },
  dangerLabel: { flex: 1, fontSize: 16, color: c.error },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: c.textMuted, fontSize: 14 },
  footerCopyright: { color: c.textMuted, fontSize: 12, marginTop: 5 }
});
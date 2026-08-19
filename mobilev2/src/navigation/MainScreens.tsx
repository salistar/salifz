/**
 * Legacy Screens - Salifz
 * ✅ FIXED: Safe access to undefined properties
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, ThemeColors, useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { t } from '../services/i18n';
import { useAuthStore } from '../stores/authStore';

// ============================================
// LEARN SCREEN
// ============================================

const SURAHS = [
  { number: 114, name: 'الناس', englishName: 'An-Nas', ayahs: 6, progress: 100 },
  { number: 113, name: 'الفلق', englishName: 'Al-Falaq', ayahs: 5, progress: 100 },
  { number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', ayahs: 4, progress: 100 },
  { number: 111, name: 'المسد', englishName: 'Al-Masad', ayahs: 5, progress: 60 },
  { number: 110, name: 'النصر', englishName: 'An-Nasr', ayahs: 3, progress: 0 },
  { number: 109, name: 'الكافرون', englishName: 'Al-Kafirun', ayahs: 6, progress: 0 },
  { number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', ayahs: 3, progress: 0 },
];

export function LearnScreen() {
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('learn.title')}</Text>
        <Text style={styles.subtitle}>{t('learn.juzAmma')}</Text>
      </View>
      
      <FlatList
        data={SURAHS}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity accessible accessibilityRole="button" style={styles.surahCard}>
            <View style={styles.surahNumber}>
              <Text style={styles.surahNumberText}>{item.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <Text style={styles.surahName}>{item.name}</Text>
              <Text style={styles.surahMeta}>{item.englishName} • {item.ayahs} {t('learn.verses')}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
            </View>
            <Text style={styles.statusIcon}>
              {item.progress === 100 ? '✅' : item.progress > 0 ? `${item.progress}%` : '▶️'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// ============================================
// LEADERBOARD SCREEN
// ============================================

const LEADERBOARD = [
  { rank: 1, name: 'أحمد محمد', xp: 12500, avatar: '👨' },
  { rank: 2, name: 'فاطمة علي', xp: 11200, avatar: '👩' },
  { rank: 3, name: 'عمر حسن', xp: 10800, avatar: '👨' },
  { rank: 4, name: 'مريم سعيد', xp: 9500, avatar: '👩' },
  { rank: 5, name: 'يوسف أحمد', xp: 8900, avatar: '👨' },
];

export function LeaderboardScreen() {
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[themeColors.warning, themeColors.warningStrong]} style={styles.leagueHeader}>
        <Text style={styles.leagueIcon}>🏆</Text>
        <Text style={styles.leagueTitle}>{t('leaderboard.gold')}</Text>
        <Text style={styles.leagueSubtitle}>3 {t('leaderboard.daysLeft')}</Text>
      </LinearGradient>

      <View style={styles.tabs}>
        <TouchableOpacity accessible accessibilityRole="button" style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>{t('leaderboard.league')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.tab}>
          <Text style={styles.tabText}>{t('leaderboard.friends')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.tab}>
          <Text style={styles.tabText}>{t('leaderboard.global')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={LEADERBOARD}
        keyExtractor={(item) => item.rank.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.leaderItem}>
            <Text style={styles.rankText}>#{item.rank}</Text>
            <Text style={styles.avatarIcon}>{item.avatar}</Text>
            <View style={styles.leaderInfo}>
              <Text style={styles.leaderName}>{item.name}</Text>
              <Text style={styles.leaderXP}>{item.xp.toLocaleString()} XP</Text>
            </View>
            {item.rank <= 3 && (
              <Text style={styles.medalIcon}>
                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ============================================
// PROFILE SCREEN
// ============================================

export function ProfileScreen() {
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { user, logout } = useAuthStore();
  
  // ✅ FIXED: Safe access with fallback values
  const displayName = user?.displayName ?? 'مستخدم';
  const username = user?.username ?? 'user';
  const level = user?.gamification?.level ?? 1;
  const currentStreak = user?.gamification?.currentStreak ?? 0;
  const totalVersesMemorized = user?.quranProgress?.totalVersesMemorized ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileUsername}>@{username}</Text>
        
        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatValue}>{level}</Text>
            <Text style={styles.profileStatLabel}>{t('home.level')}</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatValue}>{currentStreak}</Text>
            <Text style={styles.profileStatLabel}>🔥</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatValue}>{totalVersesMemorized}</Text>
            <Text style={styles.profileStatLabel}>{t('home.ayah')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsList}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.settingItem}>
          <Text style={styles.settingIcon}>⚙️</Text>
          <Text style={styles.settingText}>{t('profile.settings')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.settingItem}>
          <Text style={styles.settingIcon}>🎯</Text>
          <Text style={styles.settingText}>{t('profile.dailyGoal')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.settingItem}>
          <Text style={styles.settingIcon}>🌐</Text>
          <Text style={styles.settingText}>{t('profile.language')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.settingItem}>
          <Text style={styles.settingIcon}>⭐</Text>
          <Text style={styles.settingText}>{t('profile.premium')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessible accessibilityRole="button" style={[styles.settingItem, styles.logoutItem]} onPress={logout}>
          <Text style={styles.settingIcon}>🚪</Text>
          <Text style={[styles.settingText, styles.logoutText]}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { padding: spacing.lg, backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: '700', color: c.text },
  subtitle: { fontSize: 14, color: c.textMuted, marginTop: 4 },
  list: { padding: spacing.md },
  
  // Surah Card
  surahCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: spacing.md, borderRadius: 12, marginBottom: 8 },
  surahNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.primarySoft, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  surahNumberText: { color: c.primaryDark, fontWeight: '600' },
  surahInfo: { flex: 1 },
  surahName: { fontSize: 18, fontWeight: '600', color: c.text },
  surahMeta: { fontSize: 12, color: c.textMuted, marginVertical: 4 },
  progressBar: { height: 4, backgroundColor: c.divider, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 2 },
  statusIcon: { fontSize: 18 },
  
  // League Header
  leagueHeader: { padding: spacing.xl, alignItems: 'center' },
  leagueIcon: { fontSize: 48 },
  leagueTitle: { color: '#FFF', fontSize: 24, fontWeight: '700', marginTop: 8 },
  leagueSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: c.divider },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { color: c.textMuted },
  tabTextActive: { color: c.primary, fontWeight: '600' },
  
  // Leaderboard
  leaderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: spacing.md, borderRadius: 12, marginBottom: 8 },
  rankText: { width: 40, fontSize: 16, fontWeight: '600', color: c.textSecondary },
  avatarIcon: { fontSize: 32, marginHorizontal: 8 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 16, fontWeight: '600', color: c.text },
  leaderXP: { fontSize: 14, color: c.textMuted },
  medalIcon: { fontSize: 24 },
  
  // Profile
  profileHeader: { alignItems: 'center', padding: spacing.xl, backgroundColor: '#FFF' },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.primarySoft, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: 40 },
  profileName: { fontSize: 24, fontWeight: '700', color: c.text, marginTop: 12 },
  profileUsername: { fontSize: 14, color: c.textMuted },
  profileStats: { flexDirection: 'row', marginTop: spacing.lg },
  profileStat: { alignItems: 'center', marginHorizontal: spacing.lg },
  profileStatValue: { fontSize: 24, fontWeight: '700', color: c.primary },
  profileStatLabel: { fontSize: 12, color: c.textMuted, marginTop: 4 },
  
  // Settings
  settingsList: { padding: spacing.lg },
  settingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: spacing.md, borderRadius: 12, marginBottom: 8 },
  settingIcon: { fontSize: 20, marginLeft: 12 },
  settingText: { flex: 1, fontSize: 16, color: c.textSecondary },
  logoutItem: { marginTop: spacing.lg },
  logoutText: { color: c.error },
});
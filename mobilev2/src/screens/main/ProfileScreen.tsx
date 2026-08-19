/**
 * ============================================
 * 📱 ProfileScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useGamificationStore } from '../../stores';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import {
  IconeReglages,
  IconeStatistiques,
  IconeAmis,
  IconeRecompense,
  IconeNotifications,
  IconeVersetDuJour,
  IconeSerie,
  IconeGemmes,
  IconeCoeurs,
} from '../../components/common/Icones';

const LOG_PREFIX = '[ProfileScreen.tsx]';

// Define LEAGUES with i18n keys
interface League {
  id: string;
  nameKey: string;
  nameEn: string;
  icon: string;
  color: string;
  minXP: number;
}

const LEAGUES: League[] = [
  { id: 'bronze', nameKey: 'profile.leagues.bronze', nameEn: 'Bronze', icon: '🥉', color: fixedColors.bronze, minXP: 0 },
  { id: 'silver', nameKey: 'profile.leagues.silver', nameEn: 'Silver', icon: '🥈', color: fixedColors.silver, minXP: 1000 },
  { id: 'gold', nameKey: 'profile.leagues.gold', nameEn: 'Gold', icon: '🥇', color: fixedColors.gold, minXP: 5000 },
  { id: 'platinum', nameKey: 'profile.leagues.platinum', nameEn: 'Platinum', icon: '💎', color: fixedColors.silver, minXP: 15000 },
  { id: 'diamond', nameKey: 'profile.leagues.diamond', nameEn: 'Diamond', icon: '💠', color: fixedColors.diamond, minXP: 30000 },
  { id: 'master', nameKey: 'profile.leagues.master', nameEn: 'Master', icon: '👑', color: fixedColors.master, minXP: 50000 },
];

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);

  const { user, logout } = useAuthStore();
  const { totalXP, level, gems, coins, hearts, streak, league } = useGamificationStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  console.log(`${LOG_PREFIX} 👤 User: ${user?.username}, Level: ${level}, XP: ${totalXP}`);

  const currentLeague = LEAGUES.find((l: League) => l.id === league) || LEAGUES[0];

  // Get memorization stats from user.quranProgress
  const totalAyahsMemorized = user?.quranProgress?.totalVersesMemorized || 0;
  const totalSurahsCompleted = user?.quranProgress?.totalSurahCompleted || 0;
  const totalJuzCompleted = user?.quranProgress?.totalJuzCompleted || 0;

  console.log(`${LOG_PREFIX} 📖 Memorization: ${totalAyahsMemorized} ayahs, ${totalSurahsCompleted} surahs, ${totalJuzCompleted} juz`);

  const handleLogout = () => {
    console.log(`${LOG_PREFIX} 🚪 Logout button pressed`);
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logoutButton'),
          style: 'destructive',
          onPress: async () => {
            console.log(`${LOG_PREFIX} ✅ Logout confirmed, logging out...`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
            console.log(`${LOG_PREFIX} ✅ Logout complete`);
          }
        }
      ]
    );
  };

  const menuItems = [
    { icon: '⚙️', labelKey: 'profile.menu.settings', screen: 'Settings' },
    { icon: '📊', labelKey: 'profile.menu.insights', screen: 'Insights' },
    { icon: '👥', labelKey: 'profile.menu.friends', screen: 'Friends' },
    { icon: '🏆', labelKey: 'profile.menu.achievements', screen: 'Achievements' },
    { icon: '🔔', labelKey: 'profile.menu.notifications', screen: 'Notifications' },
    { icon: '❓', labelKey: 'profile.menu.help', screen: 'Help' }
  ];

  const stats = [
    { icon: '🔥', labelKey: 'profile.stats.streak', value: streak },
    { icon: '⚡', labelKey: 'profile.stats.xp', value: totalXP },
    { icon: '💎', labelKey: 'profile.stats.gems', value: gems },
    { icon: '🪙', labelKey: 'profile.stats.coins', value: coins },
    { icon: '❤️', labelKey: 'profile.stats.hearts', value: hearts },
    { icon: currentLeague.icon, labelKey: 'profile.stats.league', value: t(currentLeague.nameKey) }
  ];

  const handleMenuItemPress = (item: any) => {
    console.log(`${LOG_PREFIX} 📱 Menu item pressed: ${item.screen}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(item.screen);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.username}>{user?.username || t('profile.defaultUsername')}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{t('profile.levelX', { level })}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{t(stat.labelKey)}</Text>
            </View>
          ))}
        </View>

        {/* Memorization Card */}
        <View style={styles.memorizationCard}>
          <Text style={styles.cardTitle}>{t('profile.memorizationStats')}</Text>
          <View style={styles.memorizationStats}>
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalAyahsMemorized}</Text>
              <Text style={styles.memStatLabel}>{t('profile.ayahsMemorized')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalSurahsCompleted}</Text>
              <Text style={styles.memStatLabel}>{t('profile.surahsCompleted')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalJuzCompleted}</Text>
              <Text style={styles.memStatLabel}>{t('profile.juz')}</Text>
            </View>
          </View>
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsPreview}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.cardTitle}>{t('profile.achievements')}</Text>
            <TouchableOpacity accessible accessibilityRole="button"
              onPress={() => {
                console.log(`${LOG_PREFIX} 🏆 See all achievements pressed`);
                navigation.navigate('Achievements');
              }}
            >
              <Text style={styles.seeAllText}>{t('profile.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsList}>
            {['🔥', '📖', '⭐', '🏆', '💎'].map((emoji, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity accessible accessibilityRole="button"
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity accessible accessibilityRole="button" style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarEmoji: { fontSize: 50 },
  username: { color: c.onDeep, fontSize: 24, fontWeight: 'bold' },
  email: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  levelText: { color: c.onDeep, fontWeight: 'bold' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '31%', backgroundColor: c.surface, borderRadius: 15, padding: 15, alignItems: 'center', marginBottom: 10, elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: c.text },
  statLabel: { fontSize: 10, color: c.textSecondary, marginTop: 2 },
  memorizationCard: { backgroundColor: c.surface, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  memorizationStats: { flexDirection: 'row', justifyContent: 'space-around' },
  memStatItem: { alignItems: 'center' },
  memStatValue: { fontSize: 28, fontWeight: 'bold', color: c.primary },
  memStatLabel: { color: c.textSecondary, fontSize: 12, marginTop: 5 },
  memStatDivider: { width: 1, backgroundColor: c.border },
  achievementsPreview: { backgroundColor: c.surface, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  achievementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { color: c.primary, fontWeight: '600' },
  achievementsList: { flexDirection: 'row', justifyContent: 'space-around' },
  achievementItem: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' },
  achievementEmoji: { fontSize: 24 },
  menuSection: { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  menuIcon: { fontSize: 22, marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 16, color: c.text },
  menuArrow: { fontSize: 20, color: c.textMuted },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.errorSoft, padding: 18, borderRadius: 15 },
  logoutIcon: { fontSize: 20, marginRight: 10 },
  logoutText: { color: c.error, fontSize: 16, fontWeight: '600' }
});
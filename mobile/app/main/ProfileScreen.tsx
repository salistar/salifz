import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore, useGamificationStore } from '../../stores';
import { COLORS } from '../../config';

// Define LEAGUES locally
interface League {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  minXP: number;
}

const LEAGUES: League[] = [
  { id: 'bronze', name: 'البرونزي', nameEn: 'Bronze', icon: '🥉', color: '#CD7F32', minXP: 0 },
  { id: 'silver', name: 'الفضي', nameEn: 'Silver', icon: '🥈', color: '#C0C0C0', minXP: 1000 },
  { id: 'gold', name: 'الذهبي', nameEn: 'Gold', icon: '🥇', color: '#FFD700', minXP: 5000 },
  { id: 'platinum', name: 'البلاتيني', nameEn: 'Platinum', icon: '💎', color: '#E5E4E2', minXP: 15000 },
  { id: 'diamond', name: 'الماسي', nameEn: 'Diamond', icon: '💠', color: '#B9F2FF', minXP: 30000 },
  { id: 'master', name: 'الأسطوري', nameEn: 'Master', icon: '👑', color: '#9B59B6', minXP: 50000 },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { totalXP, level, gems, coins, hearts, streak, league } = useGamificationStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentLeague = LEAGUES.find((l: League) => l.id === league) || LEAGUES[0];

  // Get memorization stats from user.quranProgress
  const totalAyahsMemorized = user?.quranProgress?.totalVersesMemorized || 0;
  const totalSurahsCompleted = user?.quranProgress?.totalSurahCompleted || 0;
  const totalJuzCompleted = user?.quranProgress?.totalJuzCompleted || 0;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logout();
      }}
    ]);
  };

  const menuItems = [
    { icon: '⚙️', label: 'الإعدادات', screen: 'Settings' },
    { icon: '📊', label: 'الإحصائيات', screen: 'Insights' },
    { icon: '👥', label: 'الأصدقاء', screen: 'Friends' },
    { icon: '🏆', label: 'الإنجازات', screen: 'Achievements' },
    { icon: '🔔', label: 'الإشعارات', screen: 'Notifications' },
    { icon: '❓', label: 'المساعدة', screen: 'Help' }
  ];

  const stats = [
    { icon: '🔥', label: 'السلسلة', value: streak },
    { icon: '⚡', label: 'XP', value: totalXP },
    { icon: '💎', label: 'جواهر', value: gems },
    { icon: '🪙', label: 'عملات', value: coins },
    { icon: '❤️', label: 'قلوب', value: hearts },
    { icon: currentLeague.icon, label: 'الدوري', value: currentLeague.name }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'مستخدم'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>المستوى {level}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.memorizationCard}>
          <Text style={styles.cardTitle}>📖 إحصائيات الحفظ</Text>
          <View style={styles.memorizationStats}>
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalAyahsMemorized}</Text>
              <Text style={styles.memStatLabel}>آيات محفوظة</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalSurahsCompleted}</Text>
              <Text style={styles.memStatLabel}>سور مكتملة</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalJuzCompleted}</Text>
              <Text style={styles.memStatLabel}>أجزاء</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsPreview}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.cardTitle}>🏅 الإنجازات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
              <Text style={styles.seeAllText}>عرض الكل</Text>
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

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(item.screen);
              }}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarEmoji: { fontSize: 50 },
  username: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  email: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  levelText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '31%', backgroundColor: '#fff', borderRadius: 15, padding: 15, alignItems: 'center', marginBottom: 10, elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  memorizationCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  memorizationStats: { flexDirection: 'row', justifyContent: 'space-around' },
  memStatItem: { alignItems: 'center' },
  memStatValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  memStatLabel: { color: '#666', fontSize: 12, marginTop: 5 },
  memStatDivider: { width: 1, backgroundColor: '#E0E0E0' },
  achievementsPreview: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  achievementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAllText: { color: COLORS.primary, fontWeight: '600' },
  achievementsList: { flexDirection: 'row', justifyContent: 'space-around' },
  achievementItem: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  achievementEmoji: { fontSize: 24 },
  menuSection: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { fontSize: 22, marginRight: 15 },
  menuLabel: { flex: 1, fontSize: 16, color: '#333' },
  menuArrow: { fontSize: 20, color: '#ccc' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEBEE', padding: 18, borderRadius: 15 },
  logoutIcon: { fontSize: 20, marginRight: 10 },
  logoutText: { color: '#F44336', fontSize: 16, fontWeight: '600' }
});
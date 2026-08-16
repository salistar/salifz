/**
 * ============================================
 * 📱 LeaderboardScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { leaderboardAPI } from '../../services/api';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

// ✅ Constante pour les logs
const LOG_PREFIX = '[LeaderboardScreen.tsx]';

// Define LEAGUES locally with i18n keys
interface League {
  id: string;
  nameKey: string; // ✅ CHANGÉ: clé i18n au lieu de texte
  nameEn: string;
  icon: string;
  color: string;
  minXP: number;
}

// ✅ AVANT: name: 'البرونزي' hardcodé
// ✅ APRÈS: nameKey pour i18n
const LEAGUES: League[] = [
  { id: 'bronze', nameKey: 'leaderboard.leagues.bronze', nameEn: 'Bronze', icon: '🥉', color: '#CD7F32', minXP: 0 },
  { id: 'silver', nameKey: 'leaderboard.leagues.silver', nameEn: 'Silver', icon: '🥈', color: '#C0C0C0', minXP: 1000 },
  { id: 'gold', nameKey: 'leaderboard.leagues.gold', nameEn: 'Gold', icon: '🥇', color: '#FFD700', minXP: 5000 },
  { id: 'platinum', nameKey: 'leaderboard.leagues.platinum', nameEn: 'Platinum', icon: '💎', color: '#E5E4E2', minXP: 15000 },
  { id: 'diamond', nameKey: 'leaderboard.leagues.diamond', nameEn: 'Diamond', icon: '💠', color: '#B9F2FF', minXP: 30000 },
  { id: 'master', nameKey: 'leaderboard.leagues.master', nameEn: 'Master', icon: '👑', color: '#9B59B6', minXP: 50000 },
];

export default function LeaderboardScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('league');
  const [rankings, setRankings] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [currentLeague, setCurrentLeague] = useState<League>(LEAGUES[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Tab changed to "${activeTab}"`);
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD LEADERBOARD START ==========`);
    console.log(`${LOG_PREFIX} 📂 Active tab: ${activeTab}`);
    setLoading(true);
    try {
      let response: any;
      if (activeTab === 'league') {
        console.log(`${LOG_PREFIX} 📤 Calling leaderboardAPI.getLeague()...`);
        response = await leaderboardAPI.getLeague();
      } else if (activeTab === 'global') {
        console.log(`${LOG_PREFIX} 📤 Calling leaderboardAPI.getGlobal()...`);
        response = await leaderboardAPI.getGlobal();
      } else {
        console.log(`${LOG_PREFIX} 📤 Calling leaderboardAPI.getFriends()...`);
        response = await leaderboardAPI.getFriends();
      }
      
      const loadedRankings = response.data?.rankings || response.rankings || [];
      setRankings(loadedRankings);
      setUserRank(response.data?.userRank || response.userRank);
      console.log(`${LOG_PREFIX} ✅ Loaded ${loadedRankings.length} rankings`);
      
      if (response.data?.league || response.league) {
        const leagueId = response.data?.league || response.league;
        const league = LEAGUES.find((l: League) => l.id === leagueId) || LEAGUES[0];
        setCurrentLeague(league);
        console.log(`${LOG_PREFIX} 🏆 Current league: ${leagueId}`);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load leaderboard error:`, error);
      // Mock data
      console.log(`${LOG_PREFIX} 📋 Using mock data...`);
      setRankings([
        { rank: 1, user: { username: 'أحمد', level: 25 }, xp: 2500, streak: 45, isCurrentUser: false },
        { rank: 2, user: { username: 'محمد', level: 22 }, xp: 2350, streak: 38, isCurrentUser: false },
        { rank: 3, user: { username: 'فاطمة', level: 20 }, xp: 2100, streak: 30, isCurrentUser: false },
        { rank: 4, user: { username: 'علي', level: 18 }, xp: 1850, streak: 25, isCurrentUser: false },
        { rank: 5, user: { username: 'سارة', level: 17 }, xp: 1700, streak: 22, isCurrentUser: false },
        { rank: 6, user: { username: 'يوسف', level: 15 }, xp: 1500, streak: 18, isCurrentUser: true },
        { rank: 7, user: { username: 'مريم', level: 14 }, xp: 1350, streak: 15, isCurrentUser: false },
        { rank: 8, user: { username: 'خالد', level: 12 }, xp: 1200, streak: 12, isCurrentUser: false },
        { rank: 9, user: { username: 'نور', level: 10 }, xp: 1000, streak: 10, isCurrentUser: false },
        { rank: 10, user: { username: 'عمر', level: 8 }, xp: 850, streak: 7, isCurrentUser: false }
      ]);
    }
    setLoading(false);
    console.log(`${LOG_PREFIX} 📥 ========== LOAD LEADERBOARD END ==========`);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  // ✅ TABS avec clés i18n
  const tabs = [
    { id: 'league', labelKey: 'leaderboard.tabs.league', icon: '🏆' },
    { id: 'global', labelKey: 'leaderboard.tabs.global', icon: '🌍' },
    { id: 'friends', labelKey: 'leaderboard.tabs.friends', icon: '👥' }
  ];

  const handleTabChange = (tabId: string) => {
    console.log(`${LOG_PREFIX} 📂 Tab changed: ${tabId}`);
    setActiveTab(tabId);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (tab: ${activeTab}, rankings: ${rankings.length})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[currentLeague.color, currentLeague.color + 'CC']} 
        style={styles.header}
      >
        <Text style={styles.leagueIcon}>{currentLeague.icon}</Text>
        {/* ✅ AVANT: {currentLeague.name} hardcodé */}
        <Text style={styles.leagueName}>{t(currentLeague.nameKey)}</Text>
        {/* ✅ AVANT: 'X League' hardcodé */}
        <Text style={styles.leagueNameEn}>{currentLeague.nameEn} {t('leaderboard.league')}</Text>
        {/* ✅ AVANT: 'الـ 5 الأوائل يصعدون • الـ 5 الأخيرين يهبطون' */}
        <Text style={styles.leagueSubtitle}>{t('leaderboard.promotionInfo')}</Text>
        
        <View style={styles.timerContainer}>
          <Text style={styles.timerIcon}>⏱️</Text>
          {/* ✅ AVANT: 'ينتهي خلال: 3 أيام' */}
          <Text style={styles.timerText}>{t('leaderboard.endsIn', { days: 3 })}</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tab, activeTab === tab.id && styles.tabActive]} 
            onPress={() => handleTabChange(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            {/* ✅ AVANT: {tab.label} hardcodé */}
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Podium */}
        {rankings.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.podiumSecond]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[1]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[1]?.xp} XP</Text>
              <View style={styles.podiumBase}><Text style={styles.podiumRank}>2</Text></View>
              <Text style={styles.podiumMedal}>🥈</Text>
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <View style={styles.crownContainer}><Text style={styles.crownEmoji}>👑</Text></View>
              <View style={[styles.podiumAvatar, styles.podiumFirstAvatar]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[0]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[0]?.xp} XP</Text>
              <View style={[styles.podiumBase, styles.podiumBaseFirst]}><Text style={styles.podiumRank}>1</Text></View>
              <Text style={styles.podiumMedal}>🥇</Text>
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.podiumThird]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[2]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[2]?.xp} XP</Text>
              <View style={styles.podiumBase}><Text style={styles.podiumRank}>3</Text></View>
              <Text style={styles.podiumMedal}>🥉</Text>
            </View>
          </View>
        )}

        {/* Zone Indicators */}
        <View style={styles.zoneIndicators}>
          <View style={styles.zoneIndicator}>
            <View style={[styles.zoneDot, { backgroundColor: '#4CAF50' }]} />
            {/* ✅ AVANT: 'منطقة الصعود' */}
            <Text style={styles.zoneText}>{t('leaderboard.promotionZone')}</Text>
          </View>
          <View style={styles.zoneIndicator}>
            <View style={[styles.zoneDot, { backgroundColor: '#F44336' }]} />
            {/* ✅ AVANT: 'منطقة الهبوط' */}
            <Text style={styles.zoneText}>{t('leaderboard.relegationZone')}</Text>
          </View>
        </View>

        {/* Rankings List */}
        {rankings.slice(3).map((item, index) => {
          const actualRank = index + 4;
          const isPromoted = actualRank <= 5;
          const isRelegated = actualRank > rankings.length - 5;
          
          return (
            <View 
              key={index} 
              style={[
                styles.rankItem, 
                item.isCurrentUser && styles.rankItemCurrent,
                isPromoted && styles.rankItemPromoted,
                isRelegated && styles.rankItemRelegated
              ]}
            >
              <View style={styles.rankNumberContainer}>
                {isPromoted && <Text style={styles.arrowUp}>▲</Text>}
                {isRelegated && <Text style={styles.arrowDown}>▼</Text>}
                <Text style={[
                  styles.rankNumber,
                  isPromoted && styles.rankNumberPromoted,
                  isRelegated && styles.rankNumberRelegated
                ]}>
                  {item.rank || actualRank}
                </Text>
              </View>

              <View style={styles.rankAvatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>

              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, item.isCurrentUser && styles.rankNameCurrent]}>
                  {/* ✅ AVANT: '(أنت)' hardcodé */}
                  {item.user?.username} {item.isCurrentUser && `(${t('leaderboard.you')})`}
                </Text>
                {/* ✅ AVANT: 'المستوى X' */}
                <Text style={styles.rankLevel}>{t('leaderboard.levelX', { level: item.user?.level })}</Text>
              </View>

              <View style={styles.rankStats}>
                <Text style={styles.rankXp}>{item.xp} XP</Text>
                <Text style={styles.rankStreak}>🔥 {item.streak}</Text>
              </View>
            </View>
          );
        })}

        {/* Empty State */}
        {rankings.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            {/* ✅ AVANT: 'لا توجد بيانات' */}
            <Text style={styles.emptyTitle}>{t('leaderboard.noData')}</Text>
            {/* ✅ AVANT: 'ابدأ التعلم للظهور في الترتيب!' */}
            <Text style={styles.emptySubtitle}>{t('leaderboard.startLearning')}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* User Rank Bar */}
      {userRank && !rankings.find((r: any) => r.isCurrentUser && r.rank <= 10) && (
        <View style={styles.userRankBar}>
          <Text style={styles.userRankNumber}>#{userRank.rank}</Text>
          <View style={styles.userRankAvatar}>
            <Text style={styles.userRankAvatarEmoji}>👤</Text>
          </View>
          {/* ✅ AVANT: 'أنت' */}
          <Text style={styles.userRankName}>{t('leaderboard.you')}</Text>
          <View style={styles.userRankStats}>
            <Text style={styles.userRankXp}>{userRank.xp} XP</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  leagueIcon: { fontSize: 60 },
  leagueName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 10 },
  leagueNameEn: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  leagueSubtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 12 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  timerIcon: { fontSize: 14, marginRight: 5 },
  timerText: { color: '#fff', fontSize: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -15, borderRadius: 15, padding: 5, elevation: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.primary },
  tabIcon: { fontSize: 16, marginRight: 5 },
  tabLabel: { color: '#666', fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  content: { padding: 20 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 30, paddingTop: 40 },
  podiumItem: { alignItems: 'center', marginHorizontal: 8, width: 90 },
  podiumFirst: { marginBottom: 20 },
  crownContainer: { position: 'absolute', top: -35, zIndex: 10 },
  crownEmoji: { fontSize: 30 },
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  podiumFirstAvatar: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 3, borderColor: '#FFD700' },
  podiumSecond: { borderWidth: 3, borderColor: '#C0C0C0' },
  podiumThird: { borderWidth: 3, borderColor: '#CD7F32' },
  avatarEmoji: { fontSize: 28 },
  podiumName: { fontWeight: 'bold', color: '#333', fontSize: 13, textAlign: 'center' },
  podiumXp: { color: '#666', fontSize: 11, marginTop: 2 },
  podiumBase: { backgroundColor: '#E0E0E0', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
  podiumBaseFirst: { backgroundColor: '#FFD700' },
  podiumRank: { fontWeight: 'bold', color: '#333' },
  podiumMedal: { fontSize: 28, marginTop: 8 },
  zoneIndicators: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  zoneIndicator: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  zoneDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  zoneText: { color: '#666', fontSize: 12 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  rankItemCurrent: { borderWidth: 2, borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  rankItemPromoted: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  rankItemRelegated: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  rankNumberContainer: { width: 40, alignItems: 'center' },
  arrowUp: { color: '#4CAF50', fontSize: 10, marginBottom: -2 },
  arrowDown: { color: '#F44336', fontSize: 10, marginBottom: -2 },
  rankNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  rankNumberPromoted: { color: '#4CAF50' },
  rankNumberRelegated: { color: '#F44336' },
  rankAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankInfo: { flex: 1 },
  rankName: { fontWeight: 'bold', color: '#333', fontSize: 15 },
  rankNameCurrent: { color: COLORS.primary },
  rankLevel: { color: '#666', fontSize: 12, marginTop: 2 },
  rankStats: { alignItems: 'flex-end' },
  rankXp: { fontWeight: 'bold', color: COLORS.primary, fontSize: 14 },
  rankStreak: { color: '#FF6B35', fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySubtitle: { color: '#666', marginTop: 5 },
  userRankBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, padding: 15, paddingBottom: 30, elevation: 10 },
  userRankNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold', width: 50 },
  userRankAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  userRankAvatarEmoji: { fontSize: 20 },
  userRankName: { color: '#fff', fontWeight: '600', flex: 1 },
  userRankStats: { alignItems: 'flex-end' },
  userRankXp: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
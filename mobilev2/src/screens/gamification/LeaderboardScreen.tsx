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
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar, MihrabArch } from '../../components/common/Ornements';
import { IconeClassement, IconeHalaqat, IconeAmis, IconeSerie, IconeProfil } from '../../components/common/Icones';

const LOG_PREFIX = '[LeaderboardScreen.tsx]';

// Define LEAGUES locally with i18n keys
/**
 * L'initiale du nom en guise d'avatar. Un emoji humain attribue a la personne
 * un genre et un age qu'elle n'a pas choisis ; l'initiale identifie sans rien
 * inventer. Cinquieme ecran ou cette correction s'applique.
 */
const initiale = (personne: any): string =>
  String(personne?.displayName || personne?.username || '?').charAt(0).toUpperCase();

interface League {
  id: string;
  nameKey: string;
  nameEn: string;
  color: string;
  minXP: number;
}

const LEAGUES: League[] = [
  { id: 'bronze', nameKey: 'leaderboard.leagues.bronze', nameEn: 'Bronze', color: fixedColors.bronze, minXP: 0 },
  { id: 'silver', nameKey: 'leaderboard.leagues.silver', nameEn: 'Silver', color: fixedColors.silver, minXP: 1000 },
  { id: 'gold', nameKey: 'leaderboard.leagues.gold', nameEn: 'Gold', color: fixedColors.gold, minXP: 5000 },
  { id: 'platinum', nameKey: 'leaderboard.leagues.platinum', nameEn: 'Platinum', color: fixedColors.silver, minXP: 15000 },
  { id: 'diamond', nameKey: 'leaderboard.leagues.diamond', nameEn: 'Diamond', color: fixedColors.diamond, minXP: 30000 },
  { id: 'master', nameKey: 'leaderboard.leagues.master', nameEn: 'Master', color: fixedColors.master, minXP: 50000 },
];

export default function LeaderboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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

  const tabs = [
    { id: 'league', labelKey: 'leaderboard.tabs.league', Icone: IconeClassement },
    { id: 'global', labelKey: 'leaderboard.tabs.global', Icone: IconeHalaqat },
    { id: 'friends', labelKey: 'leaderboard.tabs.friends', Icone: IconeAmis }
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
        <HizbStar size={40} quarters={4} color={currentLeague.color} />
        <Text style={styles.leagueName}>{t(currentLeague.nameKey)}</Text>
        <Text style={styles.leagueNameEn}>{currentLeague.nameEn} {t('leaderboard.league')}</Text>
        <Text style={styles.leagueSubtitle}>{t('leaderboard.promotionInfo')}</Text>

        <View style={styles.timerContainer}>
          <IconeSerie size={14} color={colors.textSecondary} />
          <Text style={styles.timerText}>{t('leaderboard.endsIn', { days: 3 })}</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity accessible accessibilityRole="button"
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => handleTabChange(tab.id)}
          >
            <View style={styles.tabIcon}>
              <tab.Icone size={17} color={activeTab === tab.id ? colors.primary : colors.textMuted} />
            </View>
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
                <Text style={styles.avatarEmoji}>{initiale(rankings[1]?.user)}</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[1]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[1]?.xp} XP</Text>
              <View style={styles.podiumBase}><Text style={styles.podiumRank}>2</Text></View>
              <HizbStar size={20} quarters={4} color={fixedColors.silver} />
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <View style={styles.crownContainer}><HizbStar size={18} quarters={4} color={fixedColors.gold} /></View>
              <View style={[styles.podiumAvatar, styles.podiumFirstAvatar]}>
                <Text style={styles.avatarEmoji}>{initiale(rankings[0]?.user)}</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[0]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[0]?.xp} XP</Text>
              <View style={[styles.podiumBase, styles.podiumBaseFirst]}><Text style={styles.podiumRank}>1</Text></View>
              <HizbStar size={24} quarters={4} color={fixedColors.gold} />
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, styles.podiumThird]}>
                <Text style={styles.avatarEmoji}>{initiale(rankings[2]?.user)}</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[2]?.user?.username}</Text>
              <Text style={styles.podiumXp}>{rankings[2]?.xp} XP</Text>
              <View style={styles.podiumBase}><Text style={styles.podiumRank}>3</Text></View>
              <HizbStar size={20} quarters={4} color={fixedColors.bronze} />
            </View>
          </View>
        )}

        {/* Zone Indicators */}
        <View style={styles.zoneIndicators}>
          <View style={styles.zoneIndicator}>
            <View style={[styles.zoneDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.zoneText}>{t('leaderboard.promotionZone')}</Text>
          </View>
          <View style={styles.zoneIndicator}>
            <View style={[styles.zoneDot, { backgroundColor: colors.error }]} />
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
                <Text style={styles.avatarEmoji}>{initiale(item?.user ?? item)}</Text>
              </View>

              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, item.isCurrentUser && styles.rankNameCurrent]}>
                  {item.user?.username} {item.isCurrentUser && `(${t('leaderboard.you')})`}
                </Text>
                <Text style={styles.rankLevel}>{t('leaderboard.levelX', { level: item.user?.level })}</Text>
              </View>

              <View style={styles.rankStats}>
                <Text style={styles.rankXp}>{item.xp} XP</Text>
                <View style={styles.rankStreakLigne}>
                <IconeSerie size={12} color={colors.warning} />
                <Text style={styles.rankStreak}>{item.streak}</Text>
              </View>
              </View>
            </View>
          );
        })}

        {/* Empty State */}
        {rankings.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MihrabArch width={70} color={colors.border} />
            <Text style={styles.emptyTitle}>{t('leaderboard.noData')}</Text>
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
            <Text style={styles.userRankAvatarEmoji}>{initiale(userRank?.user ?? userRank)}</Text>
          </View>
          <Text style={styles.userRankName}>{t('leaderboard.you')}</Text>
          <View style={styles.userRankStats}>
            <Text style={styles.userRankXp}>{userRank.xp} XP</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  leagueIcon: {},
  leagueName: { color: c.onDeep, fontSize: 28, fontWeight: 'bold', marginTop: 10 },
  leagueNameEn: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  leagueSubtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 10, fontSize: 12 },
  timerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  timerIcon: { marginRight: 5 },
  timerText: { color: c.onDeep, fontSize: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: c.surface, marginHorizontal: 20, marginTop: -15, borderRadius: 15, padding: 5, elevation: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  tabActive: { backgroundColor: c.primary },
  tabIcon: { marginRight: 5 },
  tabLabel: { color: c.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: c.onDeep },
  content: { padding: 20 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 30, paddingTop: 40 },
  podiumItem: { alignItems: 'center', marginHorizontal: 8, width: 90 },
  podiumFirst: { marginBottom: 20 },
  crownContainer: { position: 'absolute', top: -35, zIndex: 10 },
  crownEmoji: {},
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  podiumFirstAvatar: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 3, borderColor: fixedColors.gold },
  podiumSecond: { borderWidth: 3, borderColor: fixedColors.silver },
  podiumThird: { borderWidth: 3, borderColor: fixedColors.bronze },
  avatarEmoji: {},
  podiumName: { fontWeight: 'bold', color: c.text, fontSize: 13, textAlign: 'center' },
  podiumXp: { color: c.textSecondary, fontSize: 11, marginTop: 2 },
  podiumBase: { backgroundColor: c.border, paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10, marginTop: 8 },
  podiumBaseFirst: { backgroundColor: fixedColors.gold },
  podiumRank: { fontWeight: 'bold', color: c.text },
  podiumMedal: { marginTop: 8 },
  zoneIndicators: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  zoneIndicator: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  zoneDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  zoneText: { color: c.textSecondary, fontSize: 12 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  rankItemCurrent: { borderWidth: 2, borderColor: c.primary, backgroundColor: c.primarySoft },
  rankItemPromoted: { borderLeftWidth: 4, borderLeftColor: c.primary },
  rankItemRelegated: { borderLeftWidth: 4, borderLeftColor: c.error },
  rankNumberContainer: { width: 40, alignItems: 'center' },
  arrowUp: { color: c.primary, fontSize: 10, marginBottom: -2 },
  arrowDown: { color: c.error, fontSize: 10, marginBottom: -2 },
  rankNumber: { fontSize: 16, fontWeight: 'bold', color: c.text },
  rankNumberPromoted: { color: c.primary },
  rankNumberRelegated: { color: c.error },
  rankAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: c.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankInfo: { flex: 1 },
  rankName: { fontWeight: 'bold', color: c.text, fontSize: 15 },
  rankNameCurrent: { color: c.primary },
  rankLevel: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  rankStats: { alignItems: 'flex-end' },
  rankXp: { fontWeight: 'bold', color: c.primary, fontSize: 14 },
  rankStreakLigne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankStreak: { color: fixedColors.streak, fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  emptySubtitle: { color: c.textSecondary, marginTop: 5 },
  userRankBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: c.primary, padding: 15, paddingBottom: 30, elevation: 10 },
  userRankNumber: { color: c.onDeep, fontSize: 20, fontWeight: 'bold', width: 50 },
  userRankAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  userRankAvatarEmoji: {},
  userRankName: { color: c.onDeep, fontWeight: '600', flex: 1 },
  userRankStats: { alignItems: 'flex-end' },
  userRankXp: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 }
});
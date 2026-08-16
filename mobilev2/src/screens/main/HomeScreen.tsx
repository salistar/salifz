/**
 * ============================================
 * 📱 HomeScreen.tsx - Salifz
 * ============================================
 * ✅ FIXED: Delay API calls until token is ready
 * ✅ FIXED: Proper error handling
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 * ✅ NEW: Khatam Quran feature
 * ✅ NEW: Prayer Times with countdown
 * ✅ NEW: Qibla direction quick access
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore, useGamificationStore } from '../../stores';
import { progressAPI, chatAPI, halaqaAPI, isAuthenticated } from '../../services/api';
import api from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[HomeScreen.tsx]';
const { width } = Dimensions.get('window');

const LEAGUES = [
  { id: 'bronze', nameKey: 'home.leagues.bronze', icon: '🥉', color: fixedColors.bronze, minXP: 0 },
  { id: 'silver', nameKey: 'home.leagues.silver', icon: '🥈', color: fixedColors.silver, minXP: 1000 },
  { id: 'gold', nameKey: 'home.leagues.gold', icon: '🥇', color: fixedColors.gold, minXP: 5000 },
  { id: 'platinum', nameKey: 'home.leagues.platinum', icon: '💎', color: fixedColors.silver, minXP: 15000 },
  { id: 'diamond', nameKey: 'home.leagues.diamond', icon: '💠', color: fixedColors.diamond, minXP: 30000 },
  { id: 'master', nameKey: 'home.leagues.master', icon: '👑', color: fixedColors.master, minXP: 50000 },
];

interface NextPrayer {
  name: string;
  nameAr: string;
  time: string;
  remaining: { hours: number; minutes: number };
}

interface Khatam {
  _id: string;
  title: string;
  progress: { currentKhatamProgress: number };
  readingConfig: { unit: string; amountPerDay: number };
}

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { user } = useAuthStore();
  const { totalXP, level, gems, hearts, maxHearts, streak, league } = useGamificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([
    { icon: '🎯', titleKey: 'home.challenges.memorize5', rewards: { xp: 50 } },
    { icon: '🔄', titleKey: 'home.challenges.review10', rewards: { xp: 30 } },
    { icon: '⏱️', titleKey: 'home.challenges.practice15', rewards: { xp: 40 } },
  ]);
  const [dailyGoals, setDailyGoals] = useState<any>({
    ayahsCompleted: 0, ayahsTarget: 5, xpEarned: 0, xpTarget: 100
  });
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ✅ NEW: Prayer Times state
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [prayerCountdown, setPrayerCountdown] = useState({ hours: 0, minutes: 0 });
  const [hijriDate, setHijriDate] = useState<string>('');

  // ✅ NEW: Khatam state
  const [myKhatams, setMyKhatams] = useState<Khatam[]>([]);
  const [activeKhatam, setActiveKhatam] = useState<Khatam | null>(null);

  console.log(`${LOG_PREFIX} 📊 Stats: level=${level}, xp=${totalXP}, gems=${gems}, streak=${streak}`);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      console.log(`${LOG_PREFIX} 🔄 useFocusEffect triggered`);

      const initData = async () => {
        console.log(`${LOG_PREFIX} ⏳ Waiting for token...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) {
          console.log(`${LOG_PREFIX} ⚠️ Component unmounted, aborting`);
          return;
        }
        
        if (!isAuthenticated()) {
          console.log(`${LOG_PREFIX} 🔒 Not authenticated, skipping data load`);
          setIsLoading(false);
          return;
        }

        console.log(`${LOG_PREFIX} ✅ Authenticated, loading data...`);
        await loadData();
        await fetchPrayerTimes();
        
        if (isMounted) setIsLoading(false);
      };

      initData();
      return () => { isMounted = false; };
    }, [])
  );

  // ✅ NEW: Update prayer countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (nextPrayer) updatePrayerCountdown(nextPrayer);
    }, 60000);
    return () => clearInterval(interval);
  }, [nextPrayer]);

  // ✅ NEW: Fetch Prayer Times
  const fetchPrayerTimes = async () => {
    console.log(`${LOG_PREFIX} 🕌 Fetching prayer times...`);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log(`${LOG_PREFIX} ⚠️ Location permission denied`);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const response = await api.get('/prayer/times', {
        params: { latitude: location.coords.latitude, longitude: location.coords.longitude }
      });
      
      if (response.data?.data) {
        const data = response.data.data;
        setNextPrayer(data.nextPrayer);
        updatePrayerCountdown(data.nextPrayer);
        if (data.date?.hijri) {
          setHijriDate(`${data.date.hijri.day} ${data.date.hijri.monthAr} ${data.date.hijri.year}`);
        }
        console.log(`${LOG_PREFIX} ✅ Prayer times loaded: next=${data.nextPrayer?.name}`);
      }
    } catch (error) {
      console.log(`${LOG_PREFIX} ⚠️ Could not load prayer times:`, error);
    }
  };

  const updatePrayerCountdown = (prayer: NextPrayer | null) => {
    if (!prayer) return;
    setPrayerCountdown({ hours: prayer.remaining?.hours || 0, minutes: prayer.remaining?.minutes || 0 });
  };

  // ✅ NEW: Fetch Khatams
  const fetchKhatams = async () => {
    console.log(`${LOG_PREFIX} 📖 Fetching khatams...`);
    try {
      const response = await api.get('/khatam/my');
      if (response.data?.data) {
        const khatams = response.data.data || [];
        setMyKhatams(khatams.slice(0, 3));
        const active = khatams.find((k: Khatam) => k.progress?.currentKhatamProgress < 100);
        setActiveKhatam(active || null);
        console.log(`${LOG_PREFIX} ✅ Khatams loaded: ${khatams.length}`);
      }
    } catch (error) {
      console.log(`${LOG_PREFIX} ⚠️ Could not load khatams:`, error);
    }
  };

  const loadData = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD DATA START ==========`);
    try {
      try {
        const goalsRes = await progressAPI.getDailyGoals();
        if (goalsRes?.data || goalsRes?.goals) {
          setDailyGoals(goalsRes.data || goalsRes.goals);
          console.log(`${LOG_PREFIX} ✅ Goals loaded`);
        }
      } catch (e) { console.log(`${LOG_PREFIX} ⚠️ Could not load goals`); }
      
      try {
        const conversationsRes = await chatAPI.getConversations();
        const convos = conversationsRes?.data || conversationsRes || [];
        setConversations(Array.isArray(convos) ? convos.slice(0, 3) : []);
        const unread = Array.isArray(convos) ? convos.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) : 0;
        setUnreadMessages(unread);
        console.log(`${LOG_PREFIX} ✅ Conversations loaded: ${convos.length}, unread: ${unread}`);
      } catch (e) { console.log(`${LOG_PREFIX} ⚠️ Could not load conversations`); }
      
      try {
        const halaqatRes = await halaqaAPI.getMyHalaqat();
        const halaqaList = halaqatRes?.data || halaqatRes || [];
        setHalaqat(Array.isArray(halaqaList) ? halaqaList.slice(0, 3) : []);
        console.log(`${LOG_PREFIX} ✅ Halaqat loaded: ${halaqaList.length}`);
      } catch (e) { console.log(`${LOG_PREFIX} ⚠️ Could not load halaqat`); }

      await fetchKhatams();
      console.log(`${LOG_PREFIX} ✅ Data load complete`);
    } catch (error) { console.error(`${LOG_PREFIX} ❌ Load data error:`, error); }
    console.log(`${LOG_PREFIX} 📥 ========== LOAD DATA END ==========`);
  };

  const onRefresh = async () => { 
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true); 
    await loadData(); 
    await fetchPrayerTimes();
    setRefreshing(false); 
  };

  const currentLeague = LEAGUES.find(l => l.id === league) || LEAGUES[0];
  const xpProgress = (totalXP % 100) / 100;
  const userName = user?.username || user?.displayName || t('home.defaultUsername');
  const userLeagueRank = user?.gamification?.leagueRank || 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.avatarContainer} onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.statItem} onPress={() => navigation.navigate('StreakTab')}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.statItem} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.statIcon}>💎</Text>
              <Text style={styles.statValue}>{gems}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.statItem} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statValue}>{hearts}/{maxHearts}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>{t('home.levelX', { level })}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>{totalXP % 100}/100 XP</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.greeting}>{t('home.greeting', { name: userName })} 👋</Text>

        {/* ✅ NEW: Prayer Time Card */}
        {nextPrayer && (
          <TouchableOpacity accessible accessibilityRole="button" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('PrayerTimes'); }} activeOpacity={0.9}>
            <LinearGradient colors={[colors.accent, colors.accentDeep]} style={styles.prayerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.prayerHeader}>
                <View>
                  <Text style={styles.prayerLabel}>{t('prayer.nextPrayer') || 'الصلاة القادمة'}</Text>
                  {hijriDate && <Text style={styles.hijriDate}>{hijriDate}</Text>}
                </View>
                <TouchableOpacity accessible accessibilityRole="button" style={styles.qiblaButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Qibla'); }}>
                  <Text style={styles.qiblaIcon}>🧭</Text>
                  <Text style={styles.qiblaText}>{t('qibla.title') || 'القبلة'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.prayerName}>{nextPrayer.nameAr || nextPrayer.name}</Text>
              <View style={styles.countdownRow}>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownValue}>{prayerCountdown.hours.toString().padStart(2, '0')}</Text>
                  <Text style={styles.countdownLabel}>{t('prayer.hours') || 'ساعة'}</Text>
                </View>
                <Text style={styles.countdownSeparator}>:</Text>
                <View style={styles.countdownItem}>
                  <Text style={styles.countdownValue}>{prayerCountdown.minutes.toString().padStart(2, '0')}</Text>
                  <Text style={styles.countdownLabel}>{t('prayer.minutes') || 'دقيقة'}</Text>
                </View>
              </View>
              <Text style={styles.prayerTime}>{t('prayer.adhanAt') || 'الأذان'} {nextPrayer.time}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Continue Card */}
        <TouchableOpacity accessible accessibilityRole="button" style={styles.continueCard} onPress={() => navigation.navigate('LessonsTab')}>
          <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.continueGradient}>
            <View style={styles.continueContent}>
              <Text style={styles.continueTitle}>{t('home.continueMemorizing')}</Text>
              <Text style={styles.continueSubtitle}>{t('home.surahBaqarahAyah25')}</Text>
            </View>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('LessonsTab'); }}>
            <View style={[styles.actionIcon, { backgroundColor: colors.infoSoft }]}><Text style={styles.actionEmoji}>📖</Text></View>
            <Text style={styles.actionText}>{t('home.actions.learn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Review'); }}>
            <View style={[styles.actionIcon, { backgroundColor: colors.warningSoft }]}><Text style={styles.actionEmoji}>🔄</Text></View>
            <Text style={styles.actionText}>{t('home.actions.review')}</Text>
          </TouchableOpacity>
          {/* ✅ NEW: Khatam */}
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Khatam'); }}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}><Text style={styles.actionEmoji}>📚</Text></View>
            <Text style={styles.actionText}>{t('khatam.title') || 'ختم'}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('SocialTab'); }}>
            <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}><Text style={styles.actionEmoji}>💬</Text></View>
            <Text style={styles.actionText}>{t('home.actions.social')}</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ NEW: Active Khatam Progress */}
        {activeKhatam && (
          <TouchableOpacity accessible accessibilityRole="button" style={styles.khatamCard} onPress={() => navigation.navigate('KhatamDetail', { khatamId: activeKhatam._id })} activeOpacity={0.8}>
            <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.khatamGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.khatamHeader}>
                <Text style={styles.khatamIconBig}>📚</Text>
                <View style={styles.khatamInfo}>
                  <Text style={styles.khatamTitle}>{activeKhatam.title}</Text>
                  <Text style={styles.khatamSubtitle}>{activeKhatam.readingConfig?.amountPerDay || 1} {activeKhatam.readingConfig?.unit || 'hizb'}/{t('khatam.perDay') || 'يومياً'}</Text>
                </View>
              </View>
              <View style={styles.khatamProgress}>
                <View style={styles.khatamProgressBar}>
                  <View style={[styles.khatamProgressFill, { width: `${activeKhatam.progress?.currentKhatamProgress || 0}%` }]} />
                </View>
                <Text style={styles.khatamProgressText}>{activeKhatam.progress?.currentKhatamProgress || 0}%</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ✅ NEW: Islamic Features Row */}
        <View style={styles.islamicSection}>
          <Text style={styles.sectionTitle}>🕌 {t('home.islamicFeatures') || 'الميزات الإسلامية'}</Text>
          <View style={styles.islamicRow}>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.islamicCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('PrayerTimes'); }}>
              <LinearGradient colors={[colors.accent, colors.accentDeep]} style={styles.islamicGradient}>
                <Text style={styles.islamicIcon}>🕐</Text>
                <Text style={styles.islamicText}>{t('prayer.title') || 'مواقيت الصلاة'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.islamicCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Qibla'); }}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.islamicGradient}>
                <Text style={styles.islamicIcon}>🧭</Text>
                <Text style={styles.islamicText}>{t('qibla.title') || 'القبلة'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.islamicCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Khatam'); }}>
              <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.islamicGradient}>
                <Text style={styles.islamicIcon}>📚</Text>
                <Text style={styles.islamicText}>{t('khatam.title') || 'ختم القرآن'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Section */}
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>👥 {t('home.social.title')}</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.socialButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('ConversationsList'); }}>
              <View style={[styles.socialIconContainer, { backgroundColor: colors.infoSoft }]}>
                <Text style={styles.socialIcon}>💬</Text>
                {unreadMessages > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text></View>)}
              </View>
              <Text style={styles.socialLabel}>{t('home.social.conversations')}</Text>
              <Text style={styles.socialSubLabel}>{t('home.social.conversationCount', { count: conversations.length })}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.socialButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Halaqa'); }}>
              <View style={[styles.socialIconContainer, { backgroundColor: colors.primarySoft }]}><Text style={styles.socialIcon}>🕌</Text></View>
              <Text style={styles.socialLabel}>{t('home.social.halaqat')}</Text>
              <Text style={styles.socialSubLabel}>{t('home.social.halaqaCount', { count: halaqat.length })}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.socialButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Friends'); }}>
              <View style={[styles.socialIconContainer, { backgroundColor: colors.warningSoft }]}><Text style={styles.socialIcon}>👥</Text></View>
              <Text style={styles.socialLabel}>{t('home.social.friends')}</Text>
              <Text style={styles.socialSubLabel}>{t('home.social.addFriend')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <View style={styles.conversationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💬 {t('home.recentConversations')}</Text>
              <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('ConversationsList')}><Text style={styles.seeAll}>{t('home.seeAll')}</Text></TouchableOpacity>
            </View>
            {conversations.map((conv, index) => (
              <TouchableOpacity accessible accessibilityRole="button" key={conv._id || index} style={styles.conversationItem} onPress={() => navigation.navigate('Chat', { conversationId: conv._id, recipientId: conv.participants?.[0]?._id })}>
                <View style={styles.conversationAvatar}><Text style={styles.conversationAvatarText}>{conv.type === 'group' ? '👥' : '👤'}</Text></View>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationName} numberOfLines={1}>{conv.type === 'group' ? conv.name : conv.participants?.[0]?.displayName || conv.participants?.[0]?.username || t('home.conversation')}</Text>
                  <Text style={styles.conversationLastMessage} numberOfLines={1}>{conv.lastMessageText || t('home.noMessages')}</Text>
                </View>
                {(conv.unreadCount ?? 0) > 0 && (<View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text></View>)}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Halaqat */}
        {halaqat.length > 0 && (
          <View style={styles.halaqatSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🕌 {t('home.myHalaqat')}</Text>
              <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('Halaqa')}><Text style={styles.seeAll}>{t('home.seeAll')}</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {halaqat.map((halaqa, index) => (
                <TouchableOpacity accessible accessibilityRole="button" key={halaqa._id || index} style={styles.halaqaCard} onPress={() => navigation.navigate('HalaqaDetail', { halaqaId: halaqa._id })}>
                  <View style={styles.halaqaIconContainer}><Text style={styles.halaqaIcon}>🕌</Text></View>
                  <Text style={styles.halaqaName} numberOfLines={1}>{halaqa.name}</Text>
                  <Text style={styles.halaqaMembers}>{t('home.memberCount', { count: halaqa.membersCount || halaqa.participants?.length || 0 })}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity accessible accessibilityRole="button" style={[styles.halaqaCard, styles.createHalaqaCard]} onPress={() => navigation.navigate('Halaqa')}>
                <View style={[styles.halaqaIconContainer, { backgroundColor: colors.border }]}><Text style={styles.halaqaIcon}>➕</Text></View>
                <Text style={styles.halaqaName}>{t('home.joinHalaqa')}</Text>
                <Text style={styles.halaqaMembers}>{t('home.orCreateHalaqa')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Daily Goals */}
        <View style={styles.goalsCard}>
          <Text style={styles.sectionTitle}>📊 {t('home.dailyGoals')}</Text>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>{t('home.ayahsProgress', { current: dailyGoals?.ayahsCompleted || 0, target: dailyGoals?.ayahsTarget || 5 })}</Text>
            <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min(((dailyGoals?.ayahsCompleted || 0) / (dailyGoals?.ayahsTarget || 5)) * 100, 100)}%` }]} /></View>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>XP: {dailyGoals?.xpEarned || 0}/{dailyGoals?.xpTarget || 100}</Text>
            <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min(((dailyGoals?.xpEarned || 0) / (dailyGoals?.xpTarget || 100)) * 100, 100)}%`, backgroundColor: colors.warning }]} /></View>
          </View>
        </View>

        {/* Daily Challenges */}
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 {t('home.todaysChallenges')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('Challenges')}><Text style={styles.seeAll}>{t('home.seeAll')}</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dailyChallenges.map((challenge, index) => (
              <TouchableOpacity accessible accessibilityRole="button" key={index} style={styles.challengeCard}>
                <Text style={styles.challengeIcon}>{challenge.icon || '🎯'}</Text>
                <Text style={styles.challengeTitle}>{t(challenge.titleKey) || t('home.challenge')}</Text>
                <Text style={styles.challengeReward}>+{challenge.rewards?.xp || 50} XP</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* League Card */}
        <TouchableOpacity accessible accessibilityRole="button" style={styles.leagueCard} onPress={() => navigation.navigate('Leaderboard')}>
          <View style={[styles.leagueBadge, { backgroundColor: currentLeague.color + '30' }]}><Text style={styles.leagueIconText}>{currentLeague.icon}</Text></View>
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueName}>{t(currentLeague.nameKey)}</Text>
            <Text style={styles.leagueRank}>{t('home.rankNumber', { rank: userLeagueRank })}</Text>
          </View>
          <Text style={styles.leagueArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 24 },
  statsRow: { flexDirection: 'row' },
  statItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 8 },
  statIcon: { fontSize: 16, marginRight: 4 },
  statValue: { color: c.onDeep, fontWeight: 'bold' },
  levelContainer: { marginTop: 20, alignItems: 'center' },
  levelText: { color: c.onDeep, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  xpBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: fixedColors.gold, borderRadius: 4 },
  xpText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },
  content: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: c.text, marginBottom: 20 },
  
  // Prayer Card
  prayerCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  prayerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  prayerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  hijriDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  qiblaButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  qiblaIcon: { fontSize: 16, marginRight: 6 },
  qiblaText: { fontSize: 12, color: c.onDeep, fontWeight: '600' },
  prayerName: { fontSize: 32, fontWeight: 'bold', color: c.onDeep, marginBottom: 12 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  countdownItem: { alignItems: 'center' },
  countdownValue: { fontSize: 36, fontWeight: 'bold', color: c.onDeep },
  countdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  countdownSeparator: { fontSize: 32, fontWeight: 'bold', color: c.onDeep, marginHorizontal: 12 },
  prayerTime: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },

  // Khatam Card
  khatamCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  khatamGradient: { padding: 20 },
  khatamHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  khatamIconBig: { fontSize: 40, marginRight: 15 },
  khatamInfo: { flex: 1 },
  khatamTitle: { fontSize: 18, fontWeight: 'bold', color: c.onDeep },
  khatamSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  khatamProgress: { flexDirection: 'row', alignItems: 'center' },
  khatamProgressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  khatamProgressFill: { height: '100%', backgroundColor: c.surface, borderRadius: 4 },
  khatamProgressText: { fontSize: 14, fontWeight: 'bold', color: c.onDeep, marginLeft: 12 },

  // Islamic Features Section
  islamicSection: { marginBottom: 20 },
  islamicRow: { flexDirection: 'row', justifyContent: 'space-between' },
  islamicCard: { width: (width - 56) / 3, borderRadius: 15, overflow: 'hidden', elevation: 3 },
  islamicGradient: { paddingVertical: 20, alignItems: 'center' },
  islamicIcon: { fontSize: 28, marginBottom: 8 },
  islamicText: { fontSize: 11, fontWeight: '600', color: c.onDeep, textAlign: 'center' },

  // Continue Card
  continueCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  continueGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  continueContent: { flex: 1 },
  continueTitle: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  continueSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  continueArrow: { color: c.onDeep, fontSize: 24 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionButton: { alignItems: 'center', width: (width - 60) / 4 },
  actionIcon: { width: 55, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 26 },
  actionText: { fontSize: 12, color: c.textSecondary },
  
  // Social Section
  socialSection: { backgroundColor: c.surface, borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  socialButton: { alignItems: 'center', flex: 1 },
  socialIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  socialIcon: { fontSize: 28 },
  socialLabel: { fontSize: 13, fontWeight: '600', color: c.text },
  socialSubLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: c.error, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: c.onDeep, fontSize: 10, fontWeight: 'bold' },
  
  // Conversations Section
  conversationsSection: { backgroundColor: c.surface, borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  conversationAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: c.infoSoft, justifyContent: 'center', alignItems: 'center' },
  conversationAvatarText: { fontSize: 20 },
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationName: { fontSize: 14, fontWeight: '600', color: c.text },
  conversationLastMessage: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  unreadBadge: { backgroundColor: c.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: c.onDeep, fontSize: 11, fontWeight: 'bold' },
  
  // Halaqat Section
  halaqatSection: { marginBottom: 20 },
  halaqaCard: { backgroundColor: c.surface, borderRadius: 15, padding: 15, marginRight: 12, width: 120, alignItems: 'center', elevation: 2 },
  createHalaqaCard: { borderStyle: 'dashed', borderWidth: 2, borderColor: c.border, backgroundColor: 'transparent' },
  halaqaIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  halaqaIcon: { fontSize: 24 },
  halaqaName: { fontSize: 13, fontWeight: '600', color: c.text, textAlign: 'center' },
  halaqaMembers: { fontSize: 11, color: c.textMuted, marginTop: 4 },
  
  // Goals & Challenges
  goalsCard: { backgroundColor: c.surface, borderRadius: 15, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  goalItem: { marginBottom: 12 },
  goalLabel: { fontSize: 14, color: c.textSecondary, marginBottom: 5 },
  goalBar: { height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: c.primary, borderRadius: 4 },
  challengesSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAll: { color: c.primary, fontWeight: '600' },
  challengeCard: { backgroundColor: c.surface, borderRadius: 15, padding: 15, marginRight: 12, width: 130, alignItems: 'center', elevation: 2 },
  challengeIcon: { fontSize: 30, marginBottom: 8 },
  challengeTitle: { fontSize: 12, color: c.text, textAlign: 'center', marginBottom: 5 },
  challengeReward: { color: c.primary, fontWeight: 'bold', fontSize: 12 },
  leagueCard: { backgroundColor: c.surface, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  leagueBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  leagueIconText: { fontSize: 28 },
  leagueInfo: { flex: 1, marginLeft: 15 },
  leagueName: { fontSize: 16, fontWeight: 'bold', color: c.text },
  leagueRank: { color: c.textSecondary, marginTop: 2 },
  leagueArrow: { fontSize: 20, color: c.textMuted }
});
/**
 * Home Screen - Salifz
 * ✅ FIXED: Delay API calls until token is ready
 * ✅ FIXED: Proper error handling
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore, useGamificationStore } from '../../stores';
import { progressAPI, chatAPI, halaqaAPI, isAuthenticated } from '../../services/api';
import { COLORS } from '../../config';

const { width } = Dimensions.get('window');

// Define LEAGUES locally
const LEAGUES = [
  { id: 'bronze', name: 'البرونزي', icon: '🥉', color: '#CD7F32', minXP: 0 },
  { id: 'silver', name: 'الفضي', icon: '🥈', color: '#C0C0C0', minXP: 1000 },
  { id: 'gold', name: 'الذهبي', icon: '🥇', color: '#FFD700', minXP: 5000 },
  { id: 'platinum', name: 'البلاتيني', icon: '💎', color: '#E5E4E2', minXP: 15000 },
  { id: 'diamond', name: 'الماسي', icon: '💠', color: '#B9F2FF', minXP: 30000 },
  { id: 'master', name: 'الأسطوري', icon: '👑', color: '#9B59B6', minXP: 50000 },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { totalXP, level, gems, hearts, maxHearts, streak, league } = useGamificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([
    { icon: '🎯', title: { ar: 'احفظ 5 آيات' }, rewards: { xp: 50 } },
    { icon: '🔄', title: { ar: 'راجع 10 آيات' }, rewards: { xp: 30 } },
    { icon: '⏱️', title: { ar: 'تدرب 15 دقيقة' }, rewards: { xp: 40 } },
  ]);
  const [dailyGoals, setDailyGoals] = useState<any>({
    ayahsCompleted: 0,
    ayahsTarget: 5,
    xpEarned: 0,
    xpTarget: 100
  });
  
  // Social data states
  const [conversations, setConversations] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ✅ Load data with delay and auth check
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const initData = async () => {
        // ✅ Wait for token to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!isMounted) return;
        
        // ✅ Check authentication
        if (!isAuthenticated()) {
          console.log('[HomeScreen] Not authenticated, skipping data load');
          setIsLoading(false);
          return;
        }

        await loadData();
        
        if (isMounted) {
          setIsLoading(false);
        }
      };

      initData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const loadData = async () => {
    try {
      console.log('[HomeScreen] Loading data...');
      
      // Load goals
      try {
        const goalsRes = await progressAPI.getDailyGoals();
        if (goalsRes?.data || goalsRes?.goals) {
          setDailyGoals(goalsRes.data || goalsRes.goals);
        }
      } catch (e) {
        console.log('[HomeScreen] Could not load goals');
      }
      
      // Load conversations
      try {
        const conversationsRes = await chatAPI.getConversations();
        const convos = conversationsRes?.data || conversationsRes || [];
        setConversations(Array.isArray(convos) ? convos.slice(0, 3) : []);
        const unread = Array.isArray(convos) 
          ? convos.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0) 
          : 0;
        setUnreadMessages(unread);
        console.log('[HomeScreen] Conversations loaded:', convos.length);
      } catch (e) {
        console.log('[HomeScreen] Could not load conversations');
      }
      
      // Load halaqat
      try {
        const halaqatRes = await halaqaAPI.getMyHalaqat();
        const halaqaList = halaqatRes?.data || halaqatRes || [];
        setHalaqat(Array.isArray(halaqaList) ? halaqaList.slice(0, 3) : []);
        console.log('[HomeScreen] Halaqat loaded:', halaqaList.length);
      } catch (e) {
        console.log('[HomeScreen] Could not load halaqat');
      }
      
      console.log('[HomeScreen] Data load complete');
    } catch (error) { 
      console.error('[HomeScreen] Load data error:', error); 
    }
  };

  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadData(); 
    setRefreshing(false); 
  };

  const currentLeague = LEAGUES.find(l => l.id === league) || LEAGUES[0];
  const xpProgress = (totalXP % 100) / 100;

  // ✅ Safe access to user data
  const userName = user?.username || user?.displayName || 'صديقي';
  const userLeagueRank = user?.gamification?.leagueRank || 1;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('StreakTab')}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.statIcon}>💎</Text>
              <Text style={styles.statValue}>{gems}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Shop')}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statValue}>{hearts}/{maxHearts}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>المستوى {level}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>{totalXP % 100}/100 XP</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>مرحباً {userName}! 👋</Text>

        <TouchableOpacity style={styles.continueCard} onPress={() => navigation.navigate('LessonsTab')}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.continueGradient}>
            <View style={styles.continueContent}>
              <Text style={styles.continueTitle}>تابع الحفظ</Text>
              <Text style={styles.continueSubtitle}>سورة البقرة - الآية 25</Text>
            </View>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('LessonsTab'); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.actionEmoji}>📖</Text>
            </View>
            <Text style={styles.actionText}>تعلم</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Review'); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.actionEmoji}>🔄</Text>
            </View>
            <Text style={styles.actionText}>مراجعة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Challenges'); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.actionEmoji}>🎯</Text>
            </View>
            <Text style={styles.actionText}>تحديات</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('SocialTab'); }}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.actionEmoji}>💬</Text>
            </View>
            <Text style={styles.actionText}>التواصل</Text>
          </TouchableOpacity>
        </View>

        {/* Social Section */}
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>👥 التواصل</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('ConversationsList'); }}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.socialIcon}>💬</Text>
                {unreadMessages > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadMessages > 99 ? '99+' : unreadMessages}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.socialLabel}>المحادثات</Text>
              <Text style={styles.socialSubLabel}>{conversations.length} محادثة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Halaqa'); }}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.socialIcon}>🕌</Text>
              </View>
              <Text style={styles.socialLabel}>الحلقات</Text>
              <Text style={styles.socialSubLabel}>{halaqat.length} حلقة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Friends'); }}
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Text style={styles.socialIcon}>👥</Text>
              </View>
              <Text style={styles.socialLabel}>الأصدقاء</Text>
              <Text style={styles.socialSubLabel}>إضافة صديق</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <View style={styles.conversationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💬 المحادثات الأخيرة</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ConversationsList')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            {conversations.map((conv, index) => (
              <TouchableOpacity 
                key={conv._id || index} 
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', { 
                  conversationId: conv._id, 
                  recipientId: conv.participants?.[0]?._id 
                })}
              >
                <View style={styles.conversationAvatar}>
                  <Text style={styles.conversationAvatarText}>
                    {conv.type === 'group' ? '👥' : '👤'}
                  </Text>
                </View>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {conv.type === 'group' 
                      ? conv.name 
                      : conv.participants?.[0]?.displayName || conv.participants?.[0]?.username || 'محادثة'}
                  </Text>
                  <Text style={styles.conversationLastMessage} numberOfLines={1}>
                    {conv.lastMessageText || 'لا توجد رسائل'}
                  </Text>
                </View>
                {(conv.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Halaqat */}
        {halaqat.length > 0 && (
          <View style={styles.halaqatSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🕌 حلقاتي</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Halaqa')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {halaqat.map((halaqa, index) => (
                <TouchableOpacity 
                  key={halaqa._id || index} 
                  style={styles.halaqaCard}
                  onPress={() => navigation.navigate('HalaqaDetail', { halaqaId: halaqa._id })}
                >
                  <View style={styles.halaqaIconContainer}>
                    <Text style={styles.halaqaIcon}>🕌</Text>
                  </View>
                  <Text style={styles.halaqaName} numberOfLines={1}>{halaqa.name}</Text>
                  <Text style={styles.halaqaMembers}>
                    {halaqa.membersCount || halaqa.participants?.length || 0} عضو
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.halaqaCard, styles.createHalaqaCard]}
                onPress={() => navigation.navigate('Halaqa')}
              >
                <View style={[styles.halaqaIconContainer, { backgroundColor: '#E0E0E0' }]}>
                  <Text style={styles.halaqaIcon}>➕</Text>
                </View>
                <Text style={styles.halaqaName}>انضم لحلقة</Text>
                <Text style={styles.halaqaMembers}>أو أنشئ حلقة</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Daily Goals */}
        <View style={styles.goalsCard}>
          <Text style={styles.sectionTitle}>📊 أهداف اليوم</Text>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>
              الآيات: {dailyGoals?.ayahsCompleted || 0}/{dailyGoals?.ayahsTarget || 5}
            </Text>
            <View style={styles.goalBar}>
              <View style={[
                styles.goalFill, 
                { width: `${Math.min(((dailyGoals?.ayahsCompleted || 0) / (dailyGoals?.ayahsTarget || 5)) * 100, 100)}%` }
              ]} />
            </View>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>
              XP: {dailyGoals?.xpEarned || 0}/{dailyGoals?.xpTarget || 100}
            </Text>
            <View style={styles.goalBar}>
              <View style={[
                styles.goalFill, 
                { 
                  width: `${Math.min(((dailyGoals?.xpEarned || 0) / (dailyGoals?.xpTarget || 100)) * 100, 100)}%`, 
                  backgroundColor: '#FF9800' 
                }
              ]} />
            </View>
          </View>
        </View>

        {/* Daily Challenges */}
        <View style={styles.challengesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 تحديات اليوم</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Challenges')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dailyChallenges.map((challenge, index) => (
              <TouchableOpacity key={index} style={styles.challengeCard}>
                <Text style={styles.challengeIcon}>{challenge.icon || '🎯'}</Text>
                <Text style={styles.challengeTitle}>{challenge.title?.ar || 'تحدي'}</Text>
                <Text style={styles.challengeReward}>+{challenge.rewards?.xp || 50} XP</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* League Card */}
        <TouchableOpacity style={styles.leagueCard} onPress={() => navigation.navigate('Leaderboard')}>
          <View style={[styles.leagueBadge, { backgroundColor: currentLeague.color + '30' }]}>
            <Text style={styles.leagueIcon}>{currentLeague.icon}</Text>
          </View>
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueName}>{currentLeague.name}</Text>
            <Text style={styles.leagueRank}>المرتبة #{userLeagueRank}</Text>
          </View>
          <Text style={styles.leagueArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 24 },
  statsRow: { flexDirection: 'row' },
  statItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 8 },
  statIcon: { fontSize: 16, marginRight: 4 },
  statValue: { color: '#fff', fontWeight: 'bold' },
  levelContainer: { marginTop: 20, alignItems: 'center' },
  levelText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  xpBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  xpText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },
  content: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  continueCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  continueGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  continueContent: { flex: 1 },
  continueTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  continueSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  continueArrow: { color: '#fff', fontSize: 24 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  actionButton: { alignItems: 'center', width: (width - 60) / 4 },
  actionIcon: { width: 55, height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 26 },
  actionText: { fontSize: 12, color: '#666' },
  
  // Social Section Styles
  socialSection: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  socialButton: { alignItems: 'center', flex: 1 },
  socialIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  socialIcon: { fontSize: 28 },
  socialLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  socialSubLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F44336', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Conversations Section Styles
  conversationsSection: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 2 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  conversationAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  conversationAvatarText: { fontSize: 20 },
  conversationInfo: { flex: 1, marginLeft: 12 },
  conversationName: { fontSize: 14, fontWeight: '600', color: '#333' },
  conversationLastMessage: { fontSize: 12, color: '#999', marginTop: 2 },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  // Halaqat Section Styles
  halaqatSection: { marginBottom: 20 },
  halaqaCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginRight: 12, width: 120, alignItems: 'center', elevation: 2 },
  createHalaqaCard: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: 'transparent' },
  halaqaIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  halaqaIcon: { fontSize: 24 },
  halaqaName: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },
  halaqaMembers: { fontSize: 11, color: '#999', marginTop: 4 },
  
  // Goals & Challenges Styles
  goalsCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  goalItem: { marginBottom: 12 },
  goalLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  goalBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  challengesSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAll: { color: COLORS.primary, fontWeight: '600' },
  challengeCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginRight: 12, width: 130, alignItems: 'center', elevation: 2 },
  challengeIcon: { fontSize: 30, marginBottom: 8 },
  challengeTitle: { fontSize: 12, color: '#333', textAlign: 'center', marginBottom: 5 },
  challengeReward: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  leagueCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  leagueBadge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  leagueIcon: { fontSize: 28 },
  leagueInfo: { flex: 1, marginLeft: 15 },
  leagueName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  leagueRank: { color: '#666', marginTop: 2 },
  leagueArrow: { fontSize: 20, color: '#999' }
});
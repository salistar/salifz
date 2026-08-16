/**
 * ============================================
 * 📱 ChallengesScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { challengesAPI } from '../../services/api';
import { useGamificationStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ChallengesScreen.tsx]';

export default function ChallengesScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { addXp, addGems } = useGamificationStore();
  const [challenges, setChallenges] = useState<any>({ daily: [], weekly: [], special: [] });
  const [activeTab, setActiveTab] = useState('daily');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { 
    console.log(`${LOG_PREFIX} 🔄 useEffect: Loading challenges...`);
    loadChallenges(); 
  }, []);

  const loadChallenges = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD CHALLENGES START ==========`);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling challengesAPI.getChallenges()...`);
      const response = await challengesAPI.getChallenges();
      const data = response as any;
      const loadedChallenges = data.challenges || { daily: [], weekly: [], special: [] };
      setChallenges(loadedChallenges);
      console.log(`${LOG_PREFIX} ✅ Loaded challenges: daily=${loadedChallenges.daily?.length || 0}, weekly=${loadedChallenges.weekly?.length || 0}, special=${loadedChallenges.special?.length || 0}`);
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ Load challenges error:`, error); 
    }
    console.log(`${LOG_PREFIX} 📥 ========== LOAD CHALLENGES END ==========`);
  };

  const onRefresh = async () => { 
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true); 
    await loadChallenges(); 
    setRefreshing(false); 
  };

  const handleStartChallenge = async (challenge: any) => {
    console.log(`${LOG_PREFIX} 🎯 Starting challenge: ${challenge._id}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling challengesAPI.startChallenge()...`);
      await challengesAPI.startChallenge(challenge._id);
      console.log(`${LOG_PREFIX} ✅ Challenge started successfully`);
      loadChallenges();
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ Start challenge error:`, error); 
    }
  };

  const handleClaimReward = async (challenge: any) => {
    console.log(`${LOG_PREFIX} 🎁 Claiming reward for challenge: ${challenge._id}`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling challengesAPI.claimReward()...`);
      const response = await challengesAPI.claimReward(challenge._id);
      const data = response as any;
      const xpReward = data.rewards?.xp || 0;
      const gemsReward = data.rewards?.gems || 0;
      
      console.log(`${LOG_PREFIX} ✅ Reward claimed: ${xpReward} XP, ${gemsReward} gems`);
      addXp(xpReward);
      addGems(gemsReward);
      
      // ✅ AVANT: Alert.alert('🎉 مبروك!', `حصلت على ${...} XP و ${...} جواهر`);
      Alert.alert(
        `🎉 ${t('challenges.congratulations')}`,
        t('challenges.rewardMessage', { xp: xpReward, gems: gemsReward })
      );
      loadChallenges();
    } catch (error) { 
      console.error(`${LOG_PREFIX} ❌ Claim reward error:`, error); 
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // ✅ AVANT: hardcoded difficulty names
  // ✅ APRÈS: i18n keys
  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return t('challenges.difficulty.easy');
      case 'medium': return t('challenges.difficulty.medium');
      case 'hard': return t('challenges.difficulty.hard');
      default: return '';
    }
  };

  // ✅ TABS avec clés i18n
  const tabs = [
    { id: 'daily', labelKey: 'challenges.tabs.daily', icon: '📅' },
    { id: 'weekly', labelKey: 'challenges.tabs.weekly', icon: '📆' },
    { id: 'special', labelKey: 'challenges.tabs.special', icon: '⭐' }
  ];

  const currentChallenges = challenges[activeTab] || [];

  const handleTabChange = (tabId: string) => {
    console.log(`${LOG_PREFIX} 📂 Tab changed: ${tabId}`);
    setActiveTab(tabId);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (tab: ${activeTab}, challenges: ${currentChallenges.length})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.header}>
        <Text style={styles.headerIcon}>🎯</Text>
        {/* ✅ AVANT: 'التحديات' */}
        <Text style={styles.headerTitle}>{t('challenges.title')}</Text>
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

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {currentChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            {/* ✅ AVANT: 'لا توجد تحديات متاحة حالياً' */}
            <Text style={styles.emptyText}>{t('challenges.empty')}</Text>
          </View>
        ) : (
          currentChallenges.map((challenge: any, index: number) => {
            const progress = challenge.userProgress;
            const isCompleted = progress?.status === 'completed';
            const isClaimed = progress?.status === 'claimed';
            const isInProgress = progress?.status === 'in_progress';

            return (
              <View key={index} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeIconContainer}>
                    <Text style={styles.challengeIcon}>{challenge.icon || '🎯'}</Text>
                  </View>
                  <View style={styles.challengeInfo}>
                    {/* ✅ AVANT: {challenge.title?.ar || 'تحدي'} */}
                    <Text style={styles.challengeTitle}>
                      {challenge.title?.ar || t('challenges.defaultTitle')}
                    </Text>
                    <Text style={styles.challengeDesc}>{challenge.description?.ar || ''}</Text>
                  </View>
                  <View style={[
                    styles.difficultyBadge, 
                    { backgroundColor: getDifficultyColor(challenge.difficulty) + '20' }
                  ]}>
                    <Text style={[
                      styles.difficultyText, 
                      { color: getDifficultyColor(challenge.difficulty) }
                    ]}>
                      {/* ✅ AVANT: 'سهل' / 'متوسط' / 'صعب' hardcodé */}
                      {getDifficultyName(challenge.difficulty)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {isInProgress && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[
                        styles.progressFill, 
                        { width: `${progress?.progress?.percentage || 0}%` }
                      ]} />
                    </View>
                    <Text style={styles.progressText}>
                      {progress?.progress?.current || 0}/{progress?.progress?.target || 0}
                    </Text>
                  </View>
                )}

                {/* Rewards */}
                <View style={styles.rewardsRow}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>⚡</Text>
                    <Text style={styles.rewardValue}>+{challenge.rewards?.xp || 0}</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardIcon}>💎</Text>
                    <Text style={styles.rewardValue}>+{challenge.rewards?.gems || 0}</Text>
                  </View>
                  {challenge.rewards?.streakFreeze > 0 && (
                    <View style={styles.rewardItem}>
                      <Text style={styles.rewardIcon}>❄️</Text>
                      <Text style={styles.rewardValue}>+{challenge.rewards.streakFreeze}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {isClaimed ? (
                  <View style={styles.claimedBadge}>
                    {/* ✅ AVANT: '✓ تم الاستلام' */}
                    <Text style={styles.claimedText}>✓ {t('challenges.claimed')}</Text>
                  </View>
                ) : isCompleted ? (
                  <TouchableOpacity 
                    style={styles.claimButton} 
                    onPress={() => handleClaimReward(challenge)}
                  >
                    <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.claimGradient}>
                      {/* ✅ AVANT: 'استلم المكافأة 🎁' */}
                      <Text style={styles.claimText}>{t('challenges.claimReward')} 🎁</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : isInProgress ? (
                  <View style={styles.inProgressBadge}>
                    {/* ✅ AVANT: 'جاري التقدم...' */}
                    <Text style={styles.inProgressText}>{t('challenges.inProgress')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.startButton} 
                    onPress={() => handleStartChallenge(challenge)}
                  >
                    {/* ✅ AVANT: 'ابدأ التحدي' */}
                    <Text style={styles.startText}>{t('challenges.start')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: { fontSize: 50 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginTop: -15, 
    borderRadius: 15, 
    padding: 5, 
    elevation: 3 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12 
  },
  tabActive: { backgroundColor: '#9C27B0' },
  tabIcon: { fontSize: 16, marginRight: 5 },
  tabLabel: { color: '#666', fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
  content: { padding: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyText: { color: '#666', fontSize: 16 },
  challengeCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    elevation: 2 
  },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  challengeIconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  challengeIcon: { fontSize: 25 },
  challengeInfo: { flex: 1, marginLeft: 12 },
  challengeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  challengeDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  difficultyText: { fontSize: 11, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  progressBar: { 
    flex: 1, 
    height: 8, 
    backgroundColor: '#E0E0E0', 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginRight: 10 
  },
  progressFill: { height: '100%', backgroundColor: '#9C27B0', borderRadius: 4 },
  progressText: { color: '#666', fontSize: 12, fontWeight: '600' },
  rewardsRow: { flexDirection: 'row', marginBottom: 15 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  rewardIcon: { fontSize: 14, marginRight: 4 },
  rewardValue: { color: '#333', fontWeight: '600' },
  claimedBadge: { 
    backgroundColor: '#E8F5E9', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  claimedText: { color: '#4CAF50', fontWeight: 'bold' },
  claimButton: { borderRadius: 12, overflow: 'hidden' },
  claimGradient: { paddingVertical: 14, alignItems: 'center' },
  claimText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  inProgressBadge: { 
    backgroundColor: '#f5f5f5', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  inProgressText: { color: '#666' },
  startButton: { 
    backgroundColor: '#9C27B0', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  startText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
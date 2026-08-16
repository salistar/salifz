import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { challengesAPI } from '../../services/api';
import { useGamificationStore } from '../../stores';
import { COLORS } from '../../config';

export default function ChallengesScreen({ navigation }: any) {
  const { addXp, addGems } = useGamificationStore();
  const [challenges, setChallenges] = useState<any>({ daily: [], weekly: [], special: [] });
  const [activeTab, setActiveTab] = useState('daily');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadChallenges(); }, []);

  const loadChallenges = async () => {
    try {
      const response = await challengesAPI.getChallenges();
      const data = response as any;
      setChallenges(data.challenges || { daily: [], weekly: [], special: [] });
    } catch (error) { 
      console.error('Load challenges error:', error); 
    }
  };

  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadChallenges(); 
    setRefreshing(false); 
  };

  const handleStartChallenge = async (challenge: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await challengesAPI.startChallenge(challenge._id);
      loadChallenges();
    } catch (error) { 
      console.error('Start challenge error:', error); 
    }
  };

  const handleClaimReward = async (challenge: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const response = await challengesAPI.claimReward(challenge._id);
      const data = response as any;
      addXp(data.rewards?.xp || 0);
      addGems(data.rewards?.gems || 0);
      Alert.alert('🎉 مبروك!', `حصلت على ${data.rewards?.xp || 0} XP و ${data.rewards?.gems || 0} جواهر`);
      loadChallenges();
    } catch (error) { 
      console.error('Claim reward error:', error); 
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

  const tabs = [
    { id: 'daily', label: 'يومي', icon: '📅' },
    { id: 'weekly', label: 'أسبوعي', icon: '📆' },
    { id: 'special', label: 'خاص', icon: '⭐' }
  ];

  const currentChallenges = challenges[activeTab] || [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.header}>
        <Text style={styles.headerIcon}>🎯</Text>
        <Text style={styles.headerTitle}>التحديات</Text>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tab, activeTab === tab.id && styles.tabActive]} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {currentChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>لا توجد تحديات متاحة حالياً</Text>
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
                    <Text style={styles.challengeTitle}>{challenge.title?.ar || 'تحدي'}</Text>
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
                      {challenge.difficulty === 'easy' ? 'سهل' : challenge.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </Text>
                  </View>
                </View>

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

                {isClaimed ? (
                  <View style={styles.claimedBadge}>
                    <Text style={styles.claimedText}>✓ تم الاستلام</Text>
                  </View>
                ) : isCompleted ? (
                  <TouchableOpacity 
                    style={styles.claimButton} 
                    onPress={() => handleClaimReward(challenge)}
                  >
                    <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.claimGradient}>
                      <Text style={styles.claimText}>استلم المكافأة 🎁</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : isInProgress ? (
                  <View style={styles.inProgressBadge}>
                    <Text style={styles.inProgressText}>جاري التقدم...</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.startButton} 
                    onPress={() => handleStartChallenge(challenge)}
                  >
                    <Text style={styles.startText}>ابدأ التحدي</Text>
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
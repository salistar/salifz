import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStreakStore, useGamificationStore } from '../../stores';
import { streaksAPI } from '../../services/api';
import { COLORS } from '../../config';

const MILESTONES = [
  { days: 7, icon: '🔥', reward: '100 XP + 50 💎' },
  { days: 14, icon: '⚡', reward: '200 XP + 100 💎' },
  { days: 30, icon: '🌟', reward: '500 XP + 200 💎' },
  { days: 50, icon: '💪', reward: '1000 XP + 500 💎' },
  { days: 100, icon: '🏆', reward: '2000 XP + 1000 💎' },
  { days: 365, icon: '👑', reward: '10000 XP + 5000 💎' }
];

export default function StreakScreen({ navigation }: any) {
  // ✅ FIXED: Cast to any to avoid TypeScript errors
  const streakStore = useStreakStore() as any;
  const gamificationStore = useGamificationStore() as any;
  
  const current = streakStore.current || 0;
  const longest = streakStore.longest || 0;
  const freezesAvailable = streakStore.freezesAvailable || 0;
  const fetchStreak = streakStore.fetchStreak;
  const useFreeze = streakStore.useFreeze;
  const gems = gamificationStore.gems || 0;

  const [refreshing, setRefreshing] = useState(false);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  useEffect(() => {
    if (typeof fetchStreak === 'function') {
      fetchStreak();
    }
    generateCalendar();
  }, []);

  const generateCalendar = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({ date, completed: i < current, isToday: i === 0 });
    }
    setCalendarDays(days);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (typeof fetchStreak === 'function') {
      await fetchStreak();
    }
    generateCalendar();
    setRefreshing(false);
  };

  const handleUseFreeze = async () => {
    if (freezesAvailable <= 0) {
      Alert.alert('لا يوجد تجميد!', 'يمكنك شراء تجميد من المتجر', [
        { text: 'المتجر', onPress: () => navigation.navigate('Shop') },
        { text: 'إلغاء', style: 'cancel' }
      ]);
      return;
    }
    Alert.alert('استخدام التجميد', 'هل تريد استخدام تجميد للحفاظ على سلسلتك؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'استخدم', onPress: async () => {
        if (typeof useFreeze === 'function') {
          const success = await useFreeze();
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('✓ تم!', 'تم استخدام التجميد بنجاح');
          }
        }
      }}
    ]);
  };

  const handleBuyFreeze = async () => {
    if (gems < 200) {
      Alert.alert('جواهر غير كافية!', 'تحتاج 200 جوهرة لشراء تجميد');
      return;
    }
    try {
      await streaksAPI.buyFreeze();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (typeof fetchStreak === 'function') {
        fetchStreak();
      }
    } catch (error) {
      console.error('Buy freeze error:', error);
    }
  };

  const nextMilestone = MILESTONES.find(m => m.days > current) || MILESTONES[MILESTONES.length - 1];
  const progress = (current / nextMilestone.days) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <Text style={styles.headerEmoji}>🔥</Text>
        <Text style={styles.streakCount}>{current}</Text>
        <Text style={styles.streakLabel}>يوم متتالي</Text>
        <View style={styles.longestBadge}>
          <Text style={styles.longestText}>أطول سلسلة: {longest} يوم</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            الهدف القادم: {nextMilestone.days} يوم {nextMilestone.icon}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{current}/{nextMilestone.days} يوم</Text>
          <Text style={styles.rewardText}>المكافأة: {nextMilestone.reward}</Text>
        </View>

        <View style={styles.freezeCard}>
          <View style={styles.freezeHeader}>
            <Text style={styles.freezeIcon}>❄️</Text>
            <View>
              <Text style={styles.freezeTitle}>تجميد السلسلة</Text>
              <Text style={styles.freezeCount}>{freezesAvailable} متاح</Text>
            </View>
          </View>
          <View style={styles.freezeActions}>
            <TouchableOpacity style={styles.freezeButton} onPress={handleUseFreeze}>
              <Text style={styles.freezeButtonText}>استخدم</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyFreezeButton} onPress={handleBuyFreeze}>
              <Text style={styles.buyFreezeText}>شراء (200 💎)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🏆 المراحل</Text>
        <View style={styles.milestonesGrid}>
          {MILESTONES.map((milestone, index) => (
            <View 
              key={index} 
              style={[
                styles.milestoneItem, 
                current >= milestone.days && styles.milestoneAchieved
              ]}
            >
              <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
              <Text style={styles.milestoneDays}>{milestone.days}</Text>
              {current >= milestone.days && (
                <View style={styles.milestoneCheck}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>📅 آخر 30 يوم</Text>
        <View style={styles.calendarCard}>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.calendarDay, 
                  day.completed && styles.calendarDayCompleted, 
                  day.isToday && styles.calendarDayToday
                ]}
              >
                {day.completed ? (
                  <Text style={styles.calendarCheck}>✓</Text>
                ) : (
                  <Text style={styles.calendarDayNumber}>{day.date.getDate()}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>🎁 فوائد السلسلة</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>مكافأة XP يومية: +{Math.min(current, 50)} XP</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💎</Text>
            <Text style={styles.benefitText}>
              مضاعف الجواهر: x{Math.min(1 + current * 0.01, 1.5).toFixed(2)}
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🏅</Text>
            <Text style={styles.benefitText}>شارات حصرية عند كل مرحلة</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  headerEmoji: { fontSize: 60 },
  streakCount: { fontSize: 72, fontWeight: 'bold', color: '#fff' },
  streakLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 18 },
  longestBadge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginTop: 15 
  },
  longestText: { color: '#fff' },
  content: { padding: 20 },
  progressCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 2 
  },
  progressTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  progressBar: { 
    height: 12, 
    backgroundColor: '#E0E0E0', 
    borderRadius: 6, 
    overflow: 'hidden', 
    marginBottom: 10 
  },
  progressFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 6 },
  progressText: { color: '#666', textAlign: 'center' },
  rewardText: { color: COLORS.primary, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  freezeCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 2 
  },
  freezeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  freezeIcon: { fontSize: 40, marginRight: 15 },
  freezeTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  freezeCount: { color: '#666' },
  freezeActions: { flexDirection: 'row' },
  freezeButton: { 
    flex: 1, 
    backgroundColor: '#E3F2FD', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginRight: 10 
  },
  freezeButtonText: { color: '#1976D2', fontWeight: 'bold' },
  buyFreezeButton: { 
    flex: 1, 
    backgroundColor: '#FFF3E0', 
    paddingVertical: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buyFreezeText: { color: '#FF9800', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  milestonesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  milestoneItem: { 
    width: '30%', 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center', 
    marginBottom: 10, 
    elevation: 1 
  },
  milestoneAchieved: { backgroundColor: '#E8F5E9' },
  milestoneIcon: { fontSize: 30, marginBottom: 5 },
  milestoneDays: { fontWeight: 'bold', color: '#333' },
  milestoneCheck: { 
    position: 'absolute', 
    top: 5, 
    right: 5, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkIcon: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  calendarCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 20, 
    elevation: 2 
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { 
    width: '14.28%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 8 
  },
  calendarDayCompleted: { backgroundColor: '#E8F5E9' },
  calendarDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  calendarCheck: { color: COLORS.primary, fontWeight: 'bold' },
  calendarDayNumber: { color: '#999', fontSize: 12 },
  benefitsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2 },
  benefitsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitIcon: { fontSize: 20, marginRight: 12 },
  benefitText: { color: '#333', flex: 1 }
});
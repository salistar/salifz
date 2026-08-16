/**
 * ============================================
 * 📱 StreakScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStreakStore, useGamificationStore } from '../../stores';
import { streaksAPI } from '../../services/api';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

// ✅ Constante pour les logs
const LOG_PREFIX = '[StreakScreen.tsx]';

const MILESTONES = [
  { days: 7, icon: '🔥', reward: '100 XP + 50 💎' },
  { days: 14, icon: '⚡', reward: '200 XP + 100 💎' },
  { days: 30, icon: '🌟', reward: '500 XP + 200 💎' },
  { days: 50, icon: '💪', reward: '1000 XP + 500 💎' },
  { days: 100, icon: '🏆', reward: '2000 XP + 1000 💎' },
  { days: 365, icon: '👑', reward: '10000 XP + 5000 💎' }
];

export default function StreakScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  // ✅ FIXED: Cast to any to avoid TypeScript errors
  const streakStore = useStreakStore() as any;
  const gamificationStore = useGamificationStore() as any;
  
  const current = streakStore.current || 0;
  const longest = streakStore.longest || 0;
  const freezesAvailable = streakStore.freezesAvailable || 0;
  const fetchStreak = streakStore.fetchStreak;
  const useFreeze = streakStore.useFreeze;
  const gems = gamificationStore.gems || 0;

  console.log(`${LOG_PREFIX} 🔥 Current streak: ${current}, Longest: ${longest}, Freezes: ${freezesAvailable}`);

  const [refreshing, setRefreshing] = useState(false);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Fetching streak data...`);
    if (typeof fetchStreak === 'function') {
      fetchStreak();
    }
    generateCalendar();
  }, []);

  const generateCalendar = () => {
    console.log(`${LOG_PREFIX} 📅 Generating calendar for last 30 days...`);
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({ date, completed: i < current, isToday: i === 0 });
    }
    setCalendarDays(days);
    console.log(`${LOG_PREFIX} ✅ Calendar generated: ${days.length} days`);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    if (typeof fetchStreak === 'function') {
      await fetchStreak();
    }
    generateCalendar();
    setRefreshing(false);
  };

  const handleUseFreeze = async () => {
    console.log(`${LOG_PREFIX} ❄️ Use freeze button pressed`);
    if (freezesAvailable <= 0) {
      console.log(`${LOG_PREFIX} ⚠️ No freezes available`);
      // ✅ AVANT: Alert.alert('لا يوجد تجميد!', 'يمكنك شراء تجميد من المتجر', ...)
      Alert.alert(
        t('streak.noFreeze'),
        t('streak.buyFreezeFromShop'),
        [
          { text: t('streak.shop'), onPress: () => navigation.navigate('Shop') },
          { text: t('common.cancel'), style: 'cancel' }
        ]
      );
      return;
    }
    // ✅ AVANT: Alert.alert('استخدام التجميد', 'هل تريد استخدام تجميد للحفاظ على سلسلتك؟', ...)
    Alert.alert(
      t('streak.useFreeze'),
      t('streak.useFreezeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('streak.use'), 
          onPress: async () => {
            console.log(`${LOG_PREFIX} ❄️ Freeze use confirmed`);
            if (typeof useFreeze === 'function') {
              console.log(`${LOG_PREFIX} 📤 Calling useFreeze()...`);
              const success = await useFreeze();
              if (success) {
                console.log(`${LOG_PREFIX} ✅ Freeze used successfully`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // ✅ AVANT: Alert.alert('✓ تم!', 'تم استخدام التجميد بنجاح');
                Alert.alert(`✓ ${t('common.done')}`, t('streak.freezeUsedSuccess'));
              } else {
                console.log(`${LOG_PREFIX} ❌ Freeze use failed`);
              }
            }
          }
        }
      ]
    );
  };

  const handleBuyFreeze = async () => {
    console.log(`${LOG_PREFIX} 💎 Buy freeze button pressed`);
    if (gems < 200) {
      console.log(`${LOG_PREFIX} ❌ Not enough gems: have ${gems}, need 200`);
      // ✅ AVANT: Alert.alert('جواهر غير كافية!', 'تحتاج 200 جوهرة لشراء تجميد');
      Alert.alert(t('streak.notEnoughGems'), t('streak.need200Gems'));
      return;
    }
    try {
      console.log(`${LOG_PREFIX} 📤 Calling streaksAPI.buyFreeze()...`);
      await streaksAPI.buyFreeze();
      console.log(`${LOG_PREFIX} ✅ Freeze purchased successfully`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (typeof fetchStreak === 'function') {
        fetchStreak();
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Buy freeze error:`, error);
    }
  };

  const nextMilestone = MILESTONES.find(m => m.days > current) || MILESTONES[MILESTONES.length - 1];
  const progress = (current / nextMilestone.days) * 100;

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (streak: ${current}, nextMilestone: ${nextMilestone.days} days)...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <Text style={styles.headerEmoji}>🔥</Text>
        <Text style={styles.streakCount}>{current}</Text>
        {/* ✅ AVANT: 'يوم متتالي' */}
        <Text style={styles.streakLabel}>{t('streak.consecutiveDays')}</Text>
        <View style={styles.longestBadge}>
          {/* ✅ AVANT: 'أطول سلسلة: X يوم' */}
          <Text style={styles.longestText}>{t('streak.longestStreak', { days: longest })}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          {/* ✅ AVANT: 'الهدف القادم: X يوم' */}
          <Text style={styles.progressTitle}>
            {t('streak.nextGoal', { days: nextMilestone.days })} {nextMilestone.icon}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          {/* ✅ AVANT: 'X/Y يوم' */}
          <Text style={styles.progressText}>{t('streak.progressDays', { current, total: nextMilestone.days })}</Text>
          {/* ✅ AVANT: 'المكافأة: X' */}
          <Text style={styles.rewardText}>{t('streak.reward')}: {nextMilestone.reward}</Text>
        </View>

        {/* Freeze Card */}
        <View style={styles.freezeCard}>
          <View style={styles.freezeHeader}>
            <Text style={styles.freezeIcon}>❄️</Text>
            <View>
              {/* ✅ AVANT: 'تجميد السلسلة' */}
              <Text style={styles.freezeTitle}>{t('streak.streakFreeze')}</Text>
              {/* ✅ AVANT: 'X متاح' */}
              <Text style={styles.freezeCount}>{t('streak.availableCount', { count: freezesAvailable })}</Text>
            </View>
          </View>
          <View style={styles.freezeActions}>
            <TouchableOpacity style={styles.freezeButton} onPress={handleUseFreeze}>
              {/* ✅ AVANT: 'استخدم' */}
              <Text style={styles.freezeButtonText}>{t('streak.use')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyFreezeButton} onPress={handleBuyFreeze}>
              {/* ✅ AVANT: 'شراء (200 💎)' */}
              <Text style={styles.buyFreezeText}>{t('streak.buyPrice', { price: 200 })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestones */}
        {/* ✅ AVANT: '🏆 المراحل' */}
        <Text style={styles.sectionTitle}>🏆 {t('streak.milestones')}</Text>
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

        {/* Calendar */}
        {/* ✅ AVANT: '📅 آخر 30 يوم' */}
        <Text style={styles.sectionTitle}>📅 {t('streak.last30Days')}</Text>
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

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          {/* ✅ AVANT: '🎁 فوائد السلسلة' */}
          <Text style={styles.benefitsTitle}>🎁 {t('streak.benefits')}</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            {/* ✅ AVANT: 'مكافأة XP يومية: +X XP' */}
            <Text style={styles.benefitText}>{t('streak.dailyXPBonus', { xp: Math.min(current, 50) })}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💎</Text>
            {/* ✅ AVANT: 'مضاعف الجواهر: xX.XX' */}
            <Text style={styles.benefitText}>
              {t('streak.gemsMultiplier', { multiplier: Math.min(1 + current * 0.01, 1.5).toFixed(2) })}
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🏅</Text>
            {/* ✅ AVANT: 'شارات حصرية عند كل مرحلة' */}
            <Text style={styles.benefitText}>{t('streak.exclusiveBadges')}</Text>
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
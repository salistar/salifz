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
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import { IconeSerie, IconeRecompense, IconeGemmes } from '../../components/common/Icones';

const LOG_PREFIX = '[StreakScreen.tsx]';

const MILESTONES = [
  // La recompense etait une chaine deja composee : « 100 XP + 50 💎 ». Les
  // deux nombres deviennent des champs, ce qui permet de les afficher avec
  // l'icone du produit et, le jour venu, de les localiser.
  { days: 7, xp: 100, gems: 50 },
  { days: 14, xp: 200, gems: 100 },
  { days: 30, xp: 500, gems: 200 },
  { days: 50, xp: 1000, gems: 500 },
  { days: 100, xp: 2000, gems: 1000 },
  { days: 365, xp: 10000, gems: 5000 }
];

export default function StreakScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);

  const streakStore = useStreakStore() as any;
  const gamificationStore = useGamificationStore() as any;

  const current = streakStore.current || 0;
  const longest = streakStore.longest || 0;
  const freezesAvailable = streakStore.freezesAvailable || 0;
  // Le store expose `loadStreak`. L'ancien nom `fetchStreak` n'existait pas,
  // et le garde `typeof === 'function'` transformait l'erreur en silence :
  // l'ecran affichait les valeurs par defaut du store (0 jour, 2 gels) en
  // paraissant fonctionner. Une serie de 6 jours s'affichait a 0.
  const fetchStreak = streakStore.loadStreak;
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
  }, []);

  // Regenere le calendrier quand la serie arrive du serveur : au montage,
  // `current` vaut encore 0 et les 30 jours sortiraient tous vides.
  useEffect(() => {
    generateCalendar();
  }, [current]);

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
                Alert.alert(t('common.done'), t('streak.freezeUsedSuccess'));
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
      <LinearGradient colors={[fixedColors.streak, '#F7931E']} style={styles.header}>
        <IconeSerie size={54} color={colors.onDeep} />
        <Text style={styles.streakCount}>{current}</Text>
        <Text style={styles.streakLabel}>{t('streak.consecutiveDays')}</Text>
        <View style={styles.longestBadge}>
          <Text style={styles.longestText}>{t('streak.longestStreak', { days: longest })}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            {t('streak.nextGoal', { days: nextMilestone.days })}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{t('streak.progressDays', { current, total: nextMilestone.days })}</Text>
          <View style={styles.rewardLigne}>
            <Text style={styles.rewardText}>{t('streak.reward')} : {nextMilestone.xp} XP</Text>
            <IconeGemmes size={14} color={colors.info} />
            <Text style={styles.rewardText}>{nextMilestone.gems}</Text>
          </View>
        </View>

        {/* Freeze Card */}
        <View style={styles.freezeCard}>
          <View style={styles.freezeHeader}>
            <IconeRecompense size={22} color={colors.info} />
            <View>
              <Text style={styles.freezeTitle}>{t('streak.streakFreeze')}</Text>
              <Text style={styles.freezeCount}>{t('streak.availableCount', { count: freezesAvailable })}</Text>
            </View>
          </View>
          <View style={styles.freezeActions}>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.freezeButton} onPress={handleUseFreeze}>
              <Text style={styles.freezeButtonText}>{t('streak.use')}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.buyFreezeButton} onPress={handleBuyFreeze}>
              <Text style={styles.buyFreezeText}>{t('streak.buyPrice', { price: 200 })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestones */}
        <Text style={styles.sectionTitle}>{t('streak.milestones')}</Text>
        <View style={styles.milestonesGrid}>
          {MILESTONES.map((milestone, index) => (
            <View
              key={index}
              style={[
                styles.milestoneItem,
                current >= milestone.days && styles.milestoneAchieved
              ]}
            >
              {/* L'etoile se remplit quand le palier est atteint : la forme
                  double la couleur, ce qui la rend lisible sans distinguer le
                  vert du gris. */}
              <View style={styles.milestoneIcon}>
                <HizbStar
                  size={24}
                  quarters={current >= milestone.days ? 4 : 0}
                  color={current >= milestone.days ? fixedColors.gold : colors.border}
                />
              </View>
              <Text style={styles.milestoneDays}>{milestone.days}</Text>
              {current >= milestone.days && (
                <View style={styles.milestoneCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>{t('streak.last30Days')}</Text>
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
                  <Ionicons name="checkmark" size={11} color={colors.onPrimary} />
                ) : (
                  <Text style={styles.calendarDayNumber}>{day.date.getDate()}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{t('streak.benefits')}</Text>
          <View style={styles.benefitItem}>
            <HizbStar size={16} quarters={4} color={colors.accent} />
            <Text style={styles.benefitText}>{t('streak.dailyXPBonus', { xp: Math.min(current, 50) })}</Text>
          </View>
          <View style={styles.benefitItem}>
            <HizbStar size={16} quarters={4} color={colors.accent} />
            <Text style={styles.benefitText}>
              {t('streak.gemsMultiplier', { multiplier: Math.min(1 + current * 0.01, 1.5).toFixed(2) })}
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <HizbStar size={16} quarters={4} color={colors.accent} />
            <Text style={styles.benefitText}>{t('streak.exclusiveBadges')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  headerEmoji: {},
  streakCount: { fontSize: 72, fontWeight: 'bold', color: c.onDeep },
  streakLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 18 },
  longestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15
  },
  longestText: { color: c.onDeep },
  content: { padding: 20 },
  progressCard: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2
  },
  progressTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  progressBar: {
    height: 12,
    backgroundColor: c.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10
  },
  progressFill: { height: '100%', backgroundColor: fixedColors.streak, borderRadius: 6 },
  progressText: { color: c.textSecondary, textAlign: 'center' },
  rewardText: { color: c.primary, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  freezeCard: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2
  },
  freezeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  freezeIcon: { marginRight: 15 },
  freezeTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  freezeCount: { color: c.textSecondary },
  freezeActions: { flexDirection: 'row' },
  freezeButton: {
    flex: 1,
    backgroundColor: c.infoSoft,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10
  },
  freezeButtonText: { color: c.infoStrong, fontWeight: 'bold' },
  buyFreezeButton: {
    flex: 1,
    backgroundColor: c.warningSoft,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  buyFreezeText: { color: c.warning, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  milestoneItem: {
    width: '30%',
    backgroundColor: c.surface,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1
  },
  milestoneAchieved: { backgroundColor: c.primarySoft },
  rewardLigne: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  milestoneIcon: { fontSize: 30, marginBottom: 5 },
  milestoneDays: { fontWeight: 'bold', color: c.text },
  milestoneCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkIcon: {},
  calendarCard: {
    backgroundColor: c.surface,
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
  calendarDayCompleted: { backgroundColor: c.primarySoft },
  calendarDayToday: { borderWidth: 2, borderColor: c.primary },
  calendarCheck: {},
  calendarDayNumber: { color: c.textMuted, fontSize: 12 },
  benefitsCard: { backgroundColor: c.surface, borderRadius: 20, padding: 20, elevation: 2 },
  benefitsTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitIcon: { marginRight: 12 },
  benefitText: { color: c.text, flex: 1 }
});
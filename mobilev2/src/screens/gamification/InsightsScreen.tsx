/**
 * ============================================
 * 📱 InsightsScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useGamificationStore, useStreakStore } from '../../stores';
import { aiAPI } from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import {
  IconeStatistiques,
  IconeSerie,
  IconeGemmes,
  IconeMushaf,
  IconeRevision,
  IconeVersetDuJour,
} from '../../components/common/Icones';

const { width } = Dimensions.get('window');

const LOG_PREFIX = '[InsightsScreen.tsx]';

export default function InsightsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);

  const { user } = useAuthStore();
  const { totalXP, level, streak, gems } = useGamificationStore();
  const streakCalendar = useStreakStore((etat: any) => etat.calendar);
  const chargerSerie = useStreakStore((etat: any) => etat.loadStreak);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  // Zéros tant qu'aucune donnée réelle n'existe. Les anciennes valeurs
  // (45 versets, 120 révisions, 87 %) étaient des constantes jamais mises à
  // jour : chaque utilisateur voyait la même semaine imaginaire. Un zéro
  // honnête vaut mieux qu'une progression inventée.
  const [weeklyStats, setWeeklyStats] = useState({
    ayahsMemorized: 0,
    reviewsDone: 0,
    timeSpent: 0,
    accuracy: 0,
    bestDay: null as string | null,
    worstDay: null as string | null
  });

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Loading insights...`);
    loadInsights();
    chargerSerie();
  }, []);

  const loadInsights = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD INSIGHTS START ==========`);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling aiAPI.getInsights()...`);
      const response = await aiAPI.getInsights();
      setInsights(response.insights);
      console.log(`${LOG_PREFIX} ✅ Insights loaded successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load insights error:`, error);
    }
    console.log(`${LOG_PREFIX} 📥 ========== LOAD INSIGHTS END ==========`);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  // L'activité de la semaine vient du calendrier de série — le seul relevé
  // quotidien réel que le serveur tient. Les barres étaient auparavant sept
  // constantes décoratives, identiques pour tout le monde.
  const JOURS = ['insights.days.sun', 'insights.days.mon', 'insights.days.tue',
    'insights.days.wed', 'insights.days.thu', 'insights.days.fri', 'insights.days.sat'];
  const calendrier = (streakCalendar || []).slice(-7);
  const progressData = calendrier.length
    ? calendrier.map((jour: any) => ({
        dayKey: JOURS[new Date(jour.date).getDay()] || 'insights.days.sun',
        value: jour.xpEarned || 0,
      }))
    : JOURS.map((dayKey) => ({ dayKey, value: 0 }));

  const maxValue = Math.max(1, ...progressData.map((d: any) => d.value));

  // Get memorization stats from user.quranProgress
  const totalAyahsMemorized = user?.quranProgress?.totalVersesMemorized || 0;
  const totalSurahsCompleted = user?.quranProgress?.totalSurahCompleted || 0;
  const totalJuzCompleted = user?.quranProgress?.totalJuzCompleted || 0;

  const getDayName = (dayKey: string) => {
    return t(`insights.fullDays.${dayKey}`);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (level: ${level}, streak: ${streak}, xp: ${totalXP})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.accent, colors.accentDeep]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.backButton}
          onPress={() => {
            console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('insights.title')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: colors.primarySoft }]}>
            <IconeMushaf size={22} color={colors.primary} />
            <Text style={styles.overviewValue}>{weeklyStats.ayahsMemorized}</Text>
            <Text style={styles.overviewLabel}>{t('insights.ayahsMemorized')}</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.infoSoft }]}>
            <IconeRevision size={22} color={colors.primary} />
            <Text style={styles.overviewValue}>{weeklyStats.reviewsDone}</Text>
            <Text style={styles.overviewLabel}>{t('insights.reviews')}</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.warningSoft }]}>
            <IconeSerie size={22} color={colors.primary} />
            <Text style={styles.overviewValue}>{weeklyStats.timeSpent}</Text>
            <Text style={styles.overviewLabel}>{t('insights.minutes')}</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('insights.weeklyActivity')}</Text>
          <View style={styles.chartContainer}>
            {progressData.map((item: any, index: number) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={[styles.bar, { height: `${(item.value / maxValue) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>{t(item.dayKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accuracy Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('insights.memorizationAccuracy')}</Text>
          <View style={styles.accuracyContainer}>
            <View style={styles.accuracyCircle}>
              <Text style={styles.accuracyValue}>{weeklyStats.accuracy}%</Text>
              <Text style={styles.accuracyLabel}>{t('insights.averageAccuracy')}</Text>
            </View>
            <View style={styles.accuracyDetails}>
              <View style={styles.accuracyItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.accuracyItemText}>
                  {t('insights.correctAnswers')}: {Math.round(weeklyStats.reviewsDone * weeklyStats.accuracy / 100)}
                </Text>
              </View>
              <View style={styles.accuracyItem}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
                <Text style={styles.accuracyItemText}>
                  {t('insights.wrongAnswers')}: {Math.round(weeklyStats.reviewsDone * (100 - weeklyStats.accuracy) / 100)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Best/Worst Days */}
        <View style={styles.daysRow}>
          <View style={[styles.dayCard, { backgroundColor: colors.primarySoft }]}>
            <HizbStar size={20} quarters={4} color={colors.accent} />
            <Text style={styles.dayTitle}>{t('insights.bestDay')}</Text>
            <Text style={styles.dayValue}>{weeklyStats.bestDay ? getDayName(weeklyStats.bestDay) : '—'}</Text>
          </View>
          <View style={[styles.dayCard, { backgroundColor: colors.errorSoft }]}>
            <HizbStar size={20} quarters={1} color={colors.textMuted} />
            <Text style={styles.dayTitle}>{t('insights.needsImprovement')}</Text>
            <Text style={styles.dayValue}>{weeklyStats.worstDay ? getDayName(weeklyStats.worstDay) : '—'}</Text>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('insights.aiRecommendations')}</Text>
          <View style={styles.recommendation}>
            <IconeVersetDuJour size={18} color={colors.accent} />
            <Text style={styles.recommendationText}>
              {t('insights.recommendation1')}
            </Text>
          </View>
          <View style={styles.recommendation}>
            <IconeVersetDuJour size={18} color={colors.accent} />
            <Text style={styles.recommendationText}>
              {t('insights.recommendation2')}
            </Text>
          </View>
          <View style={styles.recommendation}>
            <IconeSerie size={18} color={colors.accent} />
            <Text style={styles.recommendationText}>
              {t('insights.recommendation3', { streak })}
            </Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('insights.progressSummary')}</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('insights.currentLevel')}</Text>
            <Text style={styles.summaryValue}>{t('insights.levelX', { level })}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(totalXP % 100)}%` }]} />
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('insights.totalPoints')}</Text>
            <Text style={styles.summaryValue}>{totalXP} XP</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('insights.gemsEarned')}</Text>
            <Text style={styles.summaryValue}>{gems}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('insights.longestStreak')}</Text>
            <Text style={styles.summaryValue}>{t('insights.daysStreak', { days: streak })}</Text>
          </View>
        </View>

        {/* Memorization Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('insights.memorizationStats')}</Text>
          <View style={styles.memStatsRow}>
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalAyahsMemorized}</Text>
              <Text style={styles.memStatLabel}>{t('insights.ayah')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalSurahsCompleted}</Text>
              <Text style={styles.memStatLabel}>{t('insights.surah')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalJuzCompleted}</Text>
              <Text style={styles.memStatLabel}>{t('insights.juz')}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: c.onDeep, fontSize: 24 },
  headerTitle: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  overviewCard: { width: (width - 60) / 3, borderRadius: 15, padding: 15, alignItems: 'center' },
  overviewIcon: { marginBottom: 5 },
  overviewValue: { fontSize: 24, fontWeight: 'bold', color: c.text },
  overviewLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
  card: { backgroundColor: c.surface, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 120, width: 25, backgroundColor: c.border, borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 10, color: c.textSecondary, marginTop: 5 },
  accuracyContainer: { flexDirection: 'row', alignItems: 'center' },
  accuracyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: c.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  accuracyValue: { fontSize: 28, fontWeight: 'bold', color: c.primary },
  accuracyLabel: { fontSize: 10, color: c.textSecondary },
  accuracyDetails: { flex: 1 },
  accuracyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  accuracyItemIcon: { marginRight: 10 },
  accuracyItemText: { fontSize: 14, color: c.textSecondary },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCard: { width: (width - 50) / 2, borderRadius: 15, padding: 20, alignItems: 'center' },
  dayIcon: { marginBottom: 10 },
  dayTitle: { fontSize: 12, color: c.textSecondary },
  dayValue: { fontSize: 18, fontWeight: 'bold', color: c.text, marginTop: 5 },
  recommendation: { flexDirection: 'row', backgroundColor: c.background, borderRadius: 12, padding: 15, marginBottom: 10 },
  recommendationIcon: { marginRight: 10 },
  recommendationText: { flex: 1, fontSize: 14, color: c.text, lineHeight: 22 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  summaryLabel: { fontSize: 14, color: c.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: c.text },
  progressBar: { height: 8, backgroundColor: c.border, borderRadius: 4, marginVertical: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 4 },
  memStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  memStatItem: { alignItems: 'center' },
  memStatValue: { fontSize: 32, fontWeight: 'bold', color: c.primary },
  memStatLabel: { fontSize: 14, color: c.textSecondary, marginTop: 5 },
  memStatDivider: { width: 1, height: 50, backgroundColor: c.border }
});
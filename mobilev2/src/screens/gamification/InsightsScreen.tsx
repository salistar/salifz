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
import { useAuthStore, useGamificationStore } from '../../stores';
import { aiAPI } from '../../services/api';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[InsightsScreen.tsx]';

export default function InsightsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { user } = useAuthStore();
  const { totalXP, level, streak, gems } = useGamificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState({
    ayahsMemorized: 45,
    reviewsDone: 120,
    timeSpent: 180,
    accuracy: 87,
    bestDay: 'friday', // ✅ CHANGÉ: clé au lieu de texte
    worstDay: 'monday' // ✅ CHANGÉ: clé au lieu de texte
  });

  useEffect(() => { 
    console.log(`${LOG_PREFIX} 🔄 useEffect: Loading insights...`);
    loadInsights(); 
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

  // ✅ AVANT: jours en arabe hardcodés
  // ✅ APRÈS: clés i18n pour les jours abrégés
  const progressData = [
    { dayKey: 'insights.days.sat', value: 30 },
    { dayKey: 'insights.days.sun', value: 45 },
    { dayKey: 'insights.days.mon', value: 20 },
    { dayKey: 'insights.days.tue', value: 60 },
    { dayKey: 'insights.days.wed', value: 55 },
    { dayKey: 'insights.days.thu', value: 40 },
    { dayKey: 'insights.days.fri', value: 80 }
  ];

  const maxValue = Math.max(...progressData.map(d => d.value));

  // Get memorization stats from user.quranProgress
  const totalAyahsMemorized = user?.quranProgress?.totalVersesMemorized || 156;
  const totalSurahsCompleted = user?.quranProgress?.totalSurahCompleted || 5;
  const totalJuzCompleted = user?.quranProgress?.totalJuzCompleted || 0;

  // ✅ Helper pour obtenir le nom du jour traduit
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
        {/* ✅ AVANT: '📊 تحليلات الأداء' */}
        <Text style={styles.headerTitle}>📊 {t('insights.title')}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={styles.overviewIcon}>📖</Text>
            <Text style={styles.overviewValue}>{weeklyStats.ayahsMemorized}</Text>
            {/* ✅ AVANT: 'آية محفوظة' */}
            <Text style={styles.overviewLabel}>{t('insights.ayahsMemorized')}</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.infoSoft }]}>
            <Text style={styles.overviewIcon}>🔄</Text>
            <Text style={styles.overviewValue}>{weeklyStats.reviewsDone}</Text>
            {/* ✅ AVANT: 'مراجعة' */}
            <Text style={styles.overviewLabel}>{t('insights.reviews')}</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.warningSoft }]}>
            <Text style={styles.overviewIcon}>⏱️</Text>
            <Text style={styles.overviewValue}>{weeklyStats.timeSpent}</Text>
            {/* ✅ AVANT: 'دقيقة' */}
            <Text style={styles.overviewLabel}>{t('insights.minutes')}</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.card}>
          {/* ✅ AVANT: '📈 نشاط الأسبوع' */}
          <Text style={styles.cardTitle}>📈 {t('insights.weeklyActivity')}</Text>
          <View style={styles.chartContainer}>
            {progressData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={[styles.bar, { height: `${(item.value / maxValue) * 100}%` }]}
                  />
                </View>
                {/* ✅ AVANT: {item.day} hardcodé */}
                <Text style={styles.barLabel}>{t(item.dayKey)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accuracy Card */}
        <View style={styles.card}>
          {/* ✅ AVANT: '🎯 دقة الحفظ' */}
          <Text style={styles.cardTitle}>🎯 {t('insights.memorizationAccuracy')}</Text>
          <View style={styles.accuracyContainer}>
            <View style={styles.accuracyCircle}>
              <Text style={styles.accuracyValue}>{weeklyStats.accuracy}%</Text>
              {/* ✅ AVANT: 'متوسط الدقة' */}
              <Text style={styles.accuracyLabel}>{t('insights.averageAccuracy')}</Text>
            </View>
            <View style={styles.accuracyDetails}>
              <View style={styles.accuracyItem}>
                <Text style={styles.accuracyItemIcon}>✅</Text>
                {/* ✅ AVANT: 'إجابات صحيحة: X' */}
                <Text style={styles.accuracyItemText}>
                  {t('insights.correctAnswers')}: {Math.round(weeklyStats.reviewsDone * weeklyStats.accuracy / 100)}
                </Text>
              </View>
              <View style={styles.accuracyItem}>
                <Text style={styles.accuracyItemIcon}>❌</Text>
                {/* ✅ AVANT: 'إجابات خاطئة: X' */}
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
            <Text style={styles.dayIcon}>🌟</Text>
            {/* ✅ AVANT: 'أفضل يوم' */}
            <Text style={styles.dayTitle}>{t('insights.bestDay')}</Text>
            {/* ✅ AVANT: {weeklyStats.bestDay} hardcodé en arabe */}
            <Text style={styles.dayValue}>{getDayName(weeklyStats.bestDay)}</Text>
          </View>
          <View style={[styles.dayCard, { backgroundColor: colors.errorSoft }]}>
            <Text style={styles.dayIcon}>📉</Text>
            {/* ✅ AVANT: 'يحتاج تحسين' */}
            <Text style={styles.dayTitle}>{t('insights.needsImprovement')}</Text>
            {/* ✅ AVANT: {weeklyStats.worstDay} hardcodé en arabe */}
            <Text style={styles.dayValue}>{getDayName(weeklyStats.worstDay)}</Text>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.card}>
          {/* ✅ AVANT: '🤖 توصيات الذكاء الاصطناعي' */}
          <Text style={styles.cardTitle}>🤖 {t('insights.aiRecommendations')}</Text>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>💡</Text>
            {/* ✅ AVANT: 'أداؤك ممتاز في أيام الجمعة!...' */}
            <Text style={styles.recommendationText}>
              {t('insights.recommendation1')}
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>🎯</Text>
            {/* ✅ AVANT: 'دقة حفظك عالية...' */}
            <Text style={styles.recommendationText}>
              {t('insights.recommendation2')}
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>🔥</Text>
            {/* ✅ AVANT: 'سلسلتك الحالية X يوم!...' */}
            <Text style={styles.recommendationText}>
              {t('insights.recommendation3', { streak })}
            </Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.card}>
          {/* ✅ AVANT: '📋 ملخص التقدم' */}
          <Text style={styles.cardTitle}>📋 {t('insights.progressSummary')}</Text>
          <View style={styles.summaryItem}>
            {/* ✅ AVANT: 'المستوى الحالي' */}
            <Text style={styles.summaryLabel}>{t('insights.currentLevel')}</Text>
            {/* ✅ AVANT: 'المستوى X' */}
            <Text style={styles.summaryValue}>{t('insights.levelX', { level })}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(totalXP % 100)}%` }]} />
          </View>
          <View style={styles.summaryItem}>
            {/* ✅ AVANT: 'إجمالي النقاط' */}
            <Text style={styles.summaryLabel}>{t('insights.totalPoints')}</Text>
            <Text style={styles.summaryValue}>{totalXP} XP</Text>
          </View>
          <View style={styles.summaryItem}>
            {/* ✅ AVANT: 'الجواهر المكتسبة' */}
            <Text style={styles.summaryLabel}>{t('insights.gemsEarned')}</Text>
            <Text style={styles.summaryValue}>{gems} 💎</Text>
          </View>
          <View style={styles.summaryItem}>
            {/* ✅ AVANT: 'أطول سلسلة' */}
            <Text style={styles.summaryLabel}>{t('insights.longestStreak')}</Text>
            {/* ✅ AVANT: 'X يوم 🔥' */}
            <Text style={styles.summaryValue}>{t('insights.daysStreak', { days: streak })} 🔥</Text>
          </View>
        </View>

        {/* Memorization Stats */}
        <View style={styles.card}>
          {/* ✅ AVANT: '📖 إحصائيات الحفظ' */}
          <Text style={styles.cardTitle}>📖 {t('insights.memorizationStats')}</Text>
          <View style={styles.memStatsRow}>
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalAyahsMemorized}</Text>
              {/* ✅ AVANT: 'آية' */}
              <Text style={styles.memStatLabel}>{t('insights.ayah')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalSurahsCompleted}</Text>
              {/* ✅ AVANT: 'سورة' */}
              <Text style={styles.memStatLabel}>{t('insights.surah')}</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalJuzCompleted}</Text>
              {/* ✅ AVANT: 'جزء' */}
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
  overviewIcon: { fontSize: 24, marginBottom: 5 },
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
  accuracyItemIcon: { fontSize: 16, marginRight: 10 },
  accuracyItemText: { fontSize: 14, color: c.textSecondary },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCard: { width: (width - 50) / 2, borderRadius: 15, padding: 20, alignItems: 'center' },
  dayIcon: { fontSize: 30, marginBottom: 10 },
  dayTitle: { fontSize: 12, color: c.textSecondary },
  dayValue: { fontSize: 18, fontWeight: 'bold', color: c.text, marginTop: 5 },
  recommendation: { flexDirection: 'row', backgroundColor: c.background, borderRadius: 12, padding: 15, marginBottom: 10 },
  recommendationIcon: { fontSize: 20, marginRight: 10 },
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
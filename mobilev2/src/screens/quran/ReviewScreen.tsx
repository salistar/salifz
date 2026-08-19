/**
 * ============================================
 * 📱 ReviewScreen.tsx - Salifz
 * ============================================
 * ✅ DEBUG VERSION: Console logs on every action
 * ✅ CONVERTED: i18n integration
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { aiAPI, progressAPI } from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import { IconeRevision, IconeSerie, IconeStatistiques, IconeMushaf, IconeDefis } from '../../components/common/Icones';

const LOG_PREFIX = '[ReviewScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

export default function ReviewScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering...`);

  const [reviewData, setReviewData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log(`${LOG_PREFIX} 📊 Initial state - loading: ${loading}, refreshing: ${refreshing}`);
  console.log(`${LOG_PREFIX} 📊 Review data: ${reviewData ? 'loaded' : 'null'}`);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect triggered - Component mounted`);
    console.log(`${LOG_PREFIX} 📡 Calling loadReviewData()`);
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    console.log(`${LOG_PREFIX} 📥 loadReviewData() called`);

    try {
      console.log(`${LOG_PREFIX} 🌐 BACKEND API CALL - aiAPI.getSmartReview()`);
      console.log(`${LOG_PREFIX} 🔗 API Endpoint: /api/ai/smart-review (GET)`);

      const response = await aiAPI.getSmartReview();

      console.log(`${LOG_PREFIX} ✅ API Response received`);
      console.log(`${LOG_PREFIX} 📦 Response:`, JSON.stringify(response).substring(0, 300));

      if (response.reviewSession) {
        console.log(`${LOG_PREFIX} 📊 Review session found`);
        console.log(`${LOG_PREFIX} 📊 Due for review: ${response.reviewSession.dueForReview?.length || 0} items`);
        console.log(`${LOG_PREFIX} 📊 Weak areas: ${response.reviewSession.weakAreas?.length || 0} items`);
        console.log(`${LOG_PREFIX} 📊 Estimated XP: ${response.reviewSession.estimatedXp || 0}`);

        setReviewData(response.reviewSession);
        console.log(`${LOG_PREFIX} ✅ Review data state updated`);
      } else {
        console.log(`${LOG_PREFIX} ⚠️ No reviewSession in response`);
        setReviewData(null);
      }

    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ ERROR in loadReviewData():`, error);
      console.error(`${LOG_PREFIX} ❌ Error message: ${error.message}`);
      console.error(`${LOG_PREFIX} ❌ Error details:`, JSON.stringify(error));
    }

    console.log(`${LOG_PREFIX} ⏳ Setting loading to false`);
    setLoading(false);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 onRefresh() called - Pull to refresh triggered`);

    setRefreshing(true);
    console.log(`${LOG_PREFIX} ⏳ Refreshing state set to true`);

    await loadReviewData();

    setRefreshing(false);
    console.log(`${LOG_PREFIX} ✅ Refresh complete`);
  };

  const startReview = (type: string, duration: number) => {
    console.log(`${LOG_PREFIX} ▶️ startReview() called`);
    console.log(`${LOG_PREFIX} 📊 Review type: ${type}`);
    console.log(`${LOG_PREFIX} 📊 Duration: ${duration} minutes`);

    console.log(`${LOG_PREFIX} 📳 Triggering medium haptic feedback`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const navParams = { reviewMode: true, type, duration };
    console.log(`${LOG_PREFIX} 🧭 Navigating to LessonDetail`);
    console.log(`${LOG_PREFIX} 📦 Navigation params:`, JSON.stringify(navParams));

    navigation.navigate('LessonDetail', navParams);

    console.log(`${LOG_PREFIX} ✅ Navigation triggered`);
  };

  // Loading state
  if (loading) {
    console.log(`${LOG_PREFIX} ⏳ Rendering loading state`);
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.warning, colors.warningStrong]} style={styles.header}>
          <IconeRevision size={40} color={colors.onDeep} />
          <Text style={styles.headerTitle}>{t('review.title')}</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  console.log(`${LOG_PREFIX} 🎨 Rendering main UI...`);
  console.log(`${LOG_PREFIX} 📊 Render data:`);
  console.log(`${LOG_PREFIX}   - Due for review: ${reviewData?.dueForReview?.length || 0}`);
  console.log(`${LOG_PREFIX}   - Weak areas: ${reviewData?.weakAreas?.length || 0}`);
  console.log(`${LOG_PREFIX}   - Estimated XP: ${reviewData?.estimatedXp || 0}`);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.warning, colors.warningStrong]} style={styles.header}>
        <IconeRevision size={40} color={colors.onDeep} />
        <Text style={styles.headerTitle}>{t('review.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('review.subtitle')}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Due for Review Card */}
        {reviewData?.dueForReview?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconeSerie size={26} color={colors.primary} />
              <View>
                <Text style={styles.cardTitle}>{t('review.dueForReview')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('review.ayahCount', { count: reviewData.dueForReview.length })}
                </Text>
              </View>
            </View>
            <View style={styles.previewList}>
              {reviewData.dueForReview.slice(0, 3).map((item: any, index: number) => {
                console.log(`${LOG_PREFIX} 📋 Rendering due item ${index}: surah=${item.surahId}, ayah=${item.ayahId}, strength=${item.strength}%`);
                return (
                  <View key={index} style={styles.previewItem}>
                    <Text style={styles.previewText}>
                      {t('review.surahAyah', { surah: item.surahId, ayah: item.ayahId })}
                    </Text>
                    <View style={[
                      styles.strengthBadge,
                      { backgroundColor: item.strength > 70 ? colors.primarySoft : item.strength > 40 ? colors.warningSoft : colors.errorSoft }
                    ]}>
                      <Text style={[
                        styles.strengthText,
                        { color: item.strength > 70 ? colors.primary : item.strength > 40 ? colors.warning : colors.error }
                      ]}>
                        {item.strength}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.startButton}
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 "Start Review" button pressed`);
                startReview('due', 0);
              }}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.startGradient}>
                <Text style={styles.startText}>{t('review.startReview')}</Text>
                <Text style={styles.startXp}>+{reviewData.estimatedXp} XP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Weak Areas Card */}
        {reviewData?.weakAreas?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconeDefis size={26} color={colors.warning} />
              <View>
                <Text style={styles.cardTitle}>{t('review.weakAreas')}</Text>
                <Text style={styles.cardSubtitle}>
                  {t('review.weakAreasCount', { count: reviewData.weakAreas.length })}
                </Text>
              </View>
            </View>
            <View style={styles.previewList}>
              {reviewData.weakAreas.slice(0, 3).map((item: any, index: number) => {
                console.log(`${LOG_PREFIX} 📋 Rendering weak area ${index}: surah=${item.surahId}, ayah=${item.ayahId}, strength=${item.strength}%`);
                return (
                  <View key={index} style={styles.previewItem}>
                    <Text style={styles.previewText}>
                      {t('review.surahAyah', { surah: item.surahId, ayah: item.ayahId })}
                    </Text>
                    <View style={[styles.strengthBadge, { backgroundColor: colors.errorSoft }]}>
                      <Text style={[styles.strengthText, { color: colors.error }]}>{item.strength}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.startButton}
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 "Strengthen" button pressed`);
                startReview('weak', 0);
              }}
            >
              <LinearGradient colors={[colors.warning, colors.warningStrong]} style={styles.startGradient}>
                <Text style={styles.startText}>{t('review.strengthen')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Review Section */}
        <Text style={styles.sectionTitle}>⏱️ {t('review.quickReview')}</Text>
        <View style={styles.quickOptions}>
          {[
            { duration: 5, Icone: IconeSerie },
            { duration: 10, Icone: IconeMushaf },
            { duration: 15, Icone: IconeDefis }
          ].map((option, index) => (
            <TouchableOpacity accessible accessibilityRole="button"
              key={index}
              style={styles.quickOption}
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 Quick review ${option.duration} min pressed`);
                startReview('quick', option.duration);
              }}
            >
              <View style={styles.quickIcon}>
                <option.Icone size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickDuration}>
                {t('review.minutes', { count: option.duration })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{t('review.stats.title')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>{t('review.stats.todayReviews')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>{t('review.stats.weeklyAccuracy')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>{t('review.stats.consecutiveDays')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>{t('review.stats.totalReviews')}</Text>
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
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: {},
  headerTitle: { color: c.onDeep, fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: c.textSecondary },
  content: { padding: 20 },
  card: { backgroundColor: c.surface, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardIcon: { marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: c.text },
  cardSubtitle: { color: c.textSecondary, marginTop: 2 },
  previewList: { marginBottom: 15 },
  previewItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  previewText: { color: c.text },
  strengthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  strengthText: { fontWeight: 'bold', fontSize: 12 },
  startButton: { borderRadius: 15, overflow: 'hidden' },
  startGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  startText: { color: c.onDeep, fontSize: 16, fontWeight: 'bold' },
  startXp: { color: 'rgba(255,255,255,0.8)', marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 15, marginTop: 10 },
  quickOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickOption: { backgroundColor: c.surface, borderRadius: 15, padding: 20, alignItems: 'center', flex: 1, marginHorizontal: 5, elevation: 2 },
  quickIcon: { marginBottom: 8 },
  quickDuration: { color: c.text, fontWeight: '600' },
  statsCard: { backgroundColor: c.surface, borderRadius: 20, padding: 20, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', alignItems: 'center', paddingVertical: 10 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: c.primary },
  statLabel: { color: c.textSecondary, fontSize: 12, marginTop: 2 }
});
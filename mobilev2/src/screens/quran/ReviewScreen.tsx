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
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const LOG_PREFIX = '[ReviewScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

export default function ReviewScreen({ navigation }: any) {
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
        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
          <Text style={styles.headerIcon}>🔄</Text>
          {/* ✅ AVANT: 'المراجعة الذكية' */}
          <Text style={styles.headerTitle}>{t('review.title')}</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          {/* ✅ AVANT: 'جاري التحميل...' */}
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
      <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
        <Text style={styles.headerIcon}>🔄</Text>
        {/* ✅ AVANT: 'المراجعة الذكية' */}
        <Text style={styles.headerTitle}>{t('review.title')}</Text>
        {/* ✅ AVANT: 'نظام التكرار المتباعد (SM-2)' */}
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
              <Text style={styles.cardIcon}>📅</Text>
              <View>
                {/* ✅ AVANT: 'مستحق للمراجعة' */}
                <Text style={styles.cardTitle}>{t('review.dueForReview')}</Text>
                {/* ✅ AVANT: '{X} آية' */}
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
                    {/* ✅ AVANT: 'سورة {X} - آية {Y}' */}
                    <Text style={styles.previewText}>
                      {t('review.surahAyah', { surah: item.surahId, ayah: item.ayahId })}
                    </Text>
                    <View style={[
                      styles.strengthBadge, 
                      { backgroundColor: item.strength > 70 ? '#E8F5E9' : item.strength > 40 ? '#FFF3E0' : '#FFEBEE' }
                    ]}>
                      <Text style={[
                        styles.strengthText, 
                        { color: item.strength > 70 ? '#4CAF50' : item.strength > 40 ? '#FF9800' : '#F44336' }
                      ]}>
                        {item.strength}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 "Start Review" button pressed`);
                startReview('due', 0);
              }}
            >
              <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.startGradient}>
                {/* ✅ AVANT: 'ابدأ المراجعة' */}
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
              <Text style={styles.cardIcon}>⚠️</Text>
              <View>
                {/* ✅ AVANT: 'نقاط ضعف' */}
                <Text style={styles.cardTitle}>{t('review.weakAreas')}</Text>
                {/* ✅ AVANT: '{X} آية تحتاج تقوية' */}
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
                    {/* ✅ AVANT: 'سورة {X} - آية {Y}' */}
                    <Text style={styles.previewText}>
                      {t('review.surahAyah', { surah: item.surahId, ayah: item.ayahId })}
                    </Text>
                    <View style={[styles.strengthBadge, { backgroundColor: '#FFEBEE' }]}>
                      <Text style={[styles.strengthText, { color: '#F44336' }]}>{item.strength}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 "Strengthen" button pressed`);
                startReview('weak', 0);
              }}
            >
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.startGradient}>
                {/* ✅ AVANT: 'تقوية' */}
                <Text style={styles.startText}>{t('review.strengthen')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Review Section */}
        {/* ✅ AVANT: '⏱️ مراجعة سريعة' */}
        <Text style={styles.sectionTitle}>⏱️ {t('review.quickReview')}</Text>
        <View style={styles.quickOptions}>
          {[
            { duration: 5, icon: '⚡' }, 
            { duration: 10, icon: '📖' }, 
            { duration: 15, icon: '🎯' }
          ].map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.quickOption} 
              onPress={() => {
                console.log(`${LOG_PREFIX} 👆 Quick review ${option.duration} min pressed`);
                startReview('quick', option.duration);
              }}
            >
              <Text style={styles.quickIcon}>{option.icon}</Text>
              {/* ✅ AVANT: '{X} دقائق' */}
              <Text style={styles.quickDuration}>
                {t('review.minutes', { count: option.duration })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {/* ✅ AVANT: '📊 إحصائيات المراجعة' */}
          <Text style={styles.statsTitle}>📊 {t('review.stats.title')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              {/* ✅ AVANT: 'مراجعات اليوم' */}
              <Text style={styles.statLabel}>{t('review.stats.todayReviews')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              {/* ✅ AVANT: 'دقة أسبوعية' */}
              <Text style={styles.statLabel}>{t('review.stats.weeklyAccuracy')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              {/* ✅ AVANT: 'أيام متتالية' */}
              <Text style={styles.statLabel}>{t('review.stats.consecutiveDays')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              {/* ✅ AVANT: 'إجمالي المراجعات' */}
              <Text style={styles.statLabel}>{t('review.stats.totalReviews')}</Text>
            </View>
          </View>
        </View>

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
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#666' },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardIcon: { fontSize: 35, marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { color: '#666', marginTop: 2 },
  previewList: { marginBottom: 15 },
  previewItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  previewText: { color: '#333' },
  strengthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  strengthText: { fontWeight: 'bold', fontSize: 12 },
  startButton: { borderRadius: 15, overflow: 'hidden' },
  startGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  startText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  startXp: { color: 'rgba(255,255,255,0.8)', marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  quickOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickOption: { backgroundColor: '#fff', borderRadius: 15, padding: 20, alignItems: 'center', flex: 1, marginHorizontal: 5, elevation: 2 },
  quickIcon: { fontSize: 30, marginBottom: 8 },
  quickDuration: { color: '#333', fontWeight: '600' },
  statsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', alignItems: 'center', paddingVertical: 10 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { color: '#666', fontSize: 12, marginTop: 2 }
});
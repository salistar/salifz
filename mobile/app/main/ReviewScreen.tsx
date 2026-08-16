/**
 * ReviewScreen - Salifz
 * ✅ DEBUG VERSION: Console logs on every action
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { aiAPI, progressAPI } from '../../services/api';
import { COLORS } from '../../config';

const FILE_NAME = '[ReviewScreen]';

console.log(`${FILE_NAME} 📁 File loaded`);

export default function ReviewScreen({ navigation }: any) {
  console.log(`${FILE_NAME} 🚀 Component rendering...`);
  
  const [reviewData, setReviewData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  console.log(`${FILE_NAME} 📊 Initial state - loading: ${loading}, refreshing: ${refreshing}`);
  console.log(`${FILE_NAME} 📊 Review data: ${reviewData ? 'loaded' : 'null'}`);

  useEffect(() => { 
    console.log(`${FILE_NAME} ⚡ useEffect triggered - Component mounted`);
    console.log(`${FILE_NAME} 📡 Calling loadReviewData()`);
    loadReviewData(); 
  }, []);

  const loadReviewData = async () => {
    console.log(`${FILE_NAME} 📥 loadReviewData() called`);
    
    try {
      console.log(`${FILE_NAME} 🌐 BACKEND API CALL - aiAPI.getSmartReview()`);
      console.log(`${FILE_NAME} 🔗 API Endpoint: /api/ai/smart-review (GET)`);
      
      const response = await aiAPI.getSmartReview();
      
      console.log(`${FILE_NAME} ✅ API Response received`);
      console.log(`${FILE_NAME} 📦 Response:`, JSON.stringify(response).substring(0, 300));
      
      if (response.reviewSession) {
        console.log(`${FILE_NAME} 📊 Review session found`);
        console.log(`${FILE_NAME} 📊 Due for review: ${response.reviewSession.dueForReview?.length || 0} items`);
        console.log(`${FILE_NAME} 📊 Weak areas: ${response.reviewSession.weakAreas?.length || 0} items`);
        console.log(`${FILE_NAME} 📊 Estimated XP: ${response.reviewSession.estimatedXp || 0}`);
        
        setReviewData(response.reviewSession);
        console.log(`${FILE_NAME} ✅ Review data state updated`);
      } else {
        console.log(`${FILE_NAME} ⚠️ No reviewSession in response`);
        setReviewData(null);
      }
      
    } catch (error: any) { 
      console.error(`${FILE_NAME} ❌ ERROR in loadReviewData():`, error);
      console.error(`${FILE_NAME} ❌ Error message: ${error.message}`);
      console.error(`${FILE_NAME} ❌ Error details:`, JSON.stringify(error));
    }
    
    console.log(`${FILE_NAME} ⏳ Setting loading to false`);
    setLoading(false);
  };

  const onRefresh = async () => { 
    console.log(`${FILE_NAME} 🔄 onRefresh() called - Pull to refresh triggered`);
    
    setRefreshing(true); 
    console.log(`${FILE_NAME} ⏳ Refreshing state set to true`);
    
    await loadReviewData(); 
    
    setRefreshing(false); 
    console.log(`${FILE_NAME} ✅ Refresh complete`);
  };

  const startReview = (type: string, duration: number) => {
    console.log(`${FILE_NAME} ▶️ startReview() called`);
    console.log(`${FILE_NAME} 📊 Review type: ${type}`);
    console.log(`${FILE_NAME} 📊 Duration: ${duration} minutes`);
    
    console.log(`${FILE_NAME} 📳 Triggering medium haptic feedback`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const navParams = { reviewMode: true, type, duration };
    console.log(`${FILE_NAME} 🧭 Navigating to LessonDetail`);
    console.log(`${FILE_NAME} 📦 Navigation params:`, JSON.stringify(navParams));
    
    navigation.navigate('LessonDetail', navParams);
    
    console.log(`${FILE_NAME} ✅ Navigation triggered`);
  };

  // Loading state
  if (loading) {
    console.log(`${FILE_NAME} ⏳ Rendering loading state`);
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
          <Text style={styles.headerIcon}>🔄</Text>
          <Text style={styles.headerTitle}>المراجعة الذكية</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  console.log(`${FILE_NAME} 🎨 Rendering main UI...`);
  console.log(`${FILE_NAME} 📊 Render data:`);
  console.log(`${FILE_NAME}   - Due for review: ${reviewData?.dueForReview?.length || 0}`);
  console.log(`${FILE_NAME}   - Weak areas: ${reviewData?.weakAreas?.length || 0}`);
  console.log(`${FILE_NAME}   - Estimated XP: ${reviewData?.estimatedXp || 0}`);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.header}>
        <Text style={styles.headerIcon}>🔄</Text>
        <Text style={styles.headerTitle}>المراجعة الذكية</Text>
        <Text style={styles.headerSubtitle}>نظام التكرار المتباعد (SM-2)</Text>
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
                <Text style={styles.cardTitle}>مستحق للمراجعة</Text>
                <Text style={styles.cardSubtitle}>{reviewData.dueForReview.length} آية</Text>
              </View>
            </View>
            <View style={styles.previewList}>
              {reviewData.dueForReview.slice(0, 3).map((item: any, index: number) => {
                console.log(`${FILE_NAME} 📋 Rendering due item ${index}: surah=${item.surahId}, ayah=${item.ayahId}, strength=${item.strength}%`);
                return (
                  <View key={index} style={styles.previewItem}>
                    <Text style={styles.previewText}>سورة {item.surahId} - آية {item.ayahId}</Text>
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
                console.log(`${FILE_NAME} 👆 "ابدأ المراجعة" button pressed`);
                startReview('due', 0);
              }}
            >
              <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.startGradient}>
                <Text style={styles.startText}>ابدأ المراجعة</Text>
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
                <Text style={styles.cardTitle}>نقاط ضعف</Text>
                <Text style={styles.cardSubtitle}>{reviewData.weakAreas.length} آية تحتاج تقوية</Text>
              </View>
            </View>
            <View style={styles.previewList}>
              {reviewData.weakAreas.slice(0, 3).map((item: any, index: number) => {
                console.log(`${FILE_NAME} 📋 Rendering weak area ${index}: surah=${item.surahId}, ayah=${item.ayahId}, strength=${item.strength}%`);
                return (
                  <View key={index} style={styles.previewItem}>
                    <Text style={styles.previewText}>سورة {item.surahId} - آية {item.ayahId}</Text>
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
                console.log(`${FILE_NAME} 👆 "تقوية" button pressed`);
                startReview('weak', 0);
              }}
            >
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.startGradient}>
                <Text style={styles.startText}>تقوية</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Review Section */}
        <Text style={styles.sectionTitle}>⏱️ مراجعة سريعة</Text>
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
                console.log(`${FILE_NAME} 👆 Quick review ${option.duration} min pressed`);
                startReview('quick', option.duration);
              }}
            >
              <Text style={styles.quickIcon}>{option.icon}</Text>
              <Text style={styles.quickDuration}>{option.duration} دقائق</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 إحصائيات المراجعة</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>مراجعات اليوم</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>دقة أسبوعية</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>أيام متتالية</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>إجمالي المراجعات</Text>
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
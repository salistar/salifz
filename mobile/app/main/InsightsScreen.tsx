import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore, useGamificationStore } from '../../stores';
import { aiAPI } from '../../services/api';
import { COLORS } from '../../config';

const { width } = Dimensions.get('window');

export default function InsightsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { totalXP, level, streak, gems } = useGamificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState({
    ayahsMemorized: 45,
    reviewsDone: 120,
    timeSpent: 180,
    accuracy: 87,
    bestDay: 'الجمعة',
    worstDay: 'الإثنين'
  });

  useEffect(() => { loadInsights(); }, []);

  const loadInsights = async () => {
    try {
      const response = await aiAPI.getInsights();
      setInsights(response.insights);
    } catch (error) {
      console.error('Load insights error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const progressData = [
    { day: 'سبت', value: 30 },
    { day: 'أحد', value: 45 },
    { day: 'إثن', value: 20 },
    { day: 'ثلا', value: 60 },
    { day: 'أرب', value: 55 },
    { day: 'خمي', value: 40 },
    { day: 'جمع', value: 80 }
  ];

  const maxValue = Math.max(...progressData.map(d => d.value));

  // Get memorization stats from user.quranProgress
  const totalAyahsMemorized = user?.quranProgress?.totalVersesMemorized || 156;
  const totalSurahsCompleted = user?.quranProgress?.totalSurahCompleted || 5;
  const totalJuzCompleted = user?.quranProgress?.totalJuzCompleted || 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 تحليلات الأداء</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.overviewIcon}>📖</Text>
            <Text style={styles.overviewValue}>{weeklyStats.ayahsMemorized}</Text>
            <Text style={styles.overviewLabel}>آية محفوظة</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.overviewIcon}>🔄</Text>
            <Text style={styles.overviewValue}>{weeklyStats.reviewsDone}</Text>
            <Text style={styles.overviewLabel}>مراجعة</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.overviewIcon}>⏱️</Text>
            <Text style={styles.overviewValue}>{weeklyStats.timeSpent}</Text>
            <Text style={styles.overviewLabel}>دقيقة</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 نشاط الأسبوع</Text>
          <View style={styles.chartContainer}>
            {progressData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={[COLORS.primary, '#2E7D32']}
                    style={[styles.bar, { height: `${(item.value / maxValue) * 100}%` }]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accuracy Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 دقة الحفظ</Text>
          <View style={styles.accuracyContainer}>
            <View style={styles.accuracyCircle}>
              <Text style={styles.accuracyValue}>{weeklyStats.accuracy}%</Text>
              <Text style={styles.accuracyLabel}>متوسط الدقة</Text>
            </View>
            <View style={styles.accuracyDetails}>
              <View style={styles.accuracyItem}>
                <Text style={styles.accuracyItemIcon}>✅</Text>
                <Text style={styles.accuracyItemText}>إجابات صحيحة: {Math.round(weeklyStats.reviewsDone * weeklyStats.accuracy / 100)}</Text>
              </View>
              <View style={styles.accuracyItem}>
                <Text style={styles.accuracyItemIcon}>❌</Text>
                <Text style={styles.accuracyItemText}>إجابات خاطئة: {Math.round(weeklyStats.reviewsDone * (100 - weeklyStats.accuracy) / 100)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Best/Worst Days */}
        <View style={styles.daysRow}>
          <View style={[styles.dayCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.dayIcon}>🌟</Text>
            <Text style={styles.dayTitle}>أفضل يوم</Text>
            <Text style={styles.dayValue}>{weeklyStats.bestDay}</Text>
          </View>
          <View style={[styles.dayCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.dayIcon}>📉</Text>
            <Text style={styles.dayTitle}>يحتاج تحسين</Text>
            <Text style={styles.dayValue}>{weeklyStats.worstDay}</Text>
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 توصيات الذكاء الاصطناعي</Text>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>💡</Text>
            <Text style={styles.recommendationText}>
              أداؤك ممتاز في أيام الجمعة! حاول تخصيص وقت إضافي للمراجعة في بداية الأسبوع.
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>🎯</Text>
            <Text style={styles.recommendationText}>
              دقة حفظك عالية. يمكنك زيادة عدد الآيات اليومية من 5 إلى 7 آيات.
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>🔥</Text>
            <Text style={styles.recommendationText}>
              سلسلتك الحالية {streak} يوم! استمر للوصول إلى 30 يوم والحصول على مكافأة خاصة.
            </Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 ملخص التقدم</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>المستوى الحالي</Text>
            <Text style={styles.summaryValue}>المستوى {level}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(totalXP % 100)}%` }]} />
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>إجمالي النقاط</Text>
            <Text style={styles.summaryValue}>{totalXP} XP</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>الجواهر المكتسبة</Text>
            <Text style={styles.summaryValue}>{gems} 💎</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>أطول سلسلة</Text>
            <Text style={styles.summaryValue}>{streak} يوم 🔥</Text>
          </View>
        </View>

        {/* Memorization Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 إحصائيات الحفظ</Text>
          <View style={styles.memStatsRow}>
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalAyahsMemorized}</Text>
              <Text style={styles.memStatLabel}>آية</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalSurahsCompleted}</Text>
              <Text style={styles.memStatLabel}>سورة</Text>
            </View>
            <View style={styles.memStatDivider} />
            <View style={styles.memStatItem}>
              <Text style={styles.memStatValue}>{totalJuzCompleted}</Text>
              <Text style={styles.memStatLabel}>جزء</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#fff', fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  overviewCard: { width: (width - 60) / 3, borderRadius: 15, padding: 15, alignItems: 'center' },
  overviewIcon: { fontSize: 24, marginBottom: 5 },
  overviewValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  overviewLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 120, width: 25, backgroundColor: '#E0E0E0', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 10, color: '#666', marginTop: 5 },
  accuracyContainer: { flexDirection: 'row', alignItems: 'center' },
  accuracyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  accuracyValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  accuracyLabel: { fontSize: 10, color: '#666' },
  accuracyDetails: { flex: 1 },
  accuracyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  accuracyItemIcon: { fontSize: 16, marginRight: 10 },
  accuracyItemText: { fontSize: 14, color: '#666' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayCard: { width: (width - 50) / 2, borderRadius: 15, padding: 20, alignItems: 'center' },
  dayIcon: { fontSize: 30, marginBottom: 10 },
  dayTitle: { fontSize: 12, color: '#666' },
  dayValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 5 },
  recommendation: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, marginBottom: 10 },
  recommendationIcon: { fontSize: 20, marginRight: 10 },
  recommendationText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 22 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginVertical: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  memStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  memStatItem: { alignItems: 'center' },
  memStatValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  memStatLabel: { fontSize: 14, color: '#666', marginTop: 5 },
  memStatDivider: { width: 1, height: 50, backgroundColor: '#E0E0E0' }
});
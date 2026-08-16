/**
 * ============================================
 * 📱 LessonCompleteScreen.tsx - Salifz
 * ============================================
 * ✅ FIXED: Navigates to Lessons tab instead of Home
 * ✅ DEBUG: Console logs on every action
 * ✅ CONVERTED: i18n integration
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Share, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGamificationStore, useStreakStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const LOG_PREFIX = '[LessonCompleteScreen.tsx]';
const { width } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);

export default function LessonCompleteScreen({ route, navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component rendering...`);
  console.log(`${LOG_PREFIX} 📥 Route params:`, JSON.stringify(route?.params || {}));
  
  const { surah, xpEarned, exercisesCount, blocksCompleted, totalBlocks } = route.params || {};
  
  console.log(`${LOG_PREFIX} 📖 Surah:`, JSON.stringify(surah));
  console.log(`${LOG_PREFIX} ⚡ XP Earned: ${xpEarned}`);
  console.log(`${LOG_PREFIX} 📝 Exercises Count: ${exercisesCount}`);
  console.log(`${LOG_PREFIX} 📦 Blocks: ${blocksCompleted}/${totalBlocks}`);
  
  const { streak } = useGamificationStore();
  const { updateStreak } = useStreakStore();
  
  console.log(`${LOG_PREFIX} 🔥 Current streak from store: ${streak}`);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect triggered - Component mounted`);
    
    console.log(`${LOG_PREFIX} 📳 Triggering success haptic feedback`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    console.log(`${LOG_PREFIX} 🎬 Starting entrance animations`);
    
    Animated.sequence([
      Animated.spring(scaleAnim, { 
        toValue: 1, 
        tension: 50, 
        friction: 7, 
        useNativeDriver: true 
      }),
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 500, 
        useNativeDriver: true 
      })
    ]).start(() => {
      console.log(`${LOG_PREFIX} ✅ Entrance animations completed`);
    });

    // Update streak with earned data
    console.log(`${LOG_PREFIX} 🔄 Calling updateStreak()`);
    
    try {
      updateStreak({ xp: xpEarned, versesMemorized: exercisesCount });
      console.log(`${LOG_PREFIX} ✅ Streak updated successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ ERROR updating streak:`, error);
    }
    
    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup - Component unmounting`);
    };
  }, []);

  const handleShare = async () => {
    console.log(`${LOG_PREFIX} 📤 handleShare() called`);
    
    try {
      // ✅ AVANT: Message hardcodé en arabe
      const shareMessage = t('lessonComplete.shareMessage', {
        surahName: surah?.name || t('lessonComplete.quran'),
        ayahsCount: exercisesCount,
        xp: xpEarned,
        streak: streak
      });
      
      console.log(`${LOG_PREFIX} 📝 Share message prepared`);
      
      const result = await Share.share({ message: shareMessage });
      
      if (result.action === Share.sharedAction) {
        console.log(`${LOG_PREFIX} ✅ Content shared successfully`);
      } else if (result.action === Share.dismissedAction) {
        console.log(`${LOG_PREFIX} ❌ Share dialog dismissed`);
      }
      
    } catch (error: any) { 
      console.error(`${LOG_PREFIX} ❌ ERROR in handleShare():`, error);
    }
  };

  const handleContinue = () => {
    console.log(`${LOG_PREFIX} ▶️ handleContinue() called`);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // ✅ FIXED: Navigate to Main with LessonsTab active
    console.log(`${LOG_PREFIX} 🧭 Navigating to Main -> LessonsTab`);
    
    navigation.reset({
      index: 0,
      routes: [
        { 
          name: 'Main',
          state: {
            routes: [
              { name: 'HomeTab' },
              { name: 'LessonsTab' },
              { name: 'StreakTab' },
              { name: 'LeaderboardTab' },
              { name: 'ProfileTab' },
            ],
            index: 1, // Index 1 = LessonsTab
          }
        }
      ],
    });
    
    console.log(`${LOG_PREFIX} ✅ Navigation triggered to LessonsTab`);
  };

  const handleContinueSurah = () => {
    console.log(`${LOG_PREFIX} ▶️ handleContinueSurah() - Continue with next block`);
    
    if (blocksCompleted < totalBlocks) {
      // Go back to lesson detail with next block
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.goBack();
    } else {
      handleContinue();
    }
  };

  // Calculate derived values
  const gemsEarned = Math.floor((xpEarned || 0) / 10);
  const isMilestone = streak % 7 === 0 && streak > 0;
  const surahComplete = blocksCompleted >= totalBlocks;
  const progressPercent = totalBlocks > 0 ? Math.round((blocksCompleted / totalBlocks) * 100) : 0;
  
  console.log(`${LOG_PREFIX} 💎 Gems calculated: ${gemsEarned}`);
  console.log(`${LOG_PREFIX} 🏆 Is milestone (7-day streak): ${isMilestone}`);
  console.log(`${LOG_PREFIX} 📊 Surah complete: ${surahComplete}, Progress: ${progressPercent}%`);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Trophy */}
        <View style={styles.trophyContainer}>
          <Text style={styles.trophyEmoji}>{surahComplete ? '🏆' : '⭐'}</Text>
        </View>

        {/* ✅ AVANT: 'ممتاز!' / 'أحسنت!' */}
        <Text style={styles.title}>
          {surahComplete ? t('lessonComplete.excellent') : t('lessonComplete.wellDone')}
        </Text>
        
        {/* ✅ AVANT: 'أكملت سورة X بالكامل!' / 'أكملت X من Y أجزاء في Z' */}
        <Text style={styles.subtitle}>
          {surahComplete 
            ? t('lessonComplete.completedSurah', { surahName: surah?.name || t('lessonComplete.memorization') })
            : t('lessonComplete.completedBlocks', { 
                completed: blocksCompleted, 
                total: totalBlocks, 
                surahName: surah?.name 
              })
          }
        </Text>

        {/* Progress bar for surah */}
        {!surahComplete && (
          <View style={styles.surahProgress}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            {/* ✅ AVANT: 'X% من السورة' */}
            <Text style={styles.progressText}>
              {t('lessonComplete.surahProgress', { percent: progressPercent })}
            </Text>
          </View>
        )}

        {/* Rewards Card */}
        <Animated.View style={[styles.rewardsCard, { opacity: fadeAnim }]}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⚡</Text>
            <Text style={styles.rewardValue}>+{xpEarned || 0}</Text>
            <Text style={styles.rewardLabel}>XP</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>💎</Text>
            <Text style={styles.rewardValue}>+{gemsEarned}</Text>
            {/* ✅ AVANT: 'جواهر' */}
            <Text style={styles.rewardLabel}>{t('lessonComplete.gems')}</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🔥</Text>
            <Text style={styles.rewardValue}>{streak || 0}</Text>
            {/* ✅ AVANT: 'سلسلة' */}
            <Text style={styles.rewardLabel}>{t('lessonComplete.streak')}</Text>
          </View>
        </Animated.View>

        {/* Milestone Card */}
        {isMilestone && (
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneEmoji}>🎉</Text>
            {/* ✅ AVANT: 'إنجاز: X يوم متتالي!' */}
            <Text style={styles.milestoneText}>
              {t('lessonComplete.milestone', { days: streak })}
            </Text>
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            {/* ✅ AVANT: 'الدقة' */}
            <Text style={styles.statLabel}>{t('lessonComplete.accuracy')}</Text>
            <Text style={styles.statValue}>95%</Text>
          </View>
          <View style={styles.statItem}>
            {/* ✅ AVANT: 'التمارين' */}
            <Text style={styles.statLabel}>{t('lessonComplete.exercises')}</Text>
            <Text style={styles.statValue}>{exercisesCount || 0}</Text>
          </View>
          <View style={styles.statItem}>
            {/* ✅ AVANT: 'الأجزاء' */}
            <Text style={styles.statLabel}>{t('lessonComplete.blocks')}</Text>
            <Text style={styles.statValue}>{blocksCompleted}/{totalBlocks}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareIcon}>📤</Text>
          {/* ✅ AVANT: 'مشاركة' */}
          <Text style={styles.shareText}>{t('lessonComplete.share')}</Text>
        </TouchableOpacity>
        
        {!surahComplete && (
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueSurah}>
            <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.continueGradient}>
              {/* ✅ AVANT: 'متابعة السورة' */}
              <Text style={styles.continueText}>{t('lessonComplete.continueSurah')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.continueButton, !surahComplete && { flex: 0.5 }]} 
          onPress={handleContinue}
        >
          <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.continueGradient}>
            {/* ✅ AVANT: 'سورة جديدة' / 'الدروس' */}
            <Text style={styles.continueText}>
              {surahComplete ? t('lessonComplete.newSurah') : t('lessonComplete.lessons')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  trophyContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  trophyEmoji: { fontSize: 60 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 20, textAlign: 'center' },
  
  surahProgress: { width: '80%', marginBottom: 20 },
  progressBarContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5, textAlign: 'center' },
  
  rewardsCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20 
  },
  rewardItem: { alignItems: 'center', paddingHorizontal: 25 },
  rewardIcon: { fontSize: 30, marginBottom: 5 },
  rewardValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  rewardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  rewardDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  milestoneCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFD700', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 25, 
    marginBottom: 20 
  },
  milestoneEmoji: { fontSize: 20, marginRight: 10 },
  milestoneText: { color: '#333', fontWeight: 'bold' },
  statsCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 15, 
    padding: 15 
  },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buttonsContainer: { flexDirection: 'row', padding: 20, paddingBottom: 40 },
  shareButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderRadius: 25, 
    marginRight: 10 
  },
  shareIcon: { fontSize: 18, marginRight: 5 },
  shareText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  continueButton: { flex: 1, borderRadius: 25, overflow: 'hidden', marginLeft: 5 },
  continueGradient: { paddingVertical: 18, alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
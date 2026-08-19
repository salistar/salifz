/**
 * ============================================
 * 📱 GoalSetupScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import { IconeDefis, IconeVersetDuJour } from '../../components/common/Icones';

const LOG_PREFIX = '[GoalSetupScreen.tsx]';
const { width } = Dimensions.get('window');

console.log(`${LOG_PREFIX} 📁 File loaded`);

interface DailyGoal {
  id: number;
  ayahs: number;
  labelKey: string;
  emoji: string;
  timeKey: string;
  descriptionKey: string;
}

interface ReminderTime {
  id: string;
  labelKey: string;
  emoji: string;
  time: string;
}

const DAILY_GOALS: DailyGoal[] = [
  { id: 1, ayahs: 3, labelKey: 'goalSetup.goals.beginner', emoji: '🌱', timeKey: 'goalSetup.goals.time5min', descriptionKey: 'goalSetup.goals.beginnerDesc' },
  { id: 2, ayahs: 5, labelKey: 'goalSetup.goals.regular', emoji: '📚', timeKey: 'goalSetup.goals.time10min', descriptionKey: 'goalSetup.goals.regularDesc' },
  { id: 3, ayahs: 10, labelKey: 'goalSetup.goals.serious', emoji: '🔥', timeKey: 'goalSetup.goals.time20min', descriptionKey: 'goalSetup.goals.seriousDesc' },
  { id: 4, ayahs: 20, labelKey: 'goalSetup.goals.advanced', emoji: '🚀', timeKey: 'goalSetup.goals.time30min', descriptionKey: 'goalSetup.goals.advancedDesc' }
];

const REMINDER_TIMES: ReminderTime[] = [
  { id: 'fajr', labelKey: 'goalSetup.reminders.afterFajr', emoji: '🌅', time: '05:30' },
  { id: 'morning', labelKey: 'goalSetup.reminders.morning', emoji: '☀️', time: '08:00' },
  { id: 'afternoon', labelKey: 'goalSetup.reminders.afternoon', emoji: '🌤️', time: '13:00' },
  { id: 'evening', labelKey: 'goalSetup.reminders.evening', emoji: '🌇', time: '18:00' },
  { id: 'night', labelKey: 'goalSetup.reminders.night', emoji: '🌙', time: '21:00' }
];

export default function GoalSetupScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);

  const { updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null);

  const handleGoalSelect = (goalId: number) => {
    console.log(`${LOG_PREFIX} 🎯 Goal selected: ${goalId}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(goalId);
  };

  const handleReminderSelect = (reminderId: string) => {
    console.log(`${LOG_PREFIX} ⏰ Reminder selected: ${reminderId}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReminder(reminderId);
  };

  const handleContinue = () => {
    console.log(`${LOG_PREFIX} ▶️ handleContinue() - step: ${step}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step === 1 && selectedGoal) {
      console.log(`${LOG_PREFIX} 📊 Moving to step 2`);
      setStep(2);
    } else if (step === 2) {
      const goal = DAILY_GOALS.find(g => g.id === selectedGoal);
      const reminder = REMINDER_TIMES.find(r => r.id === selectedReminder);

      console.log(`${LOG_PREFIX} 💾 Saving preferences: goal=${goal?.ayahs}, reminder=${reminder?.time}`);

      const currentProfile = useAuthStore.getState().user?.profile;
      updateUser({
        profile: {
          ...currentProfile,
          dailyGoal: goal?.ayahs || 5,
          reminderTime: reminder?.time || '08:00',
          notificationsEnabled: true
        }
      } as any);

      console.log(`${LOG_PREFIX} 🧭 Navigating to Main`);
      navigation.replace('Main');
    }
  };

  return (
    <LinearGradient colors={[colors.canvasDeep, colors.canvasDeepAlt]} style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
        <Text style={styles.progressText}>
          {t('goalSetup.stepOf', { current: step, total: 2 })}
        </Text>
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconeDefis size={44} color={colors.onDeep} />
            <Text style={styles.headerTitle}>{t('goalSetup.step1.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('goalSetup.step1.subtitle')}</Text>
          </View>
          <View style={styles.optionsContainer}>
            {DAILY_GOALS.map((goal) => (
              <TouchableOpacity accessible accessibilityRole="button"
                key={goal.id}
                style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardSelected]}
                onPress={() => handleGoalSelect(goal.id)}
              >
                <View style={styles.goalEmoji}>
                  <Text style={styles.goalEmojiText}>{goal.emoji}</Text>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>{t(goal.labelKey)}</Text>
                  <Text style={styles.goalAyahs}>
                    {t('goalSetup.goals.ayahsDaily', { count: goal.ayahs })}
                  </Text>
                  <Text style={styles.goalTime}>{t(goal.timeKey)}</Text>
                </View>
                <View style={styles.goalDescription}>
                  <Text style={styles.goalDescText}>{t(goal.descriptionKey)}</Text>
                </View>
                {selectedGoal === goal.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tipCard}>
            <IconeVersetDuJour size={20} color={colors.accent} />
            <Text style={styles.tipText}>{t('goalSetup.tip')}</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>⏰</Text>
            <Text style={styles.headerTitle}>{t('goalSetup.step2.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('goalSetup.step2.subtitle')}</Text>
          </View>
          <View style={styles.reminderContainer}>
            {REMINDER_TIMES.map((reminder) => (
              <TouchableOpacity accessible accessibilityRole="button"
                key={reminder.id}
                style={[styles.reminderCard, selectedReminder === reminder.id && styles.reminderCardSelected]}
                onPress={() => handleReminderSelect(reminder.id)}
              >
                <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                <Text style={styles.reminderLabel}>{t(reminder.labelKey)}</Text>
                <Text style={styles.reminderTime}>{reminder.time}</Text>
                {selectedReminder === reminder.id && (
                  <View style={styles.reminderCheck}>
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.skipReminder}
            onPress={() => {
              console.log(`${LOG_PREFIX} ⏭️ Skip reminder pressed`);
              setSelectedReminder(null);
              handleContinue();
            }}
          >
            <Text style={styles.skipReminderText}>{t('goalSetup.skipReminder')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.bottomContainer}>
        {step === 2 && (
          <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => {
            console.log(`${LOG_PREFIX} ◀️ Back button pressed`);
            setStep(1);
          }}>
            <Text style={styles.backButtonText}>← {t('common.back')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessible accessibilityRole="button"
          style={[styles.continueButton, (!selectedGoal && step === 1) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedGoal && step === 1}
        >
          <LinearGradient
            colors={(selectedGoal || step === 2) ? [colors.primary, colors.primaryDark] : [colors.textSecondary, '#555']}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {step === 1 ? t('common.next') : t('goalSetup.startMemorizing')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { paddingTop: 50, paddingHorizontal: 25, marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.primary, borderRadius: 3 },
  progressText: { color: '#aaa', textAlign: 'center', marginTop: 10, fontSize: 13 },
  content: { paddingHorizontal: 25, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerEmoji: { marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: c.onDeep, marginBottom: 10 },
  headerSubtitle: { color: '#aaa', fontSize: 16 },
  optionsContainer: { marginBottom: 20 },
  goalCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  goalCardSelected: { borderColor: c.primary, backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  goalEmoji: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  goalEmojiText: { fontSize: 30 },
  goalInfo: { flex: 1, marginLeft: 15 },
  goalLabel: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  goalAyahs: { color: c.primary, marginTop: 3 },
  goalTime: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  goalDescription: { position: 'absolute', right: 15, bottom: 15 },
  goalDescText: { color: '#888', fontSize: 11 },
  selectedBadge: { position: 'absolute', top: 15, right: 15, width: 25, height: 25, borderRadius: 12.5, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
  selectedCheck: {},
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,193,7,0.1)', padding: 15, borderRadius: 12 },
  tipEmoji: { marginRight: 10 },
  tipText: { color: '#FFD54F', flex: 1 },
  reminderContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  reminderCard: { width: (width - 60) / 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: 'transparent' },
  reminderCardSelected: { borderColor: c.primary, backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  reminderEmoji: { fontSize: 35, marginBottom: 10 },
  reminderLabel: { color: c.onDeep, fontSize: 16, fontWeight: '600' },
  reminderTime: { color: '#aaa', marginTop: 5 },
  reminderCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
  checkText: {},
  skipReminder: { alignItems: 'center', padding: 15 },
  skipReminderText: { color: '#aaa' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 25, paddingBottom: 40, paddingTop: 15, backgroundColor: c.canvasDeep },
  backButton: { justifyContent: 'center', paddingRight: 15 },
  backButtonText: { color: '#aaa' },
  continueButton: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  continueButtonText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' }
});
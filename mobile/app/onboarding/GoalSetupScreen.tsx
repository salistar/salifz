import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';

const { width } = Dimensions.get('window');

const DAILY_GOALS = [
  { id: 1, ayahs: 3, label: 'مبتدئ', emoji: '🌱', time: '5 دقائق', description: 'مثالي للمبتدئين' },
  { id: 2, ayahs: 5, label: 'منتظم', emoji: '📚', time: '10 دقائق', description: 'تقدم ثابت ومستمر' },
  { id: 3, ayahs: 10, label: 'جاد', emoji: '🔥', time: '20 دقيقة', description: 'للمتحمسين' },
  { id: 4, ayahs: 20, label: 'متقدم', emoji: '🚀', time: '30+ دقيقة', description: 'تحدٍ حقيقي' }
];

const REMINDER_TIMES = [
  { id: 'fajr', label: 'بعد الفجر', emoji: '🌅', time: '05:30' },
  { id: 'morning', label: 'الصباح', emoji: '☀️', time: '08:00' },
  { id: 'afternoon', label: 'الظهيرة', emoji: '🌤️', time: '13:00' },
  { id: 'evening', label: 'المساء', emoji: '🌇', time: '18:00' },
  { id: 'night', label: 'الليل', emoji: '🌙', time: '21:00' }
];

export default function GoalSetupScreen({ navigation }: any) {
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null);

  const handleGoalSelect = (goalId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(goalId);
  };

  const handleReminderSelect = (reminderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReminder(reminderId);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 1 && selectedGoal) {
      setStep(2);
    } else if (step === 2) {
      const goal = DAILY_GOALS.find(g => g.id === selectedGoal);
      const reminder = REMINDER_TIMES.find(r => r.id === selectedReminder);

      const currentProfile = useAuthStore.getState().user?.profile;
      updateUser({
        profile: {
          ...currentProfile,
          dailyGoal: goal?.ayahs || 5,
          reminderTime: reminder?.time || '08:00',
          notificationsEnabled: true
        }
      } as any);

      navigation.replace('Main');
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
        <Text style={styles.progressText}>الخطوة {step} من 2</Text>
      </View>

      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🎯</Text>
            <Text style={styles.headerTitle}>اختر هدفك اليومي</Text>
            <Text style={styles.headerSubtitle}>كم آية تريد أن تحفظ كل يوم؟</Text>
          </View>
          <View style={styles.optionsContainer}>
            {DAILY_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardSelected]}
                onPress={() => handleGoalSelect(goal.id)}
              >
                <View style={styles.goalEmoji}>
                  <Text style={styles.goalEmojiText}>{goal.emoji}</Text>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>{goal.label}</Text>
                  <Text style={styles.goalAyahs}>{goal.ayahs} آيات يومياً</Text>
                  <Text style={styles.goalTime}>{goal.time}</Text>
                </View>
                <View style={styles.goalDescription}>
                  <Text style={styles.goalDescText}>{goal.description}</Text>
                </View>
                {selectedGoal === goal.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedCheck}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>يمكنك تغيير هدفك في أي وقت من الإعدادات</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>⏰</Text>
            <Text style={styles.headerTitle}>وقت التذكير</Text>
            <Text style={styles.headerSubtitle}>متى تريد أن نذكرك بالحفظ؟</Text>
          </View>
          <View style={styles.reminderContainer}>
            {REMINDER_TIMES.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[styles.reminderCard, selectedReminder === reminder.id && styles.reminderCardSelected]}
                onPress={() => handleReminderSelect(reminder.id)}
              >
                <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
                <Text style={styles.reminderLabel}>{reminder.label}</Text>
                <Text style={styles.reminderTime}>{reminder.time}</Text>
                {selectedReminder === reminder.id && (
                  <View style={styles.reminderCheck}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.skipReminder}
            onPress={() => {
              setSelectedReminder(null);
              handleContinue();
            }}
          >
            <Text style={styles.skipReminderText}>تخطي - سأتذكر بنفسي</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.bottomContainer}>
        {step === 2 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <Text style={styles.backButtonText}>← رجوع</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.continueButton, (!selectedGoal && step === 1) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedGoal && step === 1}
        >
          <LinearGradient
            colors={(selectedGoal || step === 2) ? [COLORS.primary, '#2E7D32'] : ['#666', '#555']}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {step === 1 ? 'التالي' : 'ابدأ الحفظ 🚀'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { paddingTop: 50, paddingHorizontal: 25, marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { color: '#aaa', textAlign: 'center', marginTop: 10, fontSize: 13 },
  content: { paddingHorizontal: 25, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerEmoji: { fontSize: 60, marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  headerSubtitle: { color: '#aaa', fontSize: 16 },
  optionsContainer: { marginBottom: 20 },
  goalCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  goalCardSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  goalEmoji: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  goalEmojiText: { fontSize: 30 },
  goalInfo: { flex: 1, marginLeft: 15 },
  goalLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  goalAyahs: { color: '#4CAF50', marginTop: 3 },
  goalTime: { color: '#666', fontSize: 12, marginTop: 2 },
  goalDescription: { position: 'absolute', right: 15, bottom: 15 },
  goalDescText: { color: '#888', fontSize: 11 },
  selectedBadge: { position: 'absolute', top: 15, right: 15, width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  selectedCheck: { color: '#fff', fontWeight: 'bold' },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,193,7,0.1)', padding: 15, borderRadius: 12 },
  tipEmoji: { fontSize: 20, marginRight: 10 },
  tipText: { color: '#FFD54F', flex: 1 },
  reminderContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  reminderCard: { width: (width - 60) / 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: 'transparent' },
  reminderCardSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  reminderEmoji: { fontSize: 35, marginBottom: 10 },
  reminderLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reminderTime: { color: '#aaa', marginTop: 5 },
  reminderCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  checkText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  skipReminder: { alignItems: 'center', padding: 15 },
  skipReminderText: { color: '#aaa' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 25, paddingBottom: 40, paddingTop: 15, backgroundColor: '#1a1a2e' },
  backButton: { justifyContent: 'center', paddingRight: 15 },
  backButtonText: { color: '#aaa' },
  continueButton: { flex: 1, borderRadius: 15, overflow: 'hidden' },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
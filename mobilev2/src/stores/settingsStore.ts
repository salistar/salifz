/**
 * Settings Store - Salifz
 * Manages app settings and preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'ar' | 'en' | 'fr';
type Theme = 'light' | 'dark' | 'auto';
type Reciter = 'mishary' | 'sudais' | 'husary' | 'minshawi' | 'ghamdi' | 'ajamy';

interface SettingsState {
  // Display
  language: Language;
  theme: Theme;
  fontSize: number;
  
  // Audio
  reciter: Reciter | string;
  autoPlayAudio: boolean;
  repeatCount: number;
  playbackSpeed: number;
  
  // Notifications
  notificationsEnabled: boolean;
  notifications: boolean;
  reminderTime: string;
  streakReminder: boolean;
  dailyVerseEnabled: boolean;
  
  // Learning
  dailyGoal: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  hapticFeedback: boolean;
  
  // Privacy
  publicProfile: boolean;
  showOnLeaderboard: boolean;
  
  // Actions
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setReciter: (reciter: Reciter | string) => void;
  setAutoPlayAudio: (enabled: boolean) => void;
  setRepeatCount: (count: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setStreakReminder: (enabled: boolean) => void;
  setDailyVerseEnabled: (enabled: boolean) => void;
  setDailyGoal: (goal: number) => void;
  setShowTranslation: (show: boolean) => void;
  setShowTransliteration: (show: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setPublicProfile: (isPublic: boolean) => void;
  setShowOnLeaderboard: (show: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  language: 'ar' as Language,
  theme: 'auto' as Theme,
  fontSize: 24,
  reciter: 'mishary' as Reciter,
  autoPlayAudio: true,
  repeatCount: 3,
  playbackSpeed: 1,
  notificationsEnabled: true,
  notifications: true,
  reminderTime: '08:00',
  streakReminder: true,
  dailyVerseEnabled: true,
  dailyGoal: 5,
  showTranslation: true,
  showTransliteration: false,
  hapticFeedback: true,
  publicProfile: true,
  showOnLeaderboard: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setReciter: (reciter) => set({ reciter }),
      setAutoPlayAudio: (autoPlayAudio) => set({ autoPlayAudio }),
      setRepeatCount: (repeatCount) => set({ repeatCount }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotifications: (notifications) => set({ notifications, notificationsEnabled: notifications }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      setStreakReminder: (streakReminder) => set({ streakReminder }),
      setDailyVerseEnabled: (dailyVerseEnabled) => set({ dailyVerseEnabled }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
      setPublicProfile: (publicProfile) => set({ publicProfile }),
      setShowOnLeaderboard: (showOnLeaderboard) => set({ showOnLeaderboard }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'salifz-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSettingsStore;